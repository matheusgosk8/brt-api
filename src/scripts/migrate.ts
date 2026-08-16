import path from 'path';
import dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb, closeDb } from '../db';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const db = getDb();
  const migrationsFolder = path.resolve(process.cwd(), 'src/db/migrations');

  console.log(`Running migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log('Migrations applied.');
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await closeDb();
  } catch {
    // ignore
  }
  process.exit(1);
});
