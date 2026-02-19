import test from 'node:test';
import assert from 'node:assert/strict';
import { OpsStatusService } from '../apps/api/src/ops/opsStatusService.js';

function createResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

test('ops status returns warning when integrations are not configured', async () => {
  const service = new OpsStatusService({
    env: {},
    fetchImpl: async () => createResponse({}),
    clock: () => new Date('2026-02-19T00:00:00.000Z'),
  });

  const snapshot = await service.snapshot();
  assert.equal(snapshot.status, 'warning');
  assert.equal(snapshot.github.status, 'not_configured');
  assert.equal(snapshot.vercel.status, 'not_configured');
});

test('ops status aggregates github and vercel metrics', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('/actions/runs')) {
      return createResponse({
        workflow_runs: [
          {
            name: 'CI',
            run_number: 22,
            status: 'completed',
            conclusion: 'success',
            html_url: 'https://github.com/org/repo/actions/runs/1',
            head_branch: 'main',
            updated_at: '2026-02-19T00:00:00.000Z',
          },
        ],
      });
    }

    if (url.includes('/pulls')) {
      return createResponse([{ id: 1, draft: false }]);
    }

    if (url.includes('/issues')) {
      return createResponse([
        { id: 1, state: 'open', labels: [{ name: 'phase/1' }] },
        { id: 2, state: 'closed', labels: [{ name: 'phase/1' }] },
        { id: 3, state: 'open', labels: [{ name: 'blocker' }, { name: 'phase/2' }] },
      ]);
    }

    if (url.includes('api.vercel.com')) {
      return createResponse({
        deployments: [
          {
            uid: 'dep_1',
            url: 'budong.vercel.app',
            target: 'production',
            readyState: 'READY',
            createdAt: 1708300800000,
          },
          {
            uid: 'dep_2',
            url: 'preview.vercel.app',
            target: 'preview',
            readyState: 'ERROR',
            createdAt: 1708300700000,
          },
        ],
      });
    }

    return createResponse({}, 404);
  };

  const service = new OpsStatusService({
    env: {
      GITHUB_OWNER: 'org',
      GITHUB_REPO: 'repo',
      GITHUB_TOKEN: 'token',
      VERCEL_TOKEN: 'token',
      VERCEL_PROJECT_ID: 'project_1',
    },
    fetchImpl,
    clock: () => new Date('2026-02-19T00:00:00.000Z'),
  });

  const snapshot = await service.snapshot();
  assert.equal(snapshot.status, 'healthy');
  assert.equal(snapshot.github.latest_ci.state, 'success');
  assert.equal(snapshot.github.open_pull_requests, 1);
  assert.equal(snapshot.github.phase_progress[1].completion, 0.5);
  assert.equal(snapshot.vercel.latest_deployment.state, 'ready');
  assert.equal(snapshot.vercel.recent_success_rate, 0.5);
});
