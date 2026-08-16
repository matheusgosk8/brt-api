import { Hono } from 'hono';
import { cors } from 'hono/cors';
import './common/utils/logger';
import { getEnv } from './config/env';
import { Router } from './routes';

export type AppEnv = {
  Variables: Record<string, never>;
};

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use(
    '*',
    cors({
      origin: getEnv().corsOrigin,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.route('/', Router);

  return app;
}

export type App = ReturnType<typeof createApp>;
