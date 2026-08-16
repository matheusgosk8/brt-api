import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { domainError, type DomainError } from '@src/domain/errors';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import type { Carrinho } from '@src/models/carrinho.models';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';

/** Right = entidade direto (sendSuccess coloca em `data`). */
export type CreateCarrinhoResult = Either<DomainError, Carrinho>;

type CreateCarrinhoUseCaseInput = {
  carrinhoRepository?: CarrinhoRepository;
};

export async function createCarrinhoUseCase({
  carrinhoRepository = getCarrinhoRepository(),
}: CreateCarrinhoUseCaseInput = {}): Promise<CreateCarrinhoResult> {
  try {
    const carrinho = await carrinhoRepository.create({
      status: 'ABERTO',
      cupomId: null,
    });

    if (!carrinho) {
      return left(domainError('INTERNAL', 'Não foi possível criar o carrinho'));
    }

    return right(carrinho);
  } catch (error) {
    return left(
      pgErrorToDomainError(error, {
        context: 'carrinho',
      }),
    );
  }
}
