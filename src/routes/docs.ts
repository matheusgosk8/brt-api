import { Hono } from 'hono';
import openApiSpec from '@src/docs/openapi.json';

/**
 * OpenAPI estático (spec-first) + Swagger UI via CDN.
 * Spec em `src/docs/openapi.json` — entra no bundle webpack (JSON import).
 */
export const docsRoutes = new Hono();

docsRoutes.get('/openapi.json', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json(openApiSpec);
});

/** Alias amigável — mesmo documento. */
docsRoutes.get('/openapi.yaml', (c) => c.redirect('/openapi.json', 302));

docsRoutes.get('/docs', (c) => {
  // Relativo ao path atual: funciona em local (/docs) e no API Gateway (/Prod/docs).
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
      window.ui = SwaggerUIBundle({
        url: new URL('../openapi.json', window.location.href).pathname,
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
