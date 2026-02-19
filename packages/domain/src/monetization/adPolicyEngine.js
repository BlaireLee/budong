const DEFAULT_CONFIG = {
  regulatory_approvals: {
    KR: false,
    US: false,
  },
  guardian_required_below_age: {
    KR: 18,
    US: 18,
  },
};

export class AdPolicyEngine {
  constructor({ userRepository, consentRepository, config = {} }) {
    this.userRepository = userRepository;
    this.consentRepository = consentRepository;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      regulatory_approvals: {
        ...DEFAULT_CONFIG.regulatory_approvals,
        ...(config.regulatory_approvals ?? {}),
      },
      guardian_required_below_age: {
        ...DEFAULT_CONFIG.guardian_required_below_age,
        ...(config.guardian_required_below_age ?? {}),
      },
    };
  }

  decide({ user_id, context = {} }) {
    const user = this.userRepository.findById(user_id);
    if (!user) {
      return {
        user_id,
        eligible: false,
        mode: 'none',
        policy_rule_id: 'RULE_000',
        reason_code: 'user_not_found',
        placement: context.placement ?? 'feed',
      };
    }

    const country = (context.country ?? user.country ?? 'KR').toUpperCase();
    const placement = context.placement ?? 'feed';
    const consent = this.consentRepository.findByUserId(user_id);

    const legalApproved = Boolean(this.config.regulatory_approvals[country]);
    if (!legalApproved) {
      return {
        user_id,
        eligible: true,
        mode: 'non_personalized',
        policy_rule_id: 'RULE_010',
        reason_code: 'regulatory_approval_missing',
        placement,
      };
    }

    const guardianAge = this.config.guardian_required_below_age[country] ?? 18;
    if (user.age < guardianAge && !consent.guardian_verified_at) {
      return {
        user_id,
        eligible: true,
        mode: 'non_personalized',
        policy_rule_id: 'RULE_020',
        reason_code: 'guardian_verification_required',
        placement,
      };
    }

    if (!consent.ad_personalization) {
      return {
        user_id,
        eligible: true,
        mode: 'non_personalized',
        policy_rule_id: 'RULE_030',
        reason_code: 'ad_personalization_consent_missing',
        placement,
      };
    }

    return {
      user_id,
      eligible: true,
      mode: 'personalized',
      policy_rule_id: 'RULE_100',
      reason_code: 'all_requirements_met',
      placement,
    };
  }
}
