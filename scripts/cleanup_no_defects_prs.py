#!/usr/bin/env python3
"""
cleanup_no_defects_prs.py

Authenticates with GitHub using PyGithub to find all open pull requests
that contain the phrase "contains no actionable defects" in the body.
For each matching PR:
  1. Closes the pull request.
  2. Deletes the associated head branch from the repository.
  3. Parses the branch name to extract the numeric task ID.
  4. Interacts with the session management API to delete logs, states, and records for that task ID.
"""

import argparse
import logging
import os
import re
import sys
from typing import Optional, List

from github import Github, Auth, GithubException
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("cleanup_no_defects_prs")

TARGET_PHRASE = "contains no actionable defects"


def extract_task_id(branch_name: str) -> Optional[str]:
    """
    Extracts the numeric task ID from a branch name.
    Prioritizes longer digit strings (e.g. task timestamps/IDs) over short numbers.
    """
    if not branch_name:
        return None
    matches: List[str] = re.findall(r'\d+', branch_name)
    if not matches:
        return None
    # Return the longest sequence of digits found
    return max(matches, key=len)


def delete_session_data(
    session_api_url: str,
    task_id: str,
    dry_run: bool = False,
    session: Optional[requests.Session] = None
) -> bool:
    """
    Interacts with the session management API to delete all logs, states, or records
    associated with the given task ID.
    """
    if not task_id:
        logger.warning("No task ID provided for session data deletion.")
        return False

    base_url = session_api_url.rstrip("/")
    # Target endpoints for deleting session logs, states, and records associated with the task
    endpoints = [
        f"{base_url}/{task_id}",
        f"{base_url}/{task_id}/logs",
        f"{base_url}/{task_id}/states",
        f"{base_url}/{task_id}/records"
    ]

    logger.info(f"Deleting session data (logs, states, records) for task ID: {task_id}")
    if dry_run:
        logger.info(f"[DRY-RUN] Would send DELETE requests to endpoints for task ID {task_id}")
        return True

    client = session or requests.Session()
    success = True

    # Primary DELETE request to the session task endpoint
    for endpoint in endpoints:
        try:
            logger.info(f"Sending DELETE to {endpoint}")
            resp = client.delete(endpoint, timeout=10)
            if resp.status_code in (200, 202, 204, 404):
                logger.info(f"Successfully processed DELETE for {endpoint} (HTTP {resp.status_code})")
            else:
                logger.warning(f"Unexpected status HTTP {resp.status_code} from {endpoint}: {resp.text}")
                success = False
        except requests.RequestException as e:
            logger.error(f"Failed to delete session data at {endpoint}: {e}")
            success = False

    return success


def cleanup_pull_requests(
    github_token: str,
    repo_name: str,
    session_api_url: str,
    dry_run: bool = False
) -> int:
    """
    Main function to authenticate with GitHub, search for matching PRs,
    close PRs, delete branches, extract task IDs, and purge session data.
    """
    if hasattr(Auth, "Token"):
        auth = Auth.Token(github_token)
        gh = Github(auth=auth)
    else:
        gh = Github(github_token)

    logger.info(f"Authenticating and fetching repository: {repo_name}")
    repo = gh.get_repo(repo_name)

    open_prs = repo.get_pulls(state="open")
    closed_count = 0

    for pr in open_prs:
        body = pr.body or ""
        if TARGET_PHRASE.lower() in body.lower():
            logger.info(f"Found matching PR #{pr.number}: '{pr.title}'")
            branch_name = pr.head.ref

            # 1. Close Pull Request
            if dry_run:
                logger.info(f"[DRY-RUN] Would close PR #{pr.number}")
            else:
                try:
                    pr.edit(state="closed")
                    logger.info(f"Closed PR #{pr.number}")
                except GithubException as e:
                    logger.error(f"Failed to close PR #{pr.number}: {e}")
                    continue

            # 2. Delete Associated Branch
            if dry_run:
                logger.info(f"[DRY-RUN] Would delete branch '{branch_name}'")
            else:
                try:
                    head_repo = pr.head.repo
                    if head_repo:
                        ref = head_repo.get_git_ref(f"heads/{branch_name}")
                        ref.delete()
                        logger.info(f"Deleted branch '{branch_name}' from repository '{head_repo.full_name}'")
                    else:
                        logger.warning(f"Could not determine head repository to delete branch '{branch_name}'")
                except GithubException as e:
                    logger.warning(f"Could not delete branch '{branch_name}': {e}")

            # 3. Parse Branch Name for Numeric Task ID
            task_id = extract_task_id(branch_name)
            if task_id:
                logger.info(f"Extracted numeric task ID '{task_id}' from branch '{branch_name}'")
                # 4. Interact with Session Management API
                delete_session_data(session_api_url, task_id, dry_run=dry_run)
            else:
                logger.warning(f"Could not extract numeric task ID from branch name '{branch_name}'")

            closed_count += 1

    logger.info(f"Cleanup complete. Total PRs processed: {closed_count}")
    return closed_count


def parse_args():
    parser = argparse.ArgumentParser(
        description="Search open PRs containing 'contains no actionable defects', close PRs, delete branches, and purge session logs/states."
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN"),
        help="GitHub Access Token (or GITHUB_TOKEN / GH_TOKEN env var)"
    )
    parser.add_argument(
        "--repo",
        default=os.environ.get("GITHUB_REPOSITORY"),
        help="GitHub Repository in 'owner/repo' format (or GITHUB_REPOSITORY env var)"
    )
    parser.add_argument(
        "--session-api-url",
        default=os.environ.get("SESSION_API_URL") or os.environ.get("SESSION_MANAGEMENT_API_URL") or "http://localhost:8080/api/sessions",
        help="Base URL for the session management API"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run script in dry-run mode without modifying GitHub or making session DELETE requests"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if not args.token:
        logger.error("GitHub Token is required. Set --token or GITHUB_TOKEN/GH_TOKEN environment variable.")
        sys.exit(1)
    if not args.repo:
        logger.error("GitHub Repository is required. Set --repo or GITHUB_REPOSITORY environment variable.")
        sys.exit(1)

    cleanup_pull_requests(
        github_token=args.token,
        repo_name=args.repo,
        session_api_url=args.session_api_url,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()
