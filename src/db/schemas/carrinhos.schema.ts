import { pgTable, pgEnum, uuid, timestamp } from 'drizzle-orm/pg-core';
import { cupons } from './cupons.schema';
import { pgLocalNow } from '@src/common/utils/pgToLocalDate';

export const carrinhoStatusEnum = pgEnum('carrinho_status', ['ABERTO', 'FINALIZADO']);

export const carrinhos = pgTable('carrinhos', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: carrinhoStatusEnum('status').notNull().default('ABERTO'),
  cupomId: uuid('cupom_id').references(() => cupons.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => pgLocalNow()),
});

export type Carrinho = typeof carrinhos.$inferSelect;
export type NovoCarrinho = typeof carrinhos.$inferInsert;
