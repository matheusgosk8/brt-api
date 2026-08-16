/**
 * Formato do banco em horário local (sem fuso): `2026-07-22 15:45:35.227`
 *
 * Colunas `timestamp without time zone` gravam o wall-clock literal.
 * `new Date()` / `Date#toISOString()` padrão enviam UTC (+3h em BRT).
 *
 * - CTE / SQL cru: use `formatPgLocalTimestamp(...)`.
 * - `.$onUpdate` do Drizzle: use `() => pgLocalNow()` — devolve um Date cujo
 *   `toISOString` emite o **mesmo** literal local (Drizzle chama toISOString
 *   em `mapToDriverValue`; string pura quebra).
 *
 * @param date - Data a formatar (default: agora).
 * @returns Literal `YYYY-MM-DD HH:mm:ss.SSS` no fuso local da máquina.
 */
export function formatPgLocalTimestamp(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}`;
}

class PgLocalDate extends Date {
  private readonly localLiteral: string;

  constructor(date: Date = new Date()) {
    super(date.getTime());
    this.localLiteral = formatPgLocalTimestamp(date);
  }

  override toISOString(): string {
    return this.localLiteral;
  }
}

export function pgLocalNow(date: Date = new Date()): Date {
  return new PgLocalDate(date);
}
