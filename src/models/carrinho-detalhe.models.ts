import type { CarrinhoStatus } from '@src/models/carrinho.models';

/** Cupom ligado ao carrinho (pode ser null). */
export type CarrinhoCupomData = {
  id: string;
  codigoCupom: string;
  percentualDesconto: number;
};

/** Item + produto (preço em centavos) — shape do repo. */
export type CarrinhoItemData = {
  id: string;
  carrinhoId: string;
  produtoId: string;
  quantidade: number;
  produto: {
    id: string;
    descricaoProduto: string;
    quantidadeEstoque: number;
    precoLiquido: number;
  };
};

/**
 * Carrinho completo vindo do repo (1 query com joins).
 * Totais entram via `buildCarrinhoView` no domain.
 */
export type CarrinhoDetalhe = {
  id: string;
  status: CarrinhoStatus;
  cupomId: string | null;
  createdAt: string;
  updatedAt: string;
  cupom: CarrinhoCupomData | null;
  itens: CarrinhoItemData[];
};

/** Item na resposta da API (com preços derivados). */
export type CarrinhoItemView = CarrinhoItemData & {
  /** Preço unitário atual do produto (centavos). */
  precoUnitario: number;
  /** Linha sem desconto: unitário × qty. */
  valorOriginal: number;
  /** Linha com cupom aplicado (centavos). */
  valor: number;
};

/** Carrinho completo para HTTP (find + mutações). */
export type CarrinhoView = Omit<CarrinhoDetalhe, 'itens'> & {
  itens: CarrinhoItemView[];
  /** Soma das linhas sem desconto. */
  valorTotalOriginal: number;
  /** Desconto do cupom em centavos (0 se sem cupom). */
  desconto: number;
  /** Total com desconto. */
  valorTotal: number;
  /** Aliases do contrato do desafio. */
  subtotal: number;
  total: number;
};
