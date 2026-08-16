import { Produtos } from '@src/models/produtos.models';
import { DomainError, domainError } from './errors';

export const updateProductStock = ({
  produto,
  quantidadeAdquirida,
}: {
  produto: Produtos;
  quantidadeAdquirida: number;
}): Produtos | DomainError => {
  if (produto.quantidadeEstoque < quantidadeAdquirida) {
    return domainError('INSUFFICIENT_STOCK', 'Produto fora de estoque');
  }

  return {
    ...produto,
    quantidadeEstoque: produto.quantidadeEstoque - quantidadeAdquirida,
  };
};
