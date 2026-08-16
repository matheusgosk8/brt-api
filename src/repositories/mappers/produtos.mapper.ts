import type { Produtos } from '@src/models/produtos.models';
import type { Produto } from '@src/db/schemas/produtos.schema';

/** Drizzle row → model de aplicação (centavos + ISO dates). */
export function mapProduto(row: Produto): Produtos {
  return {
    id: row.id,
    descricaoProduto: row.descricaoProduto,
    quantidadeEstoque: row.quantidadeEstoque,
    precoLiquido: row.precoLiquido,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
