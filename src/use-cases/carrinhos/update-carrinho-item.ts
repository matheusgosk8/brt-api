import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import { validateStock, buildCarrinhoView } from '@src/domain/carrinho';
import { domainError, type DomainError } from '@src/domain/errors';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import { getCarrinhoItensRepository } from '@src/repositories/carrinho-itens.repository';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import type { CarrinhoItensRepository } from '@src/repositories/ports/carrinho-itens.port';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import type { ProdutosRepository } from '@src/repositories/ports/produtos.port';
import { getProdutosRepository } from '@src/repositories/produtos.repository';

export type UpdateCarrinhoItemResult = Either<DomainError, CarrinhoView>;

type UpdateCarrinhoItemInput = {
  carrinhoId: string;
  produtoId: string;
  quantidade: number;
  carrinhoRepository?: CarrinhoRepository;
  carrinhoItensRepository?: CarrinhoItensRepository;
  produtosRepository?: ProdutosRepository;
};

export async function updateCarrinhoItemUseCase({
  carrinhoId,
  produtoId,
  quantidade,
  carrinhoRepository = getCarrinhoRepository(),
  carrinhoItensRepository = getCarrinhoItensRepository(),
  produtosRepository = getProdutosRepository(),
}: UpdateCarrinhoItemInput): Promise<UpdateCarrinhoItemResult> {
  try {
    if (!carrinhoId?.trim() || !produtoId?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'carrinhoId e produtoId são obrigatórios'));
    }

    if (!Number.isFinite(quantidade) || !Number.isInteger(quantidade) || quantidade < 0) {
      return left(domainError('INVALID_QUANTITY', 'Quantidade deve ser um inteiro maior ou igual a zero'));
    }

    const carrinho = await carrinhoRepository.findById(carrinhoId);
    if (!carrinho) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }
    if (carrinho.status !== 'ABERTO') {
      return left(domainError('CART_CLOSED', 'Carrinho finalizado não aceita alterações'));
    }

    const item = await carrinhoItensRepository.findByCarrinhoAndProduto(carrinhoId, produtoId);
    if (!item) {
      return left(domainError('ITEM_NOT_FOUND', 'Item não encontrado no carrinho'));
    }

    if (quantidade === 0) {
      const removed = await carrinhoItensRepository.remove(item.id);
      if (!removed) {
        return left(domainError('INTERNAL', 'Não foi possível remover o item do carrinho'));
      }
    } else {
      const produto = await produtosRepository.findById(produtoId);
      if (!produto) {
        return left(domainError('PRODUCT_NOT_FOUND', 'Produto não encontrado'));
      }

      const stockError = validateStock(quantidade, produto.quantidadeEstoque);
      if (stockError) return left(stockError);

      const updated = await carrinhoItensRepository.updateQuantidade(item.id, quantidade);
      if (!updated) {
        return left(domainError('INTERNAL', 'Não foi possível atualizar a quantidade do item'));
      }
    }

    const carrinhoAtualizado = await carrinhoRepository.findById(carrinhoId);
    if (!carrinhoAtualizado) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }

    return right(buildCarrinhoView(carrinhoAtualizado));
  } catch (error) {
    return left(
      pgErrorToDomainError(error, {
        context: 'item carrinho',
      }),
    );
  }
}
