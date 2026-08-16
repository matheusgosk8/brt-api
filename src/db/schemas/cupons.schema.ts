import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';

/**
 * percentualDesconto em pontos percentuais inteiros, ex.: 10 = 10%, 15 = 15%
 * (não é dinheiro — não usa centavos)
 */
export const cupons = pgTable('cupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigoCupom: text('codigo_cupom').notNull().unique(),
  percentualDesconto: integer('percentual_desconto').notNull(),
});

export type Cupom = typeof cupons.$inferSelect;
export type NovoCupom = typeof cupons.$inferInsert;
