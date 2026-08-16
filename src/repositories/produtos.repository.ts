import { count, eq, sql } from 'drizzle-orm';
import type { Db } from '@src/db/client';
import { getDb, produtos } from '@src/db';
import type { ProdutosRepository } from '@src/repositories/ports/produtos.port';
import { mapProduto } from '@src/repositories/mappers/produtos.mapper';
import { Produtos } from '@src/models/produtos.models';

/**
 * Busca case/acento-insensitive.
 * Requer `CREATE EXTENSION unaccent` no banco (script ops — não inventar migration Drizzle).
 */
function searchDescricao(term: string) {
  const pattern = `%${term}%`;
  return sql`unaccent(${produtos.descricaoProduto}) ILIKE unaccent(${pattern})`;
}

/**
 * Impl Drizzle do port `ProdutosRepository`.
 */
export function createProdutosRepository(db: Db = getDb()): ProdutosRepository {
  return {
    async findMany({ pagination, search = '' }) {
      const { page, perPage } = pagination;
      const where = search.trim() ? searchDescricao(search.trim()) : undefined;

      try {
        const [rows, totalRows] = await Promise.all([
          db.query.produtos.findMany({
            where,
            limit: perPage,
            offset: (page - 1) * perPage,
          }),
          db.select({ value: count() }).from(produtos).where(where),
        ]);

        return {
          data: rows.map(mapProduto),
          total: Number(totalRows[0]?.value ?? 0),
        };
      } catch (error) {
        logger.error('Pg error on findMany produtoss', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async findById(id: string) {
      try {
        const [row] = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);

        return row ? mapProduto(row) : null;
      } catch (error) {
        logger.error('Pg error on findById produtos', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async update(id: string, input: Partial<Produtos>) {
      try {
        const [row] = await db
          .update(produtos)
          .set({
            descricaoProduto: input.descricaoProduto,
            quantidadeEstoque: input.quantidadeEstoque,
            precoLiquido: input.precoLiquido,
          })
          .where(eq(produtos.id, id))
          .returning();

        return row ? mapProduto(row) : null;
      } catch (error) {
        logger.error('Pg error on update produtos', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  };
}

let produtosRepository: ProdutosRepository | null = null;

export function getProdutosRepository(): ProdutosRepository {
  if (!produtosRepository) {
    produtosRepository = createProdutosRepository(getDb());
  }
  return produtosRepository;
}
