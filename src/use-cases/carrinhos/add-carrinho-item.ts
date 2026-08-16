import type { Either } from '@src/common/types/result';
import { left, right } from '@src/common/types/result';
import { domainError, type DomainError } from '@src/domain/errors';
import { validateQuantity, validateStock, buildCarrinhoView } from '@src/domain/carrinho';
import { pgErrorToDomainError } from '@src/common/utils/pg-error';
import type { CarrinhoView } from '@src/models/carrinho-detalhe.models';
import type { CarrinhoRepository } from '@src/repositories/ports/carrinho.port';
import type { CarrinhoItensRepository } from '@src/repositories/ports/carrinho-itens.port';
import type { ProdutosRepository } from '@src/repositories/ports/produtos.port';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import { getCarrinhoItensRepository } from '@src/repositories/carrinho-itens.repository';
import { getProdutosRepository } from '@src/repositories/produtos.repository';

export type AddCarrinhoItemResult = Either<DomainError, CarrinhoView>;

type AddCarrinhoItemInput = {
  carrinhoId: string;
  produtoId: string;
  quantidade: number;
  carrinhoRepository?: CarrinhoRepository;
  carrinhoItensRepository?: CarrinhoItensRepository;
  produtosRepository?: ProdutosRepository;
};

export async function addCarrinhoItemUseCase({
  carrinhoId,
  produtoId,
  quantidade,
  carrinhoRepository = getCarrinhoRepository(),
  carrinhoItensRepository = getCarrinhoItensRepository(),
  produtosRepository = getProdutosRepository(),
}: AddCarrinhoItemInput): Promise<AddCarrinhoItemResult> {
  try {
    const qtyError = validateQuantity(quantidade);
    if (qtyError) return left(qtyError);

    if (!carrinhoId?.trim() || !produtoId?.trim()) {
      return left(domainError('VALIDATION_ERROR', 'carrinhoId e produtoId são obrigatórios'));
    }

    const carrinho = await carrinhoRepository.findById(carrinhoId);
    if (!carrinho) {
      return left(domainError('CART_NOT_FOUND', 'Carrinho não encontrado'));
    }
    if (carrinho.status !== 'ABERTO') {
      return left(domainError('CART_CLOSED', 'Carrinho finalizado não aceita novos itens'));
    }

    const produto = await produtosRepository.findById(produtoId);
    if (!produto) {
      return left(domainError('PRODUCT_NOT_FOUND', 'Produto não encontrado'));
    }

    const existente = await carrinhoItensRepository.findByCarrinhoAndProduto(carrinhoId, produtoId);

    const quantidadeFinal = (existente?.quantidade ?? 0) + quantidade;

    const stockError = validateStock(quantidadeFinal, produto.quantidadeEstoque);
    if (stockError) return left(stockError);

    const item = existente
      ? await carrinhoItensRepository.updateQuantidade(existente.id, quantidadeFinal)
      : await carrinhoItensRepository.create({
          carrinhoId,
          produtoId,
          quantidade: quantidadeFinal,
        });

    if (!item) {
      return left(domainError('INTERNAL', 'Não foi possível adicionar o item ao carrinho'));
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
