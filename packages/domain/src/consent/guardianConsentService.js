export class GuardianConsentService {
  constructor({ userRepository, consentRepository, clock = () => new Date() }) {
    this.userRepository = userRepository;
    this.consentRepository = consentRepository;
    this.clock = clock;
  }

  grant({ user_id, consent_type, proof_token }) {
    const user = this.userRepository.findById(user_id);
    if (!user) {
      throw new Error('user not found');
    }

    if (!['ad_personalization', 'analytics'].includes(consent_type)) {
      throw new Error('consent_type must be ad_personalization or analytics');
    }

    if (typeof proof_token !== 'string' || proof_token.trim().length < 6) {
      throw new Error('proof_token is invalid');
    }

    const effectiveAt = this.clock().toISOString();
    const consentState = this.consentRepository.update(user_id, {
      [consent_type]: true,
      guardian_verified_at: effectiveAt,
      updated_at: effectiveAt,
    });

    return {
      consent_state: consentState,
      effective_at: effectiveAt,
    };
  }
}
