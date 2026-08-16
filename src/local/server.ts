import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { serve } from '@hono/node-server';
import { createApp } from '../app';
import { getEnv } from '../config/env';
import { closeDb } from '../db';

const app = createApp();
const { port } = getEnv();

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`brt-api (Hono) listening on http://localhost:${port}`);
  console.log(`  GET /health`);
});

async function shutdown() {
  server.close();
  await closeDb();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
