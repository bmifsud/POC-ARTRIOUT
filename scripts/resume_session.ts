import type {
  JulesResumeRequest,
  JulesSessionResponse,
  GitHubActionFailurePayload,
  JulesApiError,
} from './jules_types.js';

/**
 * Parses GitHub Action environment variables to create a failure context payload.
 */
export function getGitHubFailurePayloadFromEnv(): GitHubActionFailurePayload {
  const workflow = process.env.GITHUB_WORKFLOW || 'Unknown Workflow';
  const runId = parseInt(process.env.GITHUB_RUN_ID || '0', 10);
  const runAttempt = parseInt(process.env.GITHUB_RUN_ATTEMPT || '1', 10);
  const job = process.env.GITHUB_JOB || 'Unknown Job';
  const action = process.env.GITHUB_ACTION || 'Unknown Action';
  const eventName = process.env.GITHUB_EVENT_NAME || 'Unknown Event';
  const sha = process.env.GITHUB_SHA || '';
  const ref = process.env.GITHUB_REF || '';
  const repository = process.env.GITHUB_REPOSITORY || '';
  const actor = process.env.GITHUB_ACTOR || '';
  const errorMessage =
    process.env.ERROR_LOGS ||
    process.env.ERROR_MESSAGE ||
    process.env.GITHUB_ERROR_MESSAGE ||
    'GitHub Action step execution failed';

  const failedStep = process.env.FAILED_STEP;
  const logsUrl =
    process.env.LOGS_URL ||
    (repository && runId > 0
      ? `https://github.com/${repository}/actions/runs/${runId}`
      : undefined);

  return {
    workflow,
    runId,
    runAttempt,
    job,
    action,
    eventName,
    sha,
    ref,
    repository,
    actor,
    errorMessage,
    ...(failedStep ? { failedStep } : {}),
    ...(logsUrl ? { logsUrl } : {}),
  };
}

/**
 * Constructs a JulesResumeRequest object using environment variables.
 */
export function getResumeRequestFromEnv(): JulesResumeRequest {
  const sessionId = process.env.JULES_SESSION_ID || process.env.SESSION_ID;
  if (!sessionId) {
    throw new Error('Missing required environment variable: JULES_SESSION_ID or SESSION_ID');
  }

  const failurePayload = getGitHubFailurePayloadFromEnv();
  const resumeToken = process.env.JULES_RESUME_TOKEN || process.env.RESUME_TOKEN;
  const promptOverride = process.env.JULES_PROMPT || process.env.PROMPT;

  const prompt =
    promptOverride ||
    `Resume coding session for failed GitHub Action run ${failurePayload.runId} in ${failurePayload.repository}. Error: ${failurePayload.errorMessage}`;

  return {
    sessionId,
    ...(resumeToken ? { resumeToken } : {}),
    prompt,
    context: {
      githubFailure: failurePayload,
    },
  };
}

/**
 * Interacts with the Jules API resume endpoint to trigger session resumption.
 */
export async function resumeSession(options?: {
  apiKey?: string;
  apiUrl?: string;
  request?: JulesResumeRequest;
}): Promise<JulesSessionResponse> {
  const apiKey = options?.apiKey ?? process.env.JULES_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variable: JULES_API_KEY');
  }

  const requestPayload = options?.request ?? getResumeRequestFromEnv();
  const defaultApiUrl = `https://api.jules.dev/v1/sessions/${requestPayload.sessionId}/resume`;
  const apiUrl = options?.apiUrl ?? process.env.JULES_API_URL ?? defaultApiUrl;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error while contacting Jules API: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = (await response.json()) as JulesApiError | Record<string, unknown>;
      if (errorJson && typeof errorJson === 'object') {
        if ('message' in errorJson && typeof errorJson.message === 'string') {
          errorDetail = errorJson.message;
        } else if ('error' in errorJson && typeof errorJson.error === 'string') {
          errorDetail = errorJson.error;
        } else {
          errorDetail = JSON.stringify(errorJson);
        }
      }
    } catch {
      // If response body is not valid JSON, retain statusText
    }
    throw new Error(`Jules API request failed with status ${response.status}: ${errorDetail}`);
  }

  let sessionResponse: JulesSessionResponse;
  try {
    sessionResponse = (await response.json()) as JulesSessionResponse;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Malformed response from Jules API: Failed to parse JSON response (${errorMsg})`);
  }

  if (
    !sessionResponse ||
    typeof sessionResponse !== 'object' ||
    typeof sessionResponse.id !== 'string' ||
    typeof sessionResponse.status !== 'string'
  ) {
    throw new Error('Malformed response from Jules API: Response payload is missing required fields (id, status)');
  }

  return sessionResponse;
}

// Execute if run directly as a script
if (
  process.argv[1] &&
  (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('resume_session.ts'))
) {
  resumeSession()
    .then((result) => {
      console.log('Successfully requested Jules session resume:', JSON.stringify(result, null, 2));
    })
    .catch((err: Error) => {
      console.error('Error resuming Jules session:', err.message);
      process.exit(1);
    });
}
