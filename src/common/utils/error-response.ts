import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from '../../models/api-response';
import type { DomainError, DomainErrorCode } from '../../domain/errors';
import { isDomainError } from '../../domain/errors';

type SendErrorParams<T> = {
  ctx: Context;
  statusCode: ContentfulStatusCode;
  message: string;
  data?: T;
};

export type ErrorBodyData = {
  code: DomainErrorCode | 'INTERNAL' | 'BAD_REQUEST';
};

/**
 * Resposta de erro padronizada (mesmo envelope das respostas ok).
 */
export function sendError<T = ErrorBodyData | null>({
  ctx,
  statusCode,
  message,
  data = null as T,
}: SendErrorParams<T>) {
  ctx.header('Content-Type', 'application/json; charset=utf-8');

  const body: ApiResponse<T> = {
    statusCode,
    message,
    data,
  };

  logger.error(message, { statusCode, data });

  return ctx.json(body, statusCode);
}

/** Códigos de domínio → HTTP (FE pode refetch catálogo em INSUFFICIENT_STOCK). */
export function mapDomainCodeToHttpStatus(code: DomainErrorCode): ContentfulStatusCode {
  switch (code) {
    case 'CART_NOT_FOUND':
    case 'PRODUCT_NOT_FOUND':
    case 'ITEM_NOT_FOUND':
    case 'COUPON_NOT_FOUND':
    case 'INVALID_CUPON':
      return 404;
    case 'INTERNAL':
      return 500;
    case 'INVALID_QUANTITY':
    case 'INSUFFICIENT_STOCK':
    case 'CART_CLOSED':
    case 'CART_ALREADY_FINALIZED':
    case 'EMPTY_CART':
    case 'VALIDATION_ERROR':
    default:
      return 400;
  }
}

type SendDomainErrorParams = {
  ctx: Context;
  error: DomainError;
};

export function sendDomainError({ ctx, error }: SendDomainErrorParams) {
  return sendError({
    ctx,
    statusCode: mapDomainCodeToHttpStatus(error.code),
    message: error.message,
    data: { code: error.code },
  });
}

/** Fallback se algo não-DomainError vazar do use case. */
export function respondUnknownError(ctx: Context, err: unknown) {
  if (isDomainError(err)) {
    return sendDomainError({ ctx, error: err });
  }

  const message = err instanceof Error ? err.message : 'Erro interno';
  logger.error('unhandled error', { error: message });

  return sendError({
    ctx,
    statusCode: 500,
    message: 'Erro interno',
    data: { code: 'INTERNAL' },
  });
}
