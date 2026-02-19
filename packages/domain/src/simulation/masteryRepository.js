export class InMemoryMasteryRepository {
  constructor() {
    this.masteryByUser = new Map();
  }

  get(userId, topic) {
    const byTopic = this.masteryByUser.get(userId);
    if (!byTopic) {
      return 0;
    }

    return byTopic.get(topic) ?? 0;
  }

  set(userId, topic, value) {
    const byTopic = this.masteryByUser.get(userId) ?? new Map();
    byTopic.set(topic, value);
    this.masteryByUser.set(userId, byTopic);
    return value;
  }

  listByUser(userId) {
    const byTopic = this.masteryByUser.get(userId) ?? new Map();
    return [...byTopic.entries()].map(([topic, mastery_level]) => ({ topic, mastery_level }));
  }
}
