import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const REQUIRED_LABELS = [
  { name: 'phase/0', color: '1d76db', description: 'Phase 0 - foundation and risk lock' },
  { name: 'phase/1', color: '0e8a16', description: 'Phase 1 - MVP core build' },
  { name: 'phase/2', color: 'fbca04', description: 'Phase 2 - beta expansion' },
  { name: 'phase/3', color: '5319e7', description: 'Phase 3 - launch and pilot' },
  { name: 'blocker', color: 'b60205', description: 'Blocking issue that must be fixed first' },
  { name: 'high-priority', color: 'd93f0b', description: 'High priority work item' },
  { name: 'design', color: 'c5def5', description: 'Product design scope' },
  { name: 'backend', color: 'bfdadc', description: 'API and domain backend scope' },
  { name: 'frontend', color: 'fef2c0', description: 'Web and PWA scope' },
  { name: 'analytics', color: '7057ff', description: 'Tracking and KPI scope' },
  { name: 'ops', color: '006b75', description: 'CI/CD and reliability scope' }
];

const ROADMAP_ISSUES = [
  {
    title: 'Phase 0: KPI dictionary and decision log freeze',
    body: 'Finalize KPI definitions, phase acceptance criteria, and decision log for PM/Design/Tech alignment.',
    labels: ['phase/0', 'analytics']
  },
  {
    title: 'Phase 0: age-consent-ads legal checklist',
    body: 'Define legal checklist for KR/US age handling, consent flow, and ad mode downgrade rules.',
    labels: ['phase/0', 'backend', 'ops']
  },
  {
    title: 'Phase 0: content readability standard for middle schoolers',
    body: 'Document vocabulary limits, sentence length, and tone guide for KR-first content.',
    labels: ['phase/0', 'design']
  },
  {
    title: 'Phase 1: auth + guardian consent API hardening',
    body: 'Stabilize signup and guardian consent API, add validation edge-case tests.',
    labels: ['phase/1', 'backend', 'high-priority']
  },
  {
    title: 'Phase 1: simulation scoring and mastery calibration',
    body: 'Tune mastery progression and feedback quality with deterministic test coverage.',
    labels: ['phase/1', 'backend', 'analytics']
  },
  {
    title: 'Phase 1: PWA first-session UX optimization',
    body: 'Reduce time-to-first-mission-completion and tighten onboarding clarity.',
    labels: ['phase/1', 'frontend', 'design']
  },
  {
    title: 'Phase 1: event taxonomy and schema lock',
    body: 'Lock event names/props for KPI reliability and downstream dashboard stability.',
    labels: ['phase/1', 'analytics', 'backend']
  },
  {
    title: 'Phase 2: 12 mission quality pass and difficulty rebalance',
    body: 'Rebalance mission difficulty to keep quiz correctness near target while reducing drop-off.',
    labels: ['phase/2', 'design', 'frontend']
  },
  {
    title: 'Phase 2: KR beta cohort instrumentation',
    body: 'Enable cohort breakdown for activation, retention, and mission completion metrics.',
    labels: ['phase/2', 'analytics', 'backend']
  },
  {
    title: 'Phase 2: reliability runbook and alerting hooks',
    body: 'Define incident playbooks, key alerts, and rollback criteria for beta period.',
    labels: ['phase/2', 'ops']
  },
  {
    title: 'Phase 3: KR launch checklist and go-live gates',
    body: 'Prepare launch readiness gates (performance, support, policy, KPI floor).',
    labels: ['phase/3', 'ops', 'high-priority']
  },
  {
    title: 'Phase 3: US pilot core module QA',
    body: 'Validate English core modules for policy and UX consistency in pilot cohort.',
    labels: ['phase/3', 'frontend', 'design']
  },
  {
    title: 'Phase 3: ad policy approval-based rollout control',
    body: 'Operationalize legal approval flags and monitor ad mode fallback behavior.',
    labels: ['phase/3', 'backend', 'ops']
  }
];

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function isoDateOnly(value) {
  return value.toISOString().slice(0, 10);
}

