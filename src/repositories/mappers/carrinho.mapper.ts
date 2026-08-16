import type { Carrinho as CarrinhoRow } from '@src/db/schemas/carrinhos.schema';
import type { Cupom as CupomRow } from '@src/db/schemas/cupons.schema';
import type { ItemCarrinho as ItemRow } from '@src/db/schemas/itens-carrinho.schema';
import type { Produto as ProdutoRow } from '@src/db/schemas/produtos.schema';
import type { Carrinho } from '@src/models/carrinho.models';
import type { CarrinhoDetalhe } from '@src/models/carrinho-detalhe.models';

export function mapCarrinho(row: CarrinhoRow): Carrinho {
  return {
    id: row.id,
    status: row.status,
    cupomId: row.cupomId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Linha flat do leftJoin carrinho+cupom+itens+produto. */
export type CarrinhoJoinRow = {
  carrinho: CarrinhoRow;
  cupom: CupomRow | null;
  item: ItemRow | null;
  produto: ProdutoRow | null;
};

/**
 * Agrega o resultado do join (N linhas) em um CarrinhoDetalhe.
 * Sem cupom/itens → cupom null, itens [].
 */
export function mapCarrinhoDetalheFromJoins(rows: CarrinhoJoinRow[]): CarrinhoDetalhe | null {
  if (rows.length === 0) return null;

  const { carrinho, cupom } = rows[0];
  const itensMap = new Map<string, CarrinhoDetalhe['itens'][number]>();

  for (const row of rows) {
    if (!row.item || !row.produto) continue;
    if (itensMap.has(row.item.id)) continue;

    itensMap.set(row.item.id, {
      id: row.item.id,
      carrinhoId: row.item.carrinhoId,
      produtoId: row.item.produtoId,
      quantidade: row.item.quantidade,
      produto: {
        id: row.produto.id,
        descricaoProduto: row.produto.descricaoProduto,
        quantidadeEstoque: row.produto.quantidadeEstoque,
        precoLiquido: row.produto.precoLiquido,
      },
    });
  }

  return {
    id: carrinho.id,
    status: carrinho.status,
    cupomId: carrinho.cupomId,
    createdAt: carrinho.createdAt.toISOString(),
    updatedAt: carrinho.updatedAt.toISOString(),
    cupom: cupom
      ? {
          id: cupom.id,
          codigoCupom: cupom.codigoCupom,
          percentualDesconto: cupom.percentualDesconto,
        }
      : null,
    itens: Array.from(itensMap.values()),
  };
}
