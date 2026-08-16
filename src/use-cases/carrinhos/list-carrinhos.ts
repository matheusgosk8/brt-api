import type { Pagination } from '@src/common/types/paginations';
import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import type { DomainError } from '@src/domain/errors';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import { Carrinho } from '@src/models/carrinho.models';
import { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';

export type ListCarrinhosResult = Either<
  DomainError,
  {
    data: Carrinho[];
    meta: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }
>;

type ListCarrinhosInput = Pagination & {
  carrinhoRepository?: CarrinhoRepository;
};

export async function listCarrinhosUseCase({
  page,
  perPage,
  carrinhoRepository = getCarrinhoRepository(),
}: ListCarrinhosInput): Promise<ListCarrinhosResult> {
  try {
    const { data, total } = await carrinhoRepository.findMany({
      pagination: { page, perPage },
    });

    return right({
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage) || 1),
      },
    });
  } catch (error) {
    return left(
      pgErrorToDomainError(error, {
        context: 'carrinho',
        customMessage: undefined,
      }),
    );
  }
}
