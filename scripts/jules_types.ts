/**
 * Jules API and GitHub Actions Integration Type Definitions
 *
 * This module exports strict TypeScript interfaces and types for interacting
 * with the Jules API and parsing GitHub Actions context payloads.
 *
 * Note: Authentication header format for Jules API:
 * Authorization: Bearer YOUR_JULES_API_TOKEN
 */

/**
 * Execution status of a Jules session.
 */
export type JulesSessionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'waiting_for_input';

/**
 * Payload required to request resuming an existing Jules session.
 */
export interface JulesResumeRequest {
  /**
   * Unique identifier of the session to resume.
   */
  sessionId: string;

  /**
   * Optional token required to validate the resume request.
   */
  resumeToken?: string;

  /**
   * Additional prompt or instructions to pass when resuming.
   */
  prompt?: string;

  /**
   * Contextual key-value pairs or state overrides.
   */
  context?: Record<string, unknown>;
}

/**
 * Request payload for creating a new Jules session.
 */
export interface JulesCreateSessionRequest {
  /**
   * The instruction or prompt for the session.
   */
  prompt: string;

  /**
   * Target repository in owner/repo format.
   */
  repository?: string;

  /**
   * Target git branch.
   */
  branch?: string;

  /**
   * Additional metadata or environment overrides.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Response payload returned by the Jules API for session operations.
 */
export interface JulesSessionResponse {
  /**
   * Unique identifier of the session.
   */
  id: string;

  /**
   * Current status of the session.
   */
  status: JulesSessionStatus;

  /**
   * ISO 8601 timestamp indicating when the session was created.
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp indicating when the session was last updated.
   */
  updatedAt: string;

  /**
   * Result text or artifact reference upon completion.
   */
  result?: string;

  /**
   * Detailed error message if the session status is 'failed'.
   */
  error?: string;
}

/**
 * Standard error structure returned by Jules API endpoints.
 */
export interface JulesApiError {
  /**
   * Machine-readable error code.
   */
  code: string;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Optional details or stack trace payload.
   */
  details?: unknown;
}

/**
 * Payload representing a GitHub Action execution failure context.
 */
export interface GitHubActionFailurePayload {
  /**
   * Name of the workflow that failed.
   */
  workflow: string;

  /**
   * Numeric GitHub workflow run ID.
   */
  runId: number;

  /**
   * Attempt number for the workflow run.
   */
  runAttempt: number;

  /**
   * Name of the specific job that failed.
   */
  job: string;

  /**
   * Action or step identifier where the failure occurred.
   */
  action: string;

  /**
   * Event name that triggered the workflow (e.g. 'push', 'pull_request').
   */
  eventName: string;

  /**
   * Git commit SHA associated with the workflow run.
   */
  sha: string;

  /**
   * Git ref associated with the workflow run.
   */
  ref: string;

  /**
   * Full repository name (e.g., 'owner/repo').
   */
  repository: string;

  /**
   * User or bot that triggered the workflow run.
   */
  actor: string;

  /**
   * Error message or exception detail from the failed step.
   */
  errorMessage: string;

  /**
   * Name of the failed step, if available.
   */
  failedStep?: string;

  /**
   * Direct URL to inspect the workflow run logs.
   */
  logsUrl?: string;

  /**
   * Inputs provided to the workflow or action.
   */
  inputs?: Record<string, unknown>;
}

/**
 * General GitHub Workflow Run context structure.
 */
export interface GitHubWorkflowRunContext {
  /**
   * Repository owner username or organization.
   */
  owner: string;

  /**
   * Repository name.
   */
  repo: string;

  /**
   * Unique numeric run ID.
   */
  runId: number;

  /**
   * Workflow name.
   */
  workflowName: string;

  /**
   * Head branch name.
   */
  headBranch: string;

  /**
   * Commit SHA at the head of the run.
   */
  headSha: string;

  /**
   * Run status (e.g. 'queued', 'in_progress', 'completed').
   */
  status: string;

  /**
   * Run conclusion if completed (e.g. 'success', 'failure', 'cancelled').
   */
  conclusion: string | null;
}
