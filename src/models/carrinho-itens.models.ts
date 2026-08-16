export type CreateCarrinhoItensInput = {
  carrinhoId: string;
  produtoId: string;
  quantidade: number;
};

export type CarrinhoItens = {
  id: string;
  carrinhoId: string;
  produtoId: string;
  quantidade: number;
};
