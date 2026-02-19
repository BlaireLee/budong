export class InMemoryAttemptRepository {
  constructor() {
    this.attempts = [];
  }

  create(attempt) {
    this.attempts.push(attempt);
    return attempt;
  }

  list() {
    return [...this.attempts];
  }

  listByUserId(userId) {
    return this.attempts.filter((attempt) => attempt.user_id === userId);
  }
}
