import { and, eq } from 'drizzle-orm';
import type { Db } from '@src/db/client';
import { getDb, itensCarrinho } from '@src/db';
import type { CreateCarrinhoItensInput } from '@src/models/carrinho-itens.models';
import type { CarrinhoItensRepository } from '@src/repositories/ports/carrinho-itens.port';
import { mapCarrinhoItem } from '@src/repositories/mappers/carrinho-itens.mapper';

export function createCarrinhoItensRepository(db: Db = getDb()): CarrinhoItensRepository {
  return {
    async findById(id: string) {
      try {
        const [row] = await db.select().from(itensCarrinho).where(eq(itensCarrinho.id, id)).limit(1);

        return row ? mapCarrinhoItem(row) : null;
      } catch (error) {
        logger.error('Pg error on findById item carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async findByCarrinhoAndProduto(carrinhoId: string, produtoId: string) {
      try {
        const [row] = await db
          .select()
          .from(itensCarrinho)
          .where(and(eq(itensCarrinho.carrinhoId, carrinhoId), eq(itensCarrinho.produtoId, produtoId)))
          .limit(1);

        return row ? mapCarrinhoItem(row) : null;
      } catch (error) {
        logger.error('Pg error on findByCarrinhoAndProduto item', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async create(input: CreateCarrinhoItensInput) {
      try {
        const [row] = await db
          .insert(itensCarrinho)
          .values({
            carrinhoId: input.carrinhoId,
            produtoId: input.produtoId,
            quantidade: input.quantidade,
          })
          .returning();

        return row ? mapCarrinhoItem(row) : null;
      } catch (error) {
        logger.error('Pg error on create item carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async updateQuantidade(id: string, quantidade: number) {
      try {
        const [row] = await db.update(itensCarrinho).set({ quantidade }).where(eq(itensCarrinho.id, id)).returning();

        return row ? mapCarrinhoItem(row) : null;
      } catch (error) {
        logger.error('Pg error on updateQuantidade item carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async remove(id: string) {
      try {
        const deleted = await db
          .delete(itensCarrinho)
          .where(eq(itensCarrinho.id, id))
          .returning({ id: itensCarrinho.id });

        return deleted.length > 0;
      } catch (error) {
        logger.error('Pg error on remove item carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async findByCarrinho(carrinhoId: string) {
      try {
        const rows = await db.select().from(itensCarrinho).where(eq(itensCarrinho.carrinhoId, carrinhoId));

        return rows ? rows.map(mapCarrinhoItem) : [];
      } catch (error) {
        logger.error('Pg error on findByCarrinho item carrinho', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  };
}

let carrinhoItensRepository: CarrinhoItensRepository | null = null;

export function getCarrinhoItensRepository(): CarrinhoItensRepository {
  if (!carrinhoItensRepository) {
    carrinhoItensRepository = createCarrinhoItensRepository(getDb());
  }
  return carrinhoItensRepository;
}
