/**
 * Barrel do schema Drizzle — drizzle.config aponta para este arquivo.
 * FKs ficam nos próprios schemas (`.references()`); sem arquivo relations separado.
 */
export * from './produtos.schema';
export * from './cupons.schema';
export * from './carrinhos.schema';
export * from './itens-carrinho.schema';
