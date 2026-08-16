import { pgTable, uuid, integer, unique } from 'drizzle-orm/pg-core';
import { carrinhos } from './carrinhos.schema';
import { produtos } from './produtos.schema';

export const itensCarrinho = pgTable(
  'itens_carrinho',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    carrinhoId: uuid('carrinho_id')
      .notNull()
      .references(() => carrinhos.id),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produtos.id),
    quantidade: integer('quantidade').notNull(),
  },
  (table) => [unique('itens_carrinho_carrinho_produto_unique').on(table.carrinhoId, table.produtoId)],
);

export type ItemCarrinho = typeof itensCarrinho.$inferSelect;
export type NovoItemCarrinho = typeof itensCarrinho.$inferInsert;
