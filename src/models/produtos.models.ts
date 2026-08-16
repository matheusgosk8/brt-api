/**
 * Shape de produto na API / domínio (preço sempre em centavos).
 */
export type Produtos = {
  id: string;
  descricaoProduto: string;
  quantidadeEstoque: number;
  precoLiquido: number;
  createdAt: string;
  updatedAt: string;
};
