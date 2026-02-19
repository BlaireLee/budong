import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainContext } from '../packages/domain/src/createDomainContext.js';

test('simulation attempt returns score, feedback, and mastery updates', () => {
  const fixedClock = () => new Date('2026-02-19T00:00:00.000Z');
  const context = createDomainContext({ clock: fixedClock });

  const signup = context.services.signupService.signup({
    birth_year: 2011,
    country: 'KR',
  });

  const firstAttempt = context.services.attemptSimulationService.attempt({
    simulation_id: 'kr-lease-basics',
    user_id: signup.user.id,
    choices: [1],
    rationale_text: '2년 이상 거주하면 총비용이 낮아 보여요.',
  });

  assert.equal(firstAttempt.score, 100);
  assert.equal(firstAttempt.mastery_update.delta, 0.2);
  assert.equal(firstAttempt.mastery_update.new_level, 'beginner');

  const secondAttempt = context.services.attemptSimulationService.attempt({
    simulation_id: 'kr-lease-basics',
    user_id: signup.user.id,
    choices: [0],
    rationale_text: '초기 비용을 줄이고 싶어요.',
  });

  assert.equal(secondAttempt.score, 40);
  assert.equal(secondAttempt.mastery_update.delta, 0.05);

  const attempts = context.repositories.attemptRepository.listByUserId(signup.user.id);
  assert.equal(attempts.length, 2);
});

test('simulation rejects invalid options', () => {
  const fixedClock = () => new Date('2026-02-19T00:00:00.000Z');
  const context = createDomainContext({ clock: fixedClock });
  const signup = context.services.signupService.signup({
    birth_year: 2012,
    country: 'KR',
  });

  assert.throws(
    () =>
      context.services.attemptSimulationService.attempt({
        simulation_id: 'kr-lease-basics',
        user_id: signup.user.id,
        choices: [9],
      }),
    /invalid/,
  );
});
