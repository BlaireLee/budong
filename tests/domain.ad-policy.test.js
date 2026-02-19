import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainContext } from '../packages/domain/src/createDomainContext.js';

test('ad policy switches to personalized after legal approval + guardian consent', () => {
  const fixedClock = () => new Date('2026-02-19T00:00:00.000Z');
  const context = createDomainContext({
    clock: fixedClock,
    adPolicyConfig: {
      regulatory_approvals: {
        US: true,
      },
    },
  });

  const signup = context.services.signupService.signup({
    birth_year: 2014,
    country: 'US',
  });

  const beforeConsent = context.services.adPolicyEngine.decide({
    user_id: signup.user.id,
    context: { country: 'US', placement: 'lesson_feed' },
  });

  assert.equal(beforeConsent.mode, 'non_personalized');
  assert.equal(beforeConsent.reason_code, 'guardian_verification_required');

  context.services.guardianConsentService.grant({
    user_id: signup.user.id,
    consent_type: 'ad_personalization',
    proof_token: 'proof-123456',
  });

  const afterConsent = context.services.adPolicyEngine.decide({
    user_id: signup.user.id,
    context: { country: 'US', placement: 'lesson_feed' },
  });

  assert.equal(afterConsent.mode, 'personalized');
  assert.equal(afterConsent.reason_code, 'all_requirements_met');
});

test('ad policy falls back to non-personalized when legal approval is missing', () => {
  const fixedClock = () => new Date('2026-02-19T00:00:00.000Z');
  const context = createDomainContext({
    clock: fixedClock,
    adPolicyConfig: {
      regulatory_approvals: {
        KR: false,
      },
    },
  });

  const signup = context.services.signupService.signup({
    birth_year: 2011,
    country: 'KR',
  });

  context.services.guardianConsentService.grant({
    user_id: signup.user.id,
    consent_type: 'ad_personalization',
    proof_token: 'proof-987654',
  });

  const decision = context.services.adPolicyEngine.decide({
    user_id: signup.user.id,
    context: { country: 'KR', placement: 'lesson_feed' },
  });

  assert.equal(decision.mode, 'non_personalized');
  assert.equal(decision.reason_code, 'regulatory_approval_missing');
});
