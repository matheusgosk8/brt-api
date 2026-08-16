import type { Pagination } from '@src/common/types/paginations';
import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import type { DomainError } from '@src/domain/errors';
import type { Produtos } from '@src/models/produtos.models';
import type { ProdutosRepository } from '@src/repositories/ports/produtos.port';
import { getProdutosRepository } from '@src/repositories/produtos.repository';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';

export type ListProductsResult = Either<
  DomainError,
  {
    data: Produtos[];
    meta: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }
>;

type ListProductsInput = Pagination & {
  search?: string;
  produtosRepository?: ProdutosRepository;
};

export async function listProductsUseCase({
  page,
  perPage,
  search = '',
  produtosRepository = getProdutosRepository(),
}: ListProductsInput): Promise<ListProductsResult> {
  try {
    const { data, total } = await produtosRepository.findMany({
      pagination: { page, perPage },
      search,
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
        context: 'produto',
        customMessage: undefined,
      }),
    );
  }
}
