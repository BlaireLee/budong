export class InMemoryEventRepository {
  constructor() {
    this.events = [];
  }

  create(event) {
    this.events.push(event);
    return event;
  }

  list() {
    return [...this.events];
  }

  listByUserId(userId) {
    return this.events.filter((event) => event.user_id === userId);
  }
}
