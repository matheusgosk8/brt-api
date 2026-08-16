/**
 * Erro de domínio como interface + factory (sem classe obrigatória).
 * Identifica com `isDomainError` / `_tag` — não use `instanceof` em interface.
 */

export type DomainErrorCode =
  | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_STOCK'
  | 'CART_CLOSED'
  | 'ITEM_NOT_FOUND'
  | 'COUPON_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'CART_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL'
  | 'INVALID_CUPON'
  | 'CART_ALREADY_FINALIZED'
  | 'EMPTY_CART';

export interface DomainError {
  readonly _tag: 'DomainError';
  readonly code: DomainErrorCode;
  readonly message: string;
}

export function domainError(code: DomainErrorCode, message: string): DomainError {
  return { _tag: 'DomainError', code, message };
}

export function isDomainError(value: unknown): value is DomainError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as DomainError)._tag === 'DomainError' &&
    typeof (value as DomainError).code === 'string' &&
    typeof (value as DomainError).message === 'string'
  );
}
