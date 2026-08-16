import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from 'express';
import { sql } from 'drizzle-orm';
import { getEnv } from '../config/env';
import { getDb, getPool } from '../db';

const app = express();
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const env = getEnv();
    const db = getDb();
    await db.execute(sql`select 1`);

    res.json({
      ok: true,
      service: 'brt-api',
      database: 'up',
      port: env.port,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    res.status(503).json({
      ok: false,
      service: 'brt-api',
      database: 'down',
      error: message,
    });
  }
});

const { port } = getEnv();

const server = app.listen(port, () => {
  console.log(`brt-api listening on http://localhost:${port}`);
  console.log(`health: GET http://localhost:${port}/health`);
});

async function shutdown() {
  server.close();
  await getPool().end();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
