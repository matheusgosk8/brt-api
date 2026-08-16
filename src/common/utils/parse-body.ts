import type { Context } from 'hono';
import { sendError } from './error-response';

type ParseOk<T> = { ok: true; data: T };
type ParseFail = { ok: false; response: ReturnType<typeof sendError> };

type ParseBodyParams = {
  ctx: Context;
};

/**
 * Lê e tipa o JSON do body (POST/PUT/PATCH).
 *
 * @example
 * const parsed = await parseBody<{ produtoId: string }>({ ctx: c });
 * if (!parsed.ok) return parsed.response;
 * const { produtoId } = parsed.data;
 */
export async function parseBody<T>({ ctx }: ParseBodyParams): Promise<ParseOk<T> | ParseFail> {
  try {
    const data = await ctx.req.json<T>();
    return { ok: true, data };
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'invalid json';
    logger.error('failed to parse request body', { error: detail });
    return {
      ok: false,
      response: sendError({
        ctx,
        statusCode: 400,
        message: 'Body JSON inválido',
        data: null,
      }),
    };
  }
}
