import { Hono } from 'hono';
import openApiSpec from '@src/docs/openapi.json';

/**
 * OpenAPI estático (spec-first) + Swagger UI via CDN.
 * Spec embutida no HTML do /docs — evita 2º fetch (no API Gateway,
 * `/openapi.json` sem o stage `/Prod` retorna 403).
 */
export const docsRoutes = new Hono();

docsRoutes.get('/openapi.json', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json(openApiSpec);
});

/** Alias amigável — relativo ao path atual (respeita /Prod no API Gateway). */
docsRoutes.get('/openapi.yaml', (c) => c.redirect(new URL('openapi.json', c.req.url).pathname, 302));

docsRoutes.get('/docs', (c) => {
  const specJson = JSON.stringify(openApiSpec).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BRT API — Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" crossorigin></script>
    <script>
      const spec = ${specJson};
      // Em API Gateway o stage (/Prod) precisa entrar na base do Try it out.
      const stageBase = window.location.pathname.replace(/\\/docs\\/?$/, '') || '';
      const originBase = window.location.origin + stageBase;
      spec.servers = [
        { url: originBase, description: 'Este ambiente' },
        { url: 'http://localhost:3001', description: 'Local' },
      ];
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        tryItOutEnabled: true,
      });
    </script>
  </body>
</html>`;

  return c.html(html);
});
