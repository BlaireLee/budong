export function renderMetricCard({ label, value, target, status = 'neutral' }) {
  return `
    <article class="kpi-card tone-${status}">
      <p class="kpi-label">${label}</p>
      <p class="kpi-value">${value}</p>
      <p class="kpi-target">목표: ${target}</p>
    </article>
  `;
}

export function badge(text, tone = 'neutral') {
  return `<span class="status-chip ${tone}">${text}</span>`;
}

export function renderQualityCard({ title, benchmark, detail, status = 'neutral' }) {
  return `
    <article class="advantage-card ${status}">
      <div class="panel-head">
        <h4>${title}</h4>
        ${badge(benchmark, status)}
      </div>
      <p>${detail}</p>
    </article>
  `;
}
