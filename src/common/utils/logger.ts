/** Exibição no log — não altera process.env.TZ. */
const LOG_TIMEZONE = 'America/Sao_Paulo';

export type LogLevel = 'DEBUG' | 'INFO' | 'ERROR';

const LEVEL_ORDER: Record<LogLevel, number> = {
  ERROR: 0,
  INFO: 1,
  DEBUG: 2,
};

/**
 * Timestamp America/Sao_Paulo (ex.: 2026-08-16T03:54:12.345-03:00).
 * Brasil sem horário de verão — offset fixo -03:00.
 */
function nowSaoPaulo(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LOG_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    fractionalSecondDigits: 3,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${get('fractionalSecond')}-03:00`;
}

function configuredLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? 'INFO').toUpperCase();
  if (raw === 'DEBUG' || raw === 'INFO' || raw === 'ERROR') return raw;
  return 'INFO';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[configuredLevel()];
}

function formatMeta(meta?: unknown): string {
  if (meta === undefined) return '';
  if (typeof meta === 'string') return ` ${meta}`;
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;

  // `\n` explícito: CloudWatch / terminais ficam com uma linha por evento.
  const line = `${nowSaoPaulo()} [${level}] ${message}${formatMeta(meta)}\n`;

  if (level === 'ERROR') {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    write('DEBUG', message, meta);
  },
  info(message: string, meta?: unknown): void {
    write('INFO', message, meta);
  },
  error(message: string, meta?: unknown): void {
    write('ERROR', message, meta);
  },
};

/** Disponibiliza `logger` global (sem import) após carregar este módulo uma vez. */
globalThis.logger = logger;
