import { pgLocalNow } from '@src/common/utils/pgToLocalDate';
import { timestamp } from 'drizzle-orm/pg-core';
import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';

/**
 * precoLiquido em centavos (integer), ex.: R$ 349,90 → 34990
 */
export const produtos = pgTable('produtos', {
  id: uuid('id').primaryKey().defaultRandom(),
  descricaoProduto: text('descricao_produto').notNull(),
  quantidadeEstoque: integer('quantidade_estoque').notNull(),
  precoLiquido: integer('preco_liquido').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => pgLocalNow()),
});

export type Produto = typeof produtos.$inferSelect;
export type NovoProduto = typeof produtos.$inferInsert;
