import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { domainError, type DomainError } from '@src/domain/errors';
import { buildCarrinhoView } from '@src/domain/carrinho';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import type { CarrinhoItensRepository } from '@src/repositories/ports/carrinho-itens.port';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import { getCarrinhoItensRepository } from '@src/repositories/carrinho-itens.repository';

export type RemoveCarrinhoItemResult = Either<DomainError, CarrinhoView>;

type RemoveCarrinhoItemInput = {
  carrinhoId: string;
  produtoId: string;
  carrinhoRepository?: CarrinhoRepository;
  carrinhoItensRepository?: CarrinhoItensRepository;
};

/**
 * DELETE /carrinhos/:id/itens/:produtoId
 * Remove completamente a linha do produto.
 */
export async function removeCarrinhoItemUseCase({
  carrinhoId,
  produtoId,
  carrinhoRepository = getCarrinhoRepository(),
  carrinhoItensRepository = getCarrinhoItensRepository(),
}: RemoveCarrinhoItemInput): Promise<RemoveCarrinhoItemResult> {
  try {
    if (!carrinhoId?.trim() || !produtoId?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'carrinhoId e produtoId são obrigatórios'));
    }

    const carrinho = await carrinhoRepository.findById(carrinhoId);
    if (!carrinho) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }
    if (carrinho.status !== 'ABERTO') {
      return left(domainError('CART_CLOSED', 'Carrinho finalizado não aceita remoção de itens'));
    }

    const item = await carrinhoItensRepository.findByCarrinhoAndProduto(carrinhoId, produtoId);
    if (!item) {
      return left(domainError('ITEM_NOT_FOUND', 'Item não encontrado no carrinho'));
    }

    const removed = await carrinhoItensRepository.remove(item.id);
    if (!removed) {
      return left(domainError('INTERNAL', 'Não foi possível remover o item do carrinho'));
    }

    const atualizado = await carrinhoRepository.findById(carrinhoId);
    if (!atualizado) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }

    return right(buildCarrinhoView(atualizado));
  } catch (error) {
    return left(
      pgErrorToDomainError(error, {
        context: 'item carrinho',
      }),
    );
  }
}
