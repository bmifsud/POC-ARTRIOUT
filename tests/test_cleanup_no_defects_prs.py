#!/usr/bin/env python3
"""
Unit tests for scripts/cleanup_no_defects_prs.py
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure scripts directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../scripts")))

from cleanup_no_defects_prs import (
    extract_task_id,
    delete_session_data,
    cleanup_pull_requests,
    TARGET_PHRASE,
)


class TestExtractTaskId(unittest.TestCase):
    def test_extract_task_id_valid(self):
        self.assertEqual(
            extract_task_id("jules-15064579202751100969-2604f2db"),
            "15064579202751100969"
        )
        self.assertEqual(
            extract_task_id("feat/task-987654321"),
            "987654321"
        )
        self.assertEqual(
            extract_task_id("fix/qodo-review-pr-49-defects-15831267924699464833"),
            "15831267924699464833"
        )

    def test_extract_task_id_no_digits(self):
        self.assertIsNone(extract_task_id("feat/no-numeric-id"))
        self.assertIsNone(extract_task_id(""))
        self.assertIsNone(extract_task_id(None))


class TestDeleteSessionData(unittest.TestCase):
    @patch("requests.Session")
    def test_delete_session_data_success(self, mock_session_cls):
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_session.delete.return_value = mock_response

        res = delete_session_data("http://localhost:8080/api/sessions", "123456", dry_run=False, session=mock_session)
        self.assertTrue(res)
        self.assertGreaterEqual(mock_session.delete.call_count, 1)

    def test_delete_session_data_dry_run(self):
        mock_session = MagicMock()
        res = delete_session_data("http://localhost:8080/api/sessions", "123456", dry_run=True, session=mock_session)
        self.assertTrue(res)
        mock_session.delete.assert_not_called()

    def test_delete_session_data_missing_task_id(self):
        res = delete_session_data("http://localhost:8080/api/sessions", "")
        self.assertFalse(res)


class TestCleanupPullRequests(unittest.TestCase):
    @patch("cleanup_no_defects_prs.delete_session_data")
    @patch("cleanup_no_defects_prs.Github")
    def test_cleanup_pull_requests_matching(self, mock_github_cls, mock_delete_session):
        mock_github = MagicMock()
        mock_github_cls.return_value = mock_github

        mock_repo = MagicMock()
        mock_github.get_repo.return_value = mock_repo

        # PR 1: matches TARGET_PHRASE
        mock_pr1 = MagicMock()
        mock_pr1.number = 101
        mock_pr1.title = "Fix issue"
        mock_pr1.body = f"Automated fix. Task #123456: {TARGET_PHRASE}."
        mock_pr1.head.ref = "fix/task-123456"

        # PR 2: does not match TARGET_PHRASE
        mock_pr2 = MagicMock()
        mock_pr2.number = 102
        mock_pr2.title = "Add feature"
        mock_pr2.body = "This PR introduces new functionality with bugs fixed."
        mock_pr2.head.ref = "feat/new-ui-7890"

        mock_repo.get_pulls.return_value = [mock_pr1, mock_pr2]

        mock_ref = MagicMock()
        mock_repo.get_git_ref.return_value = mock_ref

        processed = cleanup_pull_requests(
            github_token="fake_token",
            repo_name="owner/repo",
            session_api_url="http://localhost:8080/api/sessions",
            dry_run=False
        )

        self.assertEqual(processed, 1)
        mock_pr1.edit.assert_called_once_with(state="closed")
        mock_pr2.edit.assert_not_called()

        mock_repo.get_git_ref.assert_called_once_with("heads/fix/task-123456")
        mock_ref.delete.assert_called_once()

        mock_delete_session.assert_called_once_with(
            "http://localhost:8080/api/sessions",
            "123456",
            dry_run=False
        )

    @patch("cleanup_no_defects_prs.delete_session_data")
    @patch("cleanup_no_defects_prs.Github")
    def test_cleanup_pull_requests_dry_run(self, mock_github_cls, mock_delete_session):
        mock_github = MagicMock()
        mock_github_cls.return_value = mock_github

        mock_repo = MagicMock()
        mock_github.get_repo.return_value = mock_repo

        mock_pr = MagicMock()
        mock_pr.number = 201
        mock_pr.title = "Automated PR"
        mock_pr.body = f"Status: {TARGET_PHRASE}."
        mock_pr.head.ref = "jules-999999-abc"

        mock_repo.get_pulls.return_value = [mock_pr]

        processed = cleanup_pull_requests(
            github_token="fake_token",
            repo_name="owner/repo",
            session_api_url="http://localhost:8080/api/sessions",
            dry_run=True
        )

        self.assertEqual(processed, 1)
        mock_pr.edit.assert_not_called()
        mock_repo.get_git_ref.assert_not_called()
        mock_delete_session.assert_called_once_with(
            "http://localhost:8080/api/sessions",
            "999999",
            dry_run=True
        )


if __name__ == "__main__":
    unittest.main()
