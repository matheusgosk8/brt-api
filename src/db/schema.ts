import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const carrinhoStatusEnum = pgEnum('carrinho_status', [
  'ABERTO',
  'FINALIZADO',
]);

export const produtos = pgTable('produtos', {
  id: uuid('id').primaryKey().defaultRandom(),
  descricaoProduto: text('descricao_produto').notNull(),
  quantidadeEstoque: integer('quantidade_estoque').notNull(),
  precoLiquido: numeric('preco_liquido', { precision: 10, scale: 2 }).notNull(),
});

export const cupons = pgTable('cupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigoCupom: text('codigo_cupom').notNull().unique(),
  percentualDesconto: numeric('percentual_desconto', {
    precision: 5,
    scale: 2,
  }).notNull(),
});

export const carrinhos = pgTable('carrinhos', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: carrinhoStatusEnum('status').notNull().default('ABERTO'),
  cupomId: uuid('cupom_id').references(() => cupons.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
  (table) => [
    unique('itens_carrinho_carrinho_produto_unique').on(
      table.carrinhoId,
      table.produtoId,
    ),
  ],
);

export type Produto = typeof produtos.$inferSelect;
export type Cupom = typeof cupons.$inferSelect;
export type Carrinho = typeof carrinhos.$inferSelect;
export type ItemCarrinho = typeof itensCarrinho.$inferSelect;
