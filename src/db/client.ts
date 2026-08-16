import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schemas';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Singleton do pool + Drizzle.
 *
 * Em serverless (Lambda), cada *container* warm deve reutilizar a mesma instância.
 * Criar `new Pool()` / `drizzle()` por request (ou por `new Repo(db)` com db novo)
 * estoura conexões no Postgres e perde o benefício do warm start.
 *
 * Local (teste): ok mesmo com pool pequeno.
 * Prod Neon/pg: preferir connection string **pooled** + `DB_POOL_MAX` baixo (ex. 1–2).
 */
class Database {
  private static instance: Database | null = null;

  private readonly pool: Pool;
  private readonly drizzle: DrizzleDb;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }

    const max = Number(process.env.DB_POOL_MAX ?? 2);

    this.pool = new Pool({
      connectionString,
      max,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });

    this.drizzle = drizzle(this.pool, { schema });
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  static async shutdown(): Promise<void> {
    if (!Database.instance) return;
    await Database.instance.pool.end();
    Database.instance = null;
  }

  get client(): DrizzleDb {
    return this.drizzle;
  }

  get pgPool(): Pool {
    return this.pool;
  }
}

/** Drizzle compartilhado no processo (Lambda warm / `npm run dev`). */
export function getDb(): DrizzleDb {
  return Database.getInstance().client;
}

export function getPool(): Pool {
  return Database.getInstance().pgPool;
}

/** Encerra o pool (scripts migrate/seed e shutdown do server local). */
export async function closeDb(): Promise<void> {
  await Database.shutdown();
}

export type Db = DrizzleDb;
