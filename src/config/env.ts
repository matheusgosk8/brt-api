import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function getEnv() {
  return {
    databaseUrl: required('DATABASE_URL'),
    port: Number(process.env.PORT ?? 3001),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    logLevel: (process.env.LOG_LEVEL ?? 'INFO').toUpperCase(),
  };
}
