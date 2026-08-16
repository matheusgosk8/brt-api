import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { getEnv } from '../config/env';
import { getDb } from '../db';
import { sendSuccess } from '../common/utils/response';
import { sendError } from '../common/utils/error-response';

type HealthData = {
  service: string;
  database: 'up' | 'down';
  port: number;
};

export async function healthCheck(c: Context) {
  try {
    const env = getEnv();
    const db = getDb();
    await db.execute(sql`select 1`);

    logger.info('health check ok', { database: 'up' });

    return sendSuccess<HealthData>({
      ctx: c,
      data: {
        service: 'brt-api',
        database: 'up',
        port: env.port,
      },
      message: 'OK',
      statusCode: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error('health check failed', { error: message });

    return sendError({
      ctx: c,
      statusCode: 503,
      message: 'Serviço indisponível',
      data: {
        service: 'brt-api',
        database: 'down' as const,
        error: message,
      },
    });
  }
}
