function toIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeCiState(run) {
  if (!run) {
    return 'unknown';
  }

  if (run.status && run.status !== 'completed') {
    return 'running';
  }

  if (run.conclusion === 'success') {
    return 'success';
  }

  if (run.conclusion === 'failure') {
    return 'failed';
  }

  if (run.conclusion === 'cancelled') {
    return 'cancelled';
  }

  return 'unknown';
}

function normalizeDeployState(deployment) {
  if (!deployment) {
    return 'unknown';
  }

  const raw = String(deployment.readyState ?? deployment.state ?? '').toUpperCase();
  if (raw.includes('READY')) {
    return 'ready';
  }

  if (raw.includes('ERROR')) {
    return 'error';
  }

  if (raw.includes('BUILDING') || raw.includes('QUEUED') || raw.includes('INITIALIZING')) {
    return 'building';
  }

  return 'unknown';
}

async function fetchJson(fetchImpl, url, headers = {}) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    throw new Error(`external request failed: ${response.status} ${url}`);
  }

  return response.json();
}

function collectPhaseProgress(issues) {
  const phases = ['phase/0', 'phase/1', 'phase/2', 'phase/3'];
  return phases.map((phase) => {
    const targets = issues.filter((issue) =>
      (issue.labels ?? []).some((label) => label?.name?.toLowerCase() === phase),
    );
    const done = targets.filter((issue) => issue.state === 'closed').length;
    const completion = targets.length === 0 ? 0 : Number((done / targets.length).toFixed(2));

    return {
      phase,
      total: targets.length,
      done,
      completion,
    };
  });
}

function countIssuesByLabel(issues, labelName) {
  const normalized = labelName.toLowerCase();
  return issues.filter((issue) =>
    (issue.labels ?? []).some((label) => label?.name?.toLowerCase() === normalized),
  ).length;
}

export class OpsStatusService {
  constructor({ env = process.env, fetchImpl = globalThis.fetch, clock = () => new Date() } = {}) {
    this.env = env;
    this.fetchImpl = fetchImpl;
    this.clock = clock;
  }

  async snapshot() {
    const fetchImpl = this.fetchImpl;
    if (typeof fetchImpl !== 'function') {
      return {
        generated_at: this.clock().toISOString(),
        status: 'warning',
        github: { configured: false, status: 'not_available' },
        vercel: { configured: false, status: 'not_available' },
        notes: ['Fetch API is unavailable in runtime.'],
      };
    }

    const status = {
      generated_at: this.clock().toISOString(),
      status: 'healthy',
      github: await this.githubStatus().catch((error) => ({
        configured: this.isGithubConfigured(),
        status: 'error',
        error: error.message,
      })),
      vercel: await this.vercelStatus().catch((error) => ({
        configured: this.isVercelConfigured(),
        status: 'error',
        error: error.message,
      })),
      notes: [],
    };

    if (status.github.status === 'error' || status.vercel.status === 'error') {
      status.status = 'error';
      status.notes.push('External integration call failed.');
    } else if (
      ['not_configured', 'unknown'].includes(status.github.status) ||
      ['not_configured', 'unknown'].includes(status.vercel.status)
    ) {
      status.status = 'warning';
      status.notes.push('Configure missing integration values to see full dashboard.');
    }

    return status;
  }

  isGithubConfigured() {
    return Boolean(this.env.GITHUB_OWNER && this.env.GITHUB_REPO);
  }

  isVercelConfigured() {
    return Boolean(this.env.VERCEL_TOKEN && this.env.VERCEL_PROJECT_ID);
  }

  async githubStatus() {
    const owner = this.env.GITHUB_OWNER;
    const repo = this.env.GITHUB_REPO;
    const token = this.env.GITHUB_TOKEN;

    if (!owner || !repo) {
      return {
        configured: false,
        status: 'not_configured',
        repo: null,
        setup_hint: 'Set GITHUB_OWNER and GITHUB_REPO',
      };
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'budong-ops-dashboard',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const [runsData, pullsData, issuesData] = await Promise.all([
      fetchJson(
        this.fetchImpl,
        `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=20`,
        headers,
      ),
      fetchJson(this.fetchImpl, `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`, headers),
      fetchJson(this.fetchImpl, `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, headers),
    ]);

    const runs = runsData.workflow_runs ?? [];
    const latestCi = runs.find((run) => (run.name ?? '').toLowerCase().includes('ci')) ?? runs[0] ?? null;
    const openPulls = pullsData ?? [];
    const draftPulls = openPulls.filter((pull) => pull.draft).length;
    const issuesOnly = (issuesData ?? []).filter((item) => !item.pull_request);
    const openIssues = issuesOnly.filter((issue) => issue.state === 'open');

    const ciState = normalizeCiState(latestCi);
    const healthState = ciState === 'failed' ? 'error' : ciState === 'success' ? 'healthy' : 'unknown';

    return {
      configured: true,
      status: healthState,
      repo: `${owner}/${repo}`,
      latest_ci: latestCi
        ? {
            name: latestCi.name,
            state: ciState,
            run_number: latestCi.run_number,
            url: latestCi.html_url,
            branch: latestCi.head_branch,
            updated_at: toIso(latestCi.updated_at),
          }
        : null,
      open_pull_requests: openPulls.length,
      draft_pull_requests: draftPulls,
      open_issues: openIssues.length,
      blocker_issues: countIssuesByLabel(openIssues, 'blocker'),
      phase_progress: collectPhaseProgress(issuesOnly),
    };
  }

  async vercelStatus() {
    const token = this.env.VERCEL_TOKEN;
    const projectId = this.env.VERCEL_PROJECT_ID;
    const teamId = this.env.VERCEL_TEAM_ID;

    if (!token || !projectId) {
      return {
        configured: false,
        status: 'not_configured',
        project_id: projectId ?? null,
        setup_hint: 'Set VERCEL_TOKEN and VERCEL_PROJECT_ID',
      };
    }

    const teamQuery = teamId ? `&teamId=${encodeURIComponent(teamId)}` : '';
    const endpoint = `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=5${teamQuery}`;

    const data = await fetchJson(this.fetchImpl, endpoint, {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'budong-ops-dashboard',
    });

    const deployments = data.deployments ?? [];
    const latest = deployments[0] ?? null;
    const state = normalizeDeployState(latest);

    return {
      configured: true,
      status: state === 'error' ? 'error' : state === 'ready' ? 'healthy' : 'unknown',
      project_id: projectId,
      latest_deployment: latest
        ? {
            uid: latest.uid,
            state,
            target: latest.target ?? 'preview',
            url: latest.url ? `https://${latest.url}` : null,
            created_at: toIso(latest.createdAt ?? latest.created),
          }
        : null,
      recent_success_rate: deployments.length
        ? Number(
            (
              deployments.filter((deployment) => normalizeDeployState(deployment) === 'ready').length /
              deployments.length
            ).toFixed(2),
          )
        : 0,
    };
  }
}
