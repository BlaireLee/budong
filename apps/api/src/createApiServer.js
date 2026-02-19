import { createServer } from 'node:http';
import { createApiHandler } from './createApiHandler.js';

export function createApiServer(options = {}) {
  const { handler, domainContext, opsStatusService } = createApiHandler(options);

  return {
    server: createServer((req, res) => {
      void handler(req, res);
    }),
    domainContext,
    opsStatusService,
  };
}
