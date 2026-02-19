const DEFAULT_CONSENT = Object.freeze({
  analytics: false,
  ad_personalization: false,
  guardian_verified_at: null,
  updated_at: null,
});

export class InMemoryConsentRepository {
  constructor() {
    this.consentByUser = new Map();
  }

  createForUser(userId, value) {
    const merged = { ...DEFAULT_CONSENT, ...value };
    this.consentByUser.set(userId, merged);
    return merged;
  }

  findByUserId(userId) {
    return this.consentByUser.get(userId) ?? { ...DEFAULT_CONSENT };
  }

  update(userId, patch) {
    const current = this.findByUserId(userId);
    const next = { ...current, ...patch };
    this.consentByUser.set(userId, next);
    return next;
  }

  list() {
    return [...this.consentByUser.entries()].map(([userId, consent]) => ({
      user_id: userId,
      ...consent,
    }));
  }
}
