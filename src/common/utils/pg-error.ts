import type { DomainError } from '@src/domain/errors';
import { domainError } from '@src/domain/errors';

/**
 * Shape mínimo do erro Postgres (node-pg / cause do Drizzle).
 */
export interface PostgresErrorShape {
  code?: string;
  message?: string;
  detail?: string;
  constraint?: string;
  constraint_name?: string;
  table?: string;
  column?: string;
  severity?: string;
}

export type PgErrorKind =
  | 'CONNECTION'
  | 'UNDEFINED_COLUMN'
  | 'UNDEFINED_TABLE'
  | 'UNIQUE'
  | 'FOREIGN_KEY'
  | 'NOT_NULL'
  | 'INVALID_FORMAT'
  | 'UNKNOWN';

export interface MappedPgError {
  kind: PgErrorKind;
  pgCode?: string;
  message: string;
  detail?: string;
  constraint?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as Record<string, unknown>;
}

function readPgShape(value: unknown): PostgresErrorShape | null {
  const obj = asRecord(value);
  if (!obj) return null;

  const code = obj.code;
  if (typeof code !== 'string' && typeof obj.errno !== 'string') {
    // node às vezes manda errno numérico em conexão; ainda assim tenta message
    if (typeof obj.message !== 'string') return null;
  }

  return {
    code: typeof code === 'string' ? code : undefined,
    message: typeof obj.message === 'string' ? obj.message : undefined,
    detail: typeof obj.detail === 'string' ? obj.detail : undefined,
    constraint:
      typeof obj.constraint === 'string'
        ? obj.constraint
        : typeof obj.constraint_name === 'string'
          ? obj.constraint_name
          : undefined,
    constraint_name: typeof obj.constraint_name === 'string' ? obj.constraint_name : undefined,
    table: typeof obj.table === 'string' ? obj.table : undefined,
    column: typeof obj.column === 'string' ? obj.column : undefined,
    severity: typeof obj.severity === 'string' ? obj.severity : undefined,
  };
}

/**
 * Drizzle costuma envolver o erro pg em `error.cause`.
 * Em alguns paths o próprio Error já tem `.code` (DatabaseError do pg).
 */
export function extractPostgresError(error: unknown): PostgresErrorShape | null {
  if (error == null) return null;

  const direct = readPgShape(error);
  if (direct?.code) return direct;

  const asErr = asRecord(error);
  if (asErr?.cause) {
    const fromCause = readPgShape(asErr.cause);
    if (fromCause) return fromCause;
  }

  return direct;
}

export function isPostgresError(error: unknown): boolean {
  return extractPostgresError(error) !== null;
}

const CONNECTION_CODES = new Set(['08000', '08001', '08003', '08004', '08006', '57P01', '57P02', '57P03']);

const CONNECTION_NODE_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']);

/**
 * Mapeia erro PG/Drizzle → kind + mensagem amigável (versão enxuta do cms-be).
 * Sem catálogo grande de constraints — só o essencial pro carrinho.
 */
export function mapPgError(error: unknown, options?: { context?: string; customMessage?: string }): MappedPgError {
  const pg = extractPostgresError(error);
  const code = pg?.code;
  const rawMessage = pg?.message;
  const constraint = pg?.constraint ?? pg?.constraint_name;
  const context = options?.context ?? 'registro';

  if (
    (code && CONNECTION_CODES.has(code)) ||
    (code && CONNECTION_NODE_CODES.has(code)) ||
    /ECONNREFUSED|ENOTFOUND|timeout/i.test(rawMessage ?? '')
  ) {
    return {
      kind: 'CONNECTION',
      pgCode: code,
      message: options?.customMessage ?? 'Falha de conexão com o banco de dados',
      detail: rawMessage,
    };
  }

  switch (code) {
    case '42703':
      return {
        kind: 'UNDEFINED_COLUMN',
        pgCode: code,
        message: options?.customMessage ?? 'Coluna inexistente no banco (schema desatualizado?)',
        detail: rawMessage,
      };

    case '42P01':
      return {
        kind: 'UNDEFINED_TABLE',
        pgCode: code,
        message: options?.customMessage ?? 'Tabela inexistente no banco (rode as migrations)',
        detail: rawMessage,
      };

    case '23505':
      return {
        kind: 'UNIQUE',
        pgCode: code,
        message: options?.customMessage ?? `${context} já existe (violação de unicidade)`,
        detail: rawMessage,
        constraint,
      };

    case '23503':
      return {
        kind: 'FOREIGN_KEY',
        pgCode: code,
        message: options?.customMessage ?? `Referência inválida em ${context} (chave estrangeira)`,
        detail: rawMessage,
        constraint,
      };

    case '23502':
      return {
        kind: 'NOT_NULL',
        pgCode: code,
        message: options?.customMessage ?? `Campo obrigatório ausente em ${context}`,
        detail: rawMessage,
      };

    case '22P02':
      return {
        kind: 'INVALID_FORMAT',
        pgCode: code,
        message: options?.customMessage ?? `Formato inválido em ${context}`,
        detail: rawMessage,
      };

    default:
      return {
        kind: 'UNKNOWN',
        pgCode: code,
        message: options?.customMessage ?? 'Erro de banco de dados',
        detail: rawMessage,
        constraint,
      };
  }
}

/**
 * Converte MappedPgError → DomainError (pro Either do use case).
 */
export function pgErrorToDomainError(
  error: unknown,
  options?: { context?: string; customMessage?: string },
): DomainError {
  const mapped = mapPgError(error, options);

  logger.error('database error', {
    kind: mapped.kind,
    pgCode: mapped.pgCode,
    constraint: mapped.constraint,
    detail: mapped.detail,
  });

  switch (mapped.kind) {
    case 'UNIQUE':
    case 'FOREIGN_KEY':
    case 'NOT_NULL':
    case 'INVALID_FORMAT':
      return domainError('VALIDATION_ERROR', mapped.message);
    case 'CONNECTION':
    case 'UNDEFINED_COLUMN':
    case 'UNDEFINED_TABLE':
    case 'UNKNOWN':
    default:
      return domainError('INTERNAL', mapped.message);
  }
}
