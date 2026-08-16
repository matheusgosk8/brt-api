import { domainError, type DomainError } from '@src/domain/errors';
import type { CarrinhoDetalhe, CarrinhoItemView, CarrinhoView } from '@src/models/carrinho-detalhe.models';

/**
 * Guards puros: `null` = válido. Either fica só na fronteira do use case.
 */

export function validateQuantity(qty: number): DomainError | null {
  if (!Number.isInteger(qty) || qty <= 0) {
    return domainError('INVALID_QUANTITY', 'Quantidade deve ser um inteiro maior que zero');
  }
  return null;
}

/** Estoque não dá pra restringir só no DB — checagem aqui. */
export function validateStock(requested: number, available: number): DomainError | null {
  if (requested > available) {
    return domainError('INSUFFICIENT_STOCK', 'Quantidade solicitada maior que o estoque disponível');
  }
  return null;
}

/** Σ (preço × qty) em centavos. */
export function calculateSubtotal(itens: CarrinhoDetalhe['itens']): number {
  return itens.reduce((acc, item) => acc + item.produto.precoLiquido * item.quantidade, 0);
}

/** Desconto em centavos a partir do % do cupom (null/0 → 0). */
export function calculateDiscount(subtotal: number, percentual: number | null | undefined): number {
  if (!percentual || percentual <= 0 || subtotal <= 0) return 0;
  return Math.round((subtotal * percentual) / 100);
}

export function calculateTotal(subtotal: number, desconto: number): number {
  return Math.max(0, subtotal - desconto);
}

/**
 * Aplica % do cupom na linha (centavos). Sem cupom → valor = valorOriginal.
 */
export function applyPercentOnCents(valorOriginal: number, percentual: number): number {
  if (!percentual || percentual <= 0) return valorOriginal;
  return Math.round((valorOriginal * (100 - percentual)) / 100);
}

/**
 * Monta a view do carrinho: preços por item + totais (sempre derivados).
 * Não persiste — chamar no find e após mutações.
 */
export function buildCarrinhoView(carrinho: CarrinhoDetalhe): CarrinhoView {
  const percentual = carrinho.cupom?.percentualDesconto ?? 0;

  const itens: CarrinhoItemView[] = carrinho.itens.map((item) => {
    const precoUnitario = item.produto.precoLiquido;
    const valorOriginal = precoUnitario * item.quantidade;
    const valor = applyPercentOnCents(valorOriginal, percentual);

    return {
      ...item,
      precoUnitario,
      valorOriginal,
      valor,
    };
  });

  const valorTotalOriginal = itens.reduce((acc, i) => acc + i.valorOriginal, 0);
  const desconto = calculateDiscount(valorTotalOriginal, percentual);
  const valorTotal = calculateTotal(valorTotalOriginal, desconto);

  return {
    ...carrinho,
    itens,
    valorTotalOriginal,
    desconto,
    valorTotal,
    subtotal: valorTotalOriginal,
    total: valorTotal,
  };
}
