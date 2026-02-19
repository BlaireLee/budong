import { createApiHandler } from '../apps/api/src/createApiHandler.js';

const adPolicyConfig = {
  regulatory_approvals: {
    KR: process.env.AD_POLICY_APPROVAL_KR === 'true',
    US: process.env.AD_POLICY_APPROVAL_US === 'true',
  },
};

const { handler } = createApiHandler({
  adPolicyConfig,
  runtimeEnv: process.env,
});

export default async function vercelHandler(req, res) {
  await handler(req, res);
}
