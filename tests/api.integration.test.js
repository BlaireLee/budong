import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApiServer } from '../apps/api/src/createApiServer.js';
import { createDomainContext } from '../packages/domain/src/createDomainContext.js';

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const data = await response.json();
  return { response, data };
}

test('api supports end-to-end learning loop', async () => {
  const fixedClock = () => new Date('2026-02-19T00:00:00.000Z');
  const domainContext = createDomainContext({
    clock: fixedClock,
    adPolicyConfig: {
      regulatory_approvals: {
        KR: true,
        US: true,
      },
    },
  });
  const { server } = createApiServer({
    domainContext,
  });

  server.listen(0);
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const signupResult = await request(baseUrl, '/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        birth_year: 2012,
        country: 'KR',
      }),
    });
    assert.equal(signupResult.response.status, 201);
    assert.equal(typeof signupResult.data.user_id, 'string');

    const userId = signupResult.data.user_id;

    const lessonsResult = await request(baseUrl, '/v1/lessons?language=ko');
    assert.equal(lessonsResult.response.status, 200);
    assert.ok(lessonsResult.data.lessons.length >= 1);

    const lessonId = lessonsResult.data.lessons[0].lesson_id;
    const lessonDetail = await request(baseUrl, `/v1/lessons/${lessonId}`);
    assert.equal(lessonDetail.response.status, 200);
    assert.equal(Array.isArray(lessonDetail.data.options), true);

    const attemptResult = await request(baseUrl, `/v1/simulations/${lessonId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        choices: [0],
        rationale_text: '테스트',
      }),
    });
    assert.equal(attemptResult.response.status, 200);
    assert.equal(typeof attemptResult.data.score, 'number');

    const eventResult = await request(baseUrl, '/v1/events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: 'session_started',
        user_id: userId,
        session_id: 'session_test',
        props: { country: 'KR' },
      }),
    });
    assert.equal(eventResult.response.status, 202);
    assert.equal(eventResult.data.accepted, true);

    const adBefore = await request(
      baseUrl,
      `/v1/ads/decision?user_id=${userId}&country=KR&placement=lesson_feed`,
    );
    assert.equal(adBefore.response.status, 200);
    assert.equal(adBefore.data.ad_mode, 'non_personalized');

    await request(baseUrl, '/v1/consent/guardian', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        consent_type: 'ad_personalization',
        proof_token: 'proof-123456',
      }),
    });

    const adAfter = await request(
      baseUrl,
      `/v1/ads/decision?user_id=${userId}&country=KR&placement=lesson_feed`,
    );
    assert.equal(adAfter.data.ad_mode, 'personalized');

    const kpiResult = await request(baseUrl, '/v1/kpis');
    assert.equal(kpiResult.response.status, 200);
    assert.equal(typeof kpiResult.data.walc, 'number');

    const opsResult = await request(baseUrl, '/v1/ops/status');
    assert.equal(opsResult.response.status, 200);
    assert.equal(typeof opsResult.data.ops.status, 'string');
  } finally {
    server.close();
    await once(server, 'close');
  }
});
