import type { ItemCarrinho } from '@src/db/schemas/itens-carrinho.schema';
import type { CarrinhoItens } from '@src/models/carrinho-itens.models';

/** Drizzle row → model de aplicação. */
export function mapCarrinhoItem(row: ItemCarrinho): CarrinhoItens {
  return {
    id: row.id,
    carrinhoId: row.carrinhoId,
    produtoId: row.produtoId,
    quantidade: row.quantidade,
  };
}
