import { asDate } from '../infra/time.js';

function safeDivide(numerator, denominator) {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function inLastDays(value, days, now) {
  const date = asDate(value);
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function hasSessionOnOrAfterDay(events, createdAt, day) {
  const start = createdAt.getTime() + day * 24 * 60 * 60 * 1000;
  const end = start + 24 * 60 * 60 * 1000;
  return events.some((event) => {
    if (event.event_name !== 'session_started') {
      return false;
    }

    const eventTime = asDate(event.created_at).getTime();
    return eventTime >= start && eventTime < end;
  });
}

export class KpiService {
  constructor({ userRepository, attemptRepository, eventRepository, clock = () => new Date() }) {
    this.userRepository = userRepository;
    this.attemptRepository = attemptRepository;
    this.eventRepository = eventRepository;
    this.clock = clock;
  }

  snapshot() {
    const now = this.clock();
    const users = this.userRepository.list();
    const attempts = this.attemptRepository.list();
    const events = this.eventRepository.list();

    const walcUsers = new Set(
      attempts
        .filter((attempt) => inLastDays(attempt.completed_at, 7, now))
        .map((attempt) => attempt.user_id),
    );

    const activatedUsers = users.filter((user) => {
      const createdAt = asDate(user.created_at);
      const cutoff = createdAt.getTime() + 24 * 60 * 60 * 1000;
      return attempts.some(
        (attempt) =>
          attempt.user_id === user.id && asDate(attempt.completed_at).getTime() <= cutoff,
      );
    });

    const retainedUsers = users.filter((user) => {
      const userEvents = events.filter((event) => event.user_id === user.id);
      const createdAt = asDate(user.created_at);
      return hasSessionOnOrAfterDay(userEvents, createdAt, 0) && hasSessionOnOrAfterDay(userEvents, createdAt, 7);
    });

    const byUserAttempts = new Map();
    for (const attempt of attempts) {
      const list = byUserAttempts.get(attempt.user_id) ?? [];
      list.push(attempt);
      byUserAttempts.set(attempt.user_id, list);
    }

    const scoreImprovements = [];
    for (const [, list] of byUserAttempts.entries()) {
      if (list.length < 2) {
        continue;
      }

      const sorted = [...list].sort(
        (a, b) => asDate(a.completed_at).getTime() - asDate(b.completed_at).getTime(),
      );
      scoreImprovements.push(sorted.at(-1).score - sorted[0].score);
    }

    const avgLearningImprovement =
      scoreImprovements.length === 0
        ? 0
        : scoreImprovements.reduce((sum, value) => sum + value, 0) / scoreImprovements.length;

    const adImpressions = events.filter((event) => event.event_name === 'ad_impression');
    const dailyActiveUsers = new Set(
      events
        .filter((event) => inLastDays(event.created_at, 1, now))
        .map((event) => event.user_id),
    );

    const krRevenue = adImpressions
      .filter((event) => (event.props.country ?? '').toUpperCase() === 'KR')
      .reduce((sum, event) => sum + Number(event.props.revenue_krw ?? 0), 0);

    const usRevenue = adImpressions
      .filter((event) => (event.props.country ?? '').toUpperCase() === 'US')
      .reduce((sum, event) => sum + Number(event.props.revenue_usd ?? 0), 0);

    const kpi = {
      walc: walcUsers.size,
      activation_rate_24h: Number(safeDivide(activatedUsers.length, users.length).toFixed(2)),
      d7_retention: Number(safeDivide(retainedUsers.length, users.length).toFixed(2)),
      avg_learning_score_improvement: Number(avgLearningImprovement.toFixed(2)),
      arpdau_krw: Number(safeDivide(krRevenue, dailyActiveUsers.size).toFixed(2)),
      arpdau_usd: Number(safeDivide(usRevenue, dailyActiveUsers.size).toFixed(2)),
      generated_at: now.toISOString(),
    };

    return kpi;
  }
}
