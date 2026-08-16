import type { CarrinhoItens, CreateCarrinhoItensInput } from '@src/models/carrinho-itens.models';

export interface CarrinhoItensRepository {
  findById(id: string): Promise<CarrinhoItens | null>;
  findByCarrinhoAndProduto(carrinhoId: string, produtoId: string): Promise<CarrinhoItens | null>;
  create(input: CreateCarrinhoItensInput): Promise<CarrinhoItens | null>;
  /** Substitui a quantidade (soma é decidida no use case). */
  updateQuantidade(id: string, quantidade: number): Promise<CarrinhoItens | null>;
  remove(id: string): Promise<boolean>;
  findByCarrinho(carrinhoId: string): Promise<CarrinhoItens[]>;
}
