import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resumeSession,
  getGitHubFailurePayloadFromEnv,
  getResumeRequestFromEnv,
} from './resume_session.js';
import type { JulesSessionResponse } from './jules_types.js';

describe('resume_session', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getGitHubFailurePayloadFromEnv', () => {
    it('should parse environment variables into a failure payload', () => {
      process.env.GITHUB_WORKFLOW = 'CI Workflow';
      process.env.GITHUB_RUN_ID = '123456';
      process.env.GITHUB_RUN_ATTEMPT = '2';
      process.env.GITHUB_JOB = 'test-job';
      process.env.GITHUB_ACTION = 'run-tests';
      process.env.GITHUB_EVENT_NAME = 'push';
      process.env.GITHUB_SHA = 'abc123sha';
      process.env.GITHUB_REF = 'refs/heads/main';
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      process.env.GITHUB_ACTOR = 'jules-bot';
      process.env.ERROR_LOGS = 'Unit test failed in test_runner.ts';
      process.env.FAILED_STEP = 'Run unit tests';

      const payload = getGitHubFailurePayloadFromEnv();

      expect(payload).toEqual({
        workflow: 'CI Workflow',
        runId: 123456,
        runAttempt: 2,
        job: 'test-job',
        action: 'run-tests',
        eventName: 'push',
        sha: 'abc123sha',
        ref: 'refs/heads/main',
        repository: 'owner/repo',
        actor: 'jules-bot',
        errorMessage: 'Unit test failed in test_runner.ts',
        failedStep: 'Run unit tests',
        logsUrl: 'https://github.com/owner/repo/actions/runs/123456',
      });
    });

    it('should provide fallback defaults when optional env vars are missing', () => {
      delete process.env.GITHUB_WORKFLOW;
      delete process.env.GITHUB_RUN_ID;
      delete process.env.GITHUB_REPOSITORY;
      delete process.env.ERROR_LOGS;
      delete process.env.ERROR_MESSAGE;

      const payload = getGitHubFailurePayloadFromEnv();

      expect(payload.workflow).toBe('Unknown Workflow');
      expect(payload.runId).toBe(0);
      expect(payload.errorMessage).toBe('GitHub Action step execution failed');
      expect(payload.logsUrl).toBeUndefined();
    });
  });

  describe('getResumeRequestFromEnv', () => {
    it('should construct a resume request payload successfully', () => {
      process.env.JULES_SESSION_ID = 'sess_xyz123';
      process.env.JULES_RESUME_TOKEN = 'tok_abc';
      process.env.GITHUB_RUN_ID = '98765';
      process.env.GITHUB_REPOSITORY = 'org/app';

      const req = getResumeRequestFromEnv();

      expect(req.sessionId).toBe('sess_xyz123');
      expect(req.resumeToken).toBe('tok_abc');
      expect(req.prompt).toContain('98765');
      expect(req.context).toBeDefined();
    });

    it('should throw an error if sessionId is missing', () => {
      delete process.env.JULES_SESSION_ID;
      delete process.env.SESSION_ID;

      expect(() => getResumeRequestFromEnv()).toThrow(
        'Missing required environment variable: JULES_SESSION_ID or SESSION_ID'
      );
    });
  });

  describe('resumeSession', () => {
    it('should successfully call Jules API and return session response', async () => {
      process.env.JULES_API_KEY = 'test_api_key_123';
      process.env.JULES_SESSION_ID = 'sess_456';

      const mockResponse: JulesSessionResponse = {
        id: 'sess_456',
        status: 'running',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:01:00Z',
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);
      globalThis.fetch = fetchSpy;

      const result = await resumeSession();

      expect(result).toEqual(mockResponse);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://api.jules.dev/v1/sessions/sess_456/resume');
      expect(init?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_api_key_123',
      });
    });

    it('should throw error when JULES_API_KEY is missing', async () => {
      delete process.env.JULES_API_KEY;
      process.env.JULES_SESSION_ID = 'sess_123';

      await expect(resumeSession()).rejects.toThrow(
        'Missing required environment variable: JULES_API_KEY'
      );
    });

    it('should throw error when JULES_SESSION_ID is missing', async () => {
      process.env.JULES_API_KEY = 'test_key';
      delete process.env.JULES_SESSION_ID;
      delete process.env.SESSION_ID;

      await expect(resumeSession()).rejects.toThrow(
        'Missing required environment variable: JULES_SESSION_ID or SESSION_ID'
      );
    });

    it('should handle HTTP error responses gracefully', async () => {
      process.env.JULES_API_KEY = 'test_key';
      process.env.JULES_SESSION_ID = 'sess_123';

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid API key provided' }),
      } as unknown as Response);
      globalThis.fetch = fetchSpy;

      await expect(resumeSession()).rejects.toThrow(
        'Jules API request failed with status 401: Invalid API key provided'
      );
    });

    it('should handle network fetch errors gracefully', async () => {
      process.env.JULES_API_KEY = 'test_key';
      process.env.JULES_SESSION_ID = 'sess_123';

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(resumeSession()).rejects.toThrow(
        'Network error while contacting Jules API: Connection refused'
      );
    });

    it('should handle malformed JSON responses', async () => {
      process.env.JULES_API_KEY = 'test_key';
      process.env.JULES_SESSION_ID = 'sess_123';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      } as unknown as Response);

      await expect(resumeSession()).rejects.toThrow(
        'Malformed response from Jules API: Failed to parse JSON response'
      );
    });

    it('should handle missing required fields in JSON response payload', async () => {
      process.env.JULES_API_KEY = 'test_key';
      process.env.JULES_SESSION_ID = 'sess_123';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'running' }), // missing id
      } as unknown as Response);

      await expect(resumeSession()).rejects.toThrow(
        'Malformed response from Jules API: Response payload is missing required fields (id, status)'
      );
    });
  });
});
