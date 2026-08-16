import type { Pagination } from '@src/common/types/paginations';
import type { Carrinho, CarrinhoStatus, CreateCarrinhoInput } from '@src/models/carrinho.models';
import type { CarrinhoDetalhe } from '@src/models/carrinho-detalhe.models';

export type FindManyCarrinhosInput = {
  pagination: Pagination;
};

export type FindManyCarrinhosOutput = {
  data: Carrinho[];
  total: number;
};

export interface CarrinhoRepository {
  findMany(input: FindManyCarrinhosInput): Promise<FindManyCarrinhosOutput>;
  create(input?: CreateCarrinhoInput): Promise<Carrinho | null>;
  findById(id: string): Promise<CarrinhoDetalhe | null>;
  /**
   * `returning()`: 0 linhas → `null` (id inexistente ou fora do `expectedStatus`).
   * Evita SELECT prévio só pra checar existência.
   */
  updateById(
    id: string,
    input: Partial<CreateCarrinhoInput>,
    options?: { expectedStatus?: CarrinhoStatus },
  ): Promise<Carrinho | null>;
}
