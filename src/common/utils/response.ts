import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from '../../models/api-response';

type SendSuccessParams<T, M = undefined> = {
  ctx: Context;
  data?: T;
  meta?: M;
  message?: string;
  statusCode?: ContentfulStatusCode;
};

/**
 * Resposta de sucesso: `{ statusCode, message, data, meta? }`
 *
 * @example
 * sendSuccess({ ctx: c, data: items, meta: { page: 1, ... }, message: 'OK' })
 */
export function sendSuccess<T, M = undefined>({
  ctx,
  data = undefined,
  meta,
  message = 'OK',
  statusCode = 200,
}: SendSuccessParams<T, M>) {
  ctx.header('Content-Type', 'application/json; charset=utf-8');

  const body: ApiResponse<T | undefined, M> = {
    statusCode,
    message,
    data,
    ...(meta !== undefined ? { meta } : {}),
  };

  return ctx.json(body, statusCode);
}
