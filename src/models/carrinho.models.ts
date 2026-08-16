const CarrinhoStatusEnum = {
  ABERTO: 'ABERTO',
  FINALIZADO: 'FINALIZADO',
} as const;

export type CarrinhoStatus = (typeof CarrinhoStatusEnum)[keyof typeof CarrinhoStatusEnum];

export type Carrinho = {
  id: string;
  status: CarrinhoStatus;
  cupomId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Payload do repo — create da API não exige body do client. */
export type CreateCarrinhoInput = {
  status?: CarrinhoStatus;
  cupomId?: string | null;
};

export { CarrinhoStatusEnum };
