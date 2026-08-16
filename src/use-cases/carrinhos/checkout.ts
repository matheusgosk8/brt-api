import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import { buildCarrinhoView } from '@src/domain/carrinho';
import { domainError, type DomainError } from '@src/domain/errors';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import { getCarrinhoItensRepository } from '@src/repositories/carrinho-itens.repository';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import type { CarrinhoItensRepository } from '@src/repositories/ports/carrinho-itens.port';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';

type CheckoutInput = {
  carrinhoId: string;
  carrinhoRepository?: CarrinhoRepository;
  carrinhoItensRepository?: CarrinhoItensRepository;
};

export type CheckoutResult = Either<DomainError, CarrinhoView>;

export async function checkoutUseCase({
  carrinhoId,
  carrinhoRepository = getCarrinhoRepository(),
  carrinhoItensRepository = getCarrinhoItensRepository(),
}: CheckoutInput): Promise<CheckoutResult> {
  try {
    if (!carrinhoId?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'carrinhoId é obrigatório'));
    }

    const carrinho = await carrinhoRepository.findById(carrinhoId);
    if (!carrinho) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }
    if (carrinho.status === 'FINALIZADO') {
      return left(domainError('CART_ALREADY_FINALIZED', 'Carrinho já finalizado'));
    }

    const itens = await carrinhoItensRepository.findByCarrinho(carrinhoId);
    if (itens.length === 0) {
      return left(domainError('EMPTY_CART', 'Carrinho vazio'));
    }

    const updated = await carrinhoRepository.updateById(
      carrinhoId,
      { status: 'FINALIZADO' },
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
        context: 'checkout',
        customMessage: 'Erro ao finalizar compra',
      }),
    );
  }
}
