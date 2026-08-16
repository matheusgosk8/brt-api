import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { buildCarrinhoView } from '@src/domain/carrinho';
import { domainError, type DomainError } from '@src/domain/errors';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';

export type FindCarrinhoResult = Either<DomainError, CarrinhoView>;

type FindCarrinhoInput = {
  id: string;
  carrinhoRepository?: CarrinhoRepository;
};

export async function findCarrinhoUseCase({
  id,
  carrinhoRepository = getCarrinhoRepository(),
}: FindCarrinhoInput): Promise<FindCarrinhoResult> {
  try {
    if (!id?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'Id do carrinho é obrigatório'));
    }

    const carrinho = await carrinhoRepository.findById(id);

    if (!carrinho) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }

    return right(buildCarrinhoView(carrinho));
  } catch (error) {
    return left(
      pgErrorToDomainError(error, {
        context: 'carrinho',
      }),
    );
  }
}