function milestonePlan(today = new Date()) {
  return [
    {
      title: 'Phase 0 (Week 1-2)',
      description: 'Product/risk alignment and KPI lock.',
      due_on: addDays(today, 14).toISOString()
    },
    {
      title: 'Phase 1 (Week 3-8)',
      description: 'MVP core APIs, PWA flow, and first E2E loop.',
      due_on: addDays(today, 56).toISOString()
    },
    {
      title: 'Phase 2 (Week 9-14)',
      description: 'Beta expansion, mission quality and reliability hardening.',
      due_on: addDays(today, 98).toISOString()
    },
    {
      title: 'Phase 3 (Week 15-20)',
      description: 'KR launch readiness and US pilot validation.',
      due_on: addDays(today, 140).toISOString()
    }
  ];
}

async function requestJson(url, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${url}\n${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'budong-bootstrap-script',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

async function ensureLabels({ owner, repo, token, dryRun }) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = githubHeaders(token);
  const existing = await requestJson(`${base}/labels?per_page=100`, { headers });
  const existingMap = new Map(existing.map((label) => [label.name, label]));

  const created = [];
  const updated = [];

  for (const label of REQUIRED_LABELS) {
    const current = existingMap.get(label.name);
    if (!current) {
      created.push(label.name);
      if (!dryRun) {
        await requestJson(`${base}/labels`, {
          method: 'POST',
          headers,
          body: label
        });
      }
      continue;
    }

    const mustUpdate =
      String(current.color).toLowerCase() !== String(label.color).toLowerCase() ||
      (current.description ?? '') !== (label.description ?? '');

    if (mustUpdate) {
      updated.push(label.name);
      if (!dryRun) {
        await requestJson(`${base}/labels/${encodeURIComponent(label.name)}`, {
          method: 'PATCH',
          headers,
          body: {
            new_name: label.name,
            color: label.color,
            description: label.description
          }
        });
      }
    }
  }

  return { created, updated };
}

async function ensureMilestones({ owner, repo, token, dryRun }) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = githubHeaders(token);
  const existing = await requestJson(`${base}/milestones?state=all&per_page=100`, { headers });
  const existingMap = new Map(existing.map((milestone) => [milestone.title, milestone]));

  const plan = milestonePlan();
  const created = [];
  const updated = [];

  for (const milestone of plan) {
    const current = existingMap.get(milestone.title);
    if (!current) {
      created.push(milestone.title);
      if (!dryRun) {
        await requestJson(`${base}/milestones`, {
          method: 'POST',
          headers,
          body: milestone
        });
      }
      continue;
    }

    const needsUpdate =
      (current.description ?? '') !== milestone.description ||
      isoDateOnly(new Date(current.due_on ?? milestone.due_on)) !== isoDateOnly(new Date(milestone.due_on));

    if (needsUpdate) {
      updated.push(milestone.title);
      if (!dryRun) {
        await requestJson(`${base}/milestones/${current.number}`, {
          method: 'PATCH',
          headers,
          body: {
            title: milestone.title,
            description: milestone.description,
            due_on: milestone.due_on,
            state: current.state
          }
        });
      }
    }
  }

  return { created, updated };
}

async function ensureRoadmapIssues({ owner, repo, token, dryRun }) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = githubHeaders(token);
  const issues = await requestJson(`${base}/issues?state=all&per_page=100`, { headers });
  const existingTitles = new Set(issues.filter((item) => !item.pull_request).map((item) => item.title));

  const created = [];

  for (const issue of ROADMAP_ISSUES) {
    if (existingTitles.has(issue.title)) {
      continue;
    }

    created.push(issue.title);
    if (!dryRun) {
      await requestJson(`${base}/issues`, {
        method: 'POST',
        headers,
        body: issue
      });
    }
  }

  return { created };
}

async function tryBranchProtection({ owner, repo, token, dryRun }) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = githubHeaders(token);

  const payload = {
    required_status_checks: {
      strict: true,
      contexts: ['test']
    },
    enforce_admins: false,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    required_conversation_resolution: true
  };

  if (dryRun) {
    return { applied: false, skipped: true, reason: 'dry-run' };
  }

  try {
    await requestJson(`${base}/branches/main/protection`, {
      method: 'PUT',
      headers,
      body: payload
    });
    return { applied: true };
  } catch (error) {
    return { applied: false, skipped: true, reason: error.message };
  }
}

