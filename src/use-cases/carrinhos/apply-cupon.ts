import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import { buildCarrinhoView } from '@src/domain/carrinho';
import { domainError, type DomainError } from '@src/domain/errors';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import { getCuponsRepository } from '@src/repositories/cupons.repository';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import type { CuponsRepository } from '@src/repositories/ports/cupons.port';

export type ApplyCuponResult = Either<DomainError, CarrinhoView>;

type ApplyCuponInput = {
  carrinhoId: string;
  codigoCupom: string;
  carrinhoRepository?: CarrinhoRepository;
  cuponsRepository?: CuponsRepository;
};

/**
 * POST /carrinhos/:id/cupom — aplica/troca cupom pelo código.
 *
 * Sem SELECT de checagem do carrinho: o UPDATE filtra id + status ABERTO
 * e `returning()` vazio significa inexistente ou fechado.
 */
export async function applyCuponUseCase({
  carrinhoId,
  codigoCupom,
  carrinhoRepository = getCarrinhoRepository(),
  cuponsRepository = getCuponsRepository(),
}: ApplyCuponInput): Promise<ApplyCuponResult> {
  try {
    if (!carrinhoId?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'carrinhoId é obrigatório'));
    }

    const codigo = codigoCupom?.trim();
    if (!codigo) {
      return left(domainError('VALIDATION_ERROR', 'codigoCupom é obrigatório'));
    }

    const cupom = await cuponsRepository.findByCodigo(codigo);
    if (!cupom) {
      return left(domainError('COUPON_NOT_FOUND', 'Cupom não encontrado'));
    }

    const updated = await carrinhoRepository.updateById(
      carrinhoId,
      { cupomId: cupom.id },
      { expectedStatus: 'ABERTO' },
    );
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
        context: 'apply cupom',
      }),
    );
  }
}
