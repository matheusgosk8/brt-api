import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import { buildCarrinhoView } from '@src/domain/carrinho';
import { domainError, type DomainError } from '@src/domain/errors';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';

export type RemoveCuponResult = Either<DomainError, CarrinhoView>;

type RemoveCuponInput = {
  carrinhoId: string;
  carrinhoRepository?: CarrinhoRepository;
};

/**
 * DELETE /carrinhos/:id/cupom — zera cupomId.
 *
 * Sem SELECT de checagem: o UPDATE já filtra id + status ABERTO e
 * `returning()` vazio (null) significa id inexistente ou carrinho fechado.
 */
export async function removeCuponUseCase({
  carrinhoId,
  carrinhoRepository = getCarrinhoRepository(),
}: RemoveCuponInput): Promise<RemoveCuponResult> {
  try {
    if (!carrinhoId?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'carrinhoId é obrigatório'));
    }

    const updated = await carrinhoRepository.updateById(carrinhoId, { cupomId: null }, { expectedStatus: 'ABERTO' });

    if (!updated) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado ou não está aberto'));
    }

    const detalhe = await carrinhoRepository.findById(carrinhoId);
    if (!detalhe) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }

    return right(buildCarrinhoView(detalhe));
  } catch (error) {
    return left(
      pgErrorToDomainError(error, {
        context: 'remove cupom',
      }),
    );
  }
}
