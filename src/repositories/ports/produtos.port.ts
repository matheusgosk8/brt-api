import type { Pagination } from '@src/common/types/paginations';
import { Produtos } from '@src/models/produtos.models';

export type FindManyProdutosInput = {
  pagination: Pagination;
  search?: string;
};

export type FindManyProdutosOutput = {
  data: Produtos[];
  total: number;
};

export interface ProdutosRepository {
  findMany(input: FindManyProdutosInput): Promise<FindManyProdutosOutput>;
  findById(id: string): Promise<Produtos | null>;
  update(id: string, input: Partial<Produtos>): Promise<Produtos | null>;
}
