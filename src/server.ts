import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import * as https from 'node:https';
import type { IncomingMessage } from 'node:http';

const GATEWAY_HOST = 'gw.cse.akdeniz.edu.tr';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Proxy /cse-438/** directly to the remote gateway.
 * This is needed because Express (SSR server) is the one listening on port 4200,
 * so the Vite proxyConfig alone cannot intercept API calls.
 */
app.use('/cse-438', (req, res) => {
  const targetPath = '/cse-438' + (req.url ?? '/');

  // Copy headers, replacing host with the gateway host
  const proxyHeaders: Record<string, string | string[]> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== 'host' && val !== undefined) {
      proxyHeaders[key] = val as string | string[];
    }
  }
  proxyHeaders['host'] = GATEWAY_HOST;

  const options: https.RequestOptions = {
    hostname: GATEWAY_HOST,
    path: targetPath,
    method: req.method,
    headers: proxyHeaders,
  };

  const proxyReq = https.request(options, (proxyRes: IncomingMessage) => {
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers as Record<string, string>);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Gateway unreachable' });
    }
  });

  req.pipe(proxyReq, { end: true });
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
