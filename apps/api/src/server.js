import { createApiServer } from './createApiServer.js';

const port = Number(process.env.API_PORT ?? 3001);

const adPolicyConfig = {
  regulatory_approvals: {
    KR: process.env.AD_POLICY_APPROVAL_KR === 'true',
    US: process.env.AD_POLICY_APPROVAL_US === 'true',
  },
};

const { server } = createApiServer({ adPolicyConfig });

server.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
