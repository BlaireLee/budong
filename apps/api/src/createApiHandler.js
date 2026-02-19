import { createDomainContext } from '../../../packages/domain/src/createDomainContext.js';
import { readJson, sendJson } from './json.js';
import { OpsStatusService } from './ops/opsStatusService.js';

function toHttpStatus(error) {
  if (/not found/i.test(error.message)) {
    return 404;
  }

  if (/invalid|required|must be/i.test(error.message)) {
    return 400;
  }

  return 500;
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('unknown error');
}

export function createApiHandler(options = {}) {
  const domainContext =
    options.domainContext ??
    createDomainContext({
      adPolicyConfig: options.adPolicyConfig,
    });
  const opsStatusService =
    options.opsStatusService ??
    new OpsStatusService({
      env: options.runtimeEnv ?? process.env,
      fetchImpl: options.fetchImpl ?? globalThis.fetch,
      clock: options.clock ?? (() => new Date()),
    });

  const { services } = domainContext;

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    try {
      if (req.method === 'GET' && url.pathname === '/healthz') {
        sendJson(res, 200, { status: 'ok' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/auth/signup') {
        const body = await readJson(req);
        const result = services.signupService.signup(body);
        sendJson(res, 201, {
          user_id: result.user.id,
          age_band: result.user.age_band,
          consent_state: result.consent_state,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/consent/guardian') {
        const body = await readJson(req);
        const result = services.guardianConsentService.grant(body);
        sendJson(res, 200, {
          consent_state: result.consent_state,
          effective_at: result.effective_at,
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/lessons') {
        const language = url.searchParams.get('language') ?? undefined;
        const lessons = services.listLessonsService.list({ language });
        sendJson(res, 200, { lessons });
        return;
      }

      const lessonMatch = url.pathname.match(/^\/v1\/lessons\/([^/]+)$/);
      if (req.method === 'GET' && lessonMatch) {
        const lesson = services.getLessonDetailService.get(lessonMatch[1]);
        sendJson(res, 200, lesson);
        return;
      }

      const simulationMatch = url.pathname.match(/^\/v1\/simulations\/([^/]+)\/attempts$/);
      if (req.method === 'POST' && simulationMatch) {
        const body = await readJson(req);
        const simulationId = simulationMatch[1];
        const result = services.attemptSimulationService.attempt({
          simulation_id: simulationId,
          user_id: body.user_id,
          choices: body.choices,
          rationale_text: body.rationale_text,
        });
        sendJson(res, 200, result);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/events') {
        const body = await readJson(req);
        const result = services.recordEventService.record(body);
        sendJson(res, 202, result);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/ads/decision') {
        const userId = url.searchParams.get('user_id');
        const country = url.searchParams.get('country');
        const placement = url.searchParams.get('placement');

        if (!userId) {
          throw new Error('user_id is required');
        }

        const decision = services.adPolicyEngine.decide({
          user_id: userId,
          context: {
            country: country ?? undefined,
            placement: placement ?? undefined,
          },
        });

        sendJson(res, 200, {
          ad_mode: decision.mode,
          placement: decision.placement,
          reason_code: decision.reason_code,
          policy_rule_id: decision.policy_rule_id,
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/kpis') {
        const snapshot = services.kpiService.snapshot();
        sendJson(res, 200, snapshot);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/ops/status') {
        const [kpis, ops] = await Promise.all([services.kpiService.snapshot(), opsStatusService.snapshot()]);
        sendJson(res, 200, {
          generated_at: new Date().toISOString(),
          kpis,
          ops,
        });
        return;
      }

      sendJson(res, 404, { error: 'route not found' });
    } catch (rawError) {
      const error = normalizeError(rawError);
      const status = toHttpStatus(error);
      sendJson(res, status, { error: error.message });
    }
  };

  return {
    handler,
    domainContext,
    opsStatusService,
  };
}
