import { and, count, eq } from 'drizzle-orm';
import type { Db } from '@src/db/client';
import { carrinhos, cupons, getDb, itensCarrinho, produtos } from '@src/db';
import type { CarrinhoStatus, CreateCarrinhoInput } from '@src/models/carrinho.models';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import { mapCarrinho, mapCarrinhoDetalheFromJoins } from '@src/repositories/mappers/carrinho.mapper';

export function createCarrinhoRepository(db: Db = getDb()): CarrinhoRepository {
  return {
    async findMany({ pagination }) {
      const { page, perPage } = pagination;

      try {
        const [rows, totalRows] = await Promise.all([
          db.query.carrinhos.findMany({
            limit: perPage,
            offset: (page - 1) * perPage,
          }),
          db.select({ value: count() }).from(carrinhos),
        ]);

        return {
          data: rows.map(mapCarrinho),
          total: Number(totalRows[0]?.value ?? 0),
        };
      } catch (error) {
        logger.error('Pg error on findMany carrinhos', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async create(input: CreateCarrinhoInput = {}) {
      try {
        const [row] = await db
          .insert(carrinhos)
          .values({
            status: input.status ?? 'ABERTO',
            cupomId: input.cupomId ?? null,
          })
          .returning();
        return row ? mapCarrinho(row) : null;
      } catch (error) {
        logger.error('Pg error on create carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async findById(id: string) {
      try {
        const rows = await db
          .select({
            carrinho: carrinhos,
            cupom: cupons,
            item: itensCarrinho,
            produto: produtos,
          })
          .from(carrinhos)
          .leftJoin(cupons, eq(carrinhos.cupomId, cupons.id))
          .leftJoin(itensCarrinho, eq(itensCarrinho.carrinhoId, carrinhos.id))
          .leftJoin(produtos, eq(itensCarrinho.produtoId, produtos.id))
          .where(eq(carrinhos.id, id));

        return mapCarrinhoDetalheFromJoins(rows);
      } catch (error) {
        logger.error('Pg error on findById carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async updateById(id: string, input: Partial<CreateCarrinhoInput>, options?: { expectedStatus?: CarrinhoStatus }) {
      try {
        const where = options?.expectedStatus
          ? and(eq(carrinhos.id, id), eq(carrinhos.status, options.expectedStatus))
          : eq(carrinhos.id, id);

        const [row] = await db.update(carrinhos).set(input).where(where).returning();

        // 0 linhas = id inexistente ou status divergente — null (sem throw → sem 500)
        return row ? mapCarrinho(row) : null;
      } catch (error) {
        logger.error('Pg error on updateById carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  };
}

let carrinhoRepository: CarrinhoRepository | null = null;

export function getCarrinhoRepository(): CarrinhoRepository {
  if (!carrinhoRepository) {
    carrinhoRepository = createCarrinhoRepository(getDb());
  }
  return carrinhoRepository;
}
