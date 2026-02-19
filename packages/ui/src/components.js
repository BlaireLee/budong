export function renderMetricCard({ label, value, target, status }) {
  return `
    <article class="metric-card metric-${status}">
      <p class="metric-label">${label}</p>
      <p class="metric-value">${value}</p>
      <p class="metric-target">목표: ${target}</p>
    </article>
  `;
}

export function badge(text, tone = 'neutral') {
  return `<span class="badge badge-${tone}">${text}</span>`;
}
