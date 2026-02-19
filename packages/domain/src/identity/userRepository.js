export class InMemoryUserRepository {
  constructor() {
    this.users = new Map();
  }

  create(user) {
    this.users.set(user.id, user);
    return user;
  }

  findById(id) {
    return this.users.get(id) ?? null;
  }

  list() {
    return [...this.users.values()];
  }
}