async function githubBootstrap({ dryRun }) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return {
      configured: false,
      message: 'Set GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN to enable bootstrap'
    };
  }

  const labelResult = await ensureLabels({ owner, repo, token, dryRun });
  const milestoneResult = await ensureMilestones({ owner, repo, token, dryRun });
  const issueResult = await ensureRoadmapIssues({ owner, repo, token, dryRun });
  const branchResult = await tryBranchProtection({ owner, repo, token, dryRun });

  return {
    configured: true,
    owner,
    repo,
    labels: labelResult,
    milestones: milestoneResult,
    issues: issueResult,
    branch_protection: branchResult
  };
}

async function vercelBootstrap({ dryRun }) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return {
      configured: false,
      message: 'Set VERCEL_TOKEN and VERCEL_PROJECT_ID to enable validation'
    };
  }

  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'budong-bootstrap-script'
  };

  if (dryRun) {
    return {
      configured: true,
      project_id: projectId,
      dry_run: true
    };
  }

  const project = await requestJson(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}${query}`, {
    headers
  });

  const deployments = await requestJson(
    `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=5${teamId ? `&teamId=${encodeURIComponent(teamId)}` : ''}`,
    { headers }
  );

  return {
    configured: true,
    project_id: projectId,
    project_name: project.name,
    framework: project.framework,
    latest_deployment_state: deployments.deployments?.[0]?.readyState ?? 'UNKNOWN',
    latest_deployment_url: deployments.deployments?.[0]?.url ? `https://${deployments.deployments[0].url}` : null
  };
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Integration Bootstrap Report');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## GitHub');
  if (report.github) {
    if (!report.github.configured) {
      lines.push(`- ${report.github.message}`);
    } else {
      lines.push(`- Repo: ${report.github.owner}/${report.github.repo}`);
      lines.push(`- Labels created: ${report.github.labels.created.length}`);
      lines.push(`- Labels updated: ${report.github.labels.updated.length}`);
      lines.push(`- Milestones created: ${report.github.milestones.created.length}`);
      lines.push(`- Milestones updated: ${report.github.milestones.updated.length}`);
      lines.push(`- Roadmap issues created: ${report.github.issues.created.length}`);
      if (report.github.branch_protection.applied) {
        lines.push('- Branch protection: applied on `main`');
      } else {
        lines.push(`- Branch protection: skipped (${report.github.branch_protection.reason ?? 'not applied'})`);
      }
    }
  } else {
    lines.push(`- Error: ${report.githubError}`);
  }

  lines.push('');
  lines.push('## Vercel');
  if (report.vercel) {
    if (!report.vercel.configured) {
      lines.push(`- ${report.vercel.message}`);
    } else {
      lines.push(`- Project ID: ${report.vercel.project_id}`);
      if (report.vercel.project_name) {
        lines.push(`- Project name: ${report.vercel.project_name}`);
      }
      if (report.vercel.framework) {
        lines.push(`- Framework: ${report.vercel.framework}`);
      }
      if (report.vercel.latest_deployment_state) {
        lines.push(`- Latest deployment: ${report.vercel.latest_deployment_state}`);
      }
      if (report.vercel.latest_deployment_url) {
        lines.push(`- Latest deployment URL: ${report.vercel.latest_deployment_url}`);
      }
    }
  } else {
    lines.push(`- Error: ${report.vercelError}`);
  }

  return lines.join('\n');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const report = {};

  try {
    report.github = await githubBootstrap({ dryRun });
  } catch (error) {
    report.githubError = error.message;
  }

  try {
    report.vercel = await vercelBootstrap({ dryRun });
  } catch (error) {
    report.vercelError = error.message;
  }

  const markdown = toMarkdown(report);
  const reportPath = join(process.cwd(), 'docs', 'INTEGRATION_BOOTSTRAP_REPORT.md');
  await writeFile(reportPath, `${markdown}\n`, 'utf8');

  console.log(markdown);
  console.log(`\nSaved report -> ${reportPath}`);

  if (report.githubError || report.vercelError) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
