import { Cupom } from '@src/models/cupons.models';

export interface CuponsRepository {
  findById(id: string): Promise<Cupom | null>;
  findByCodigo(codigo: string): Promise<Cupom | null>;
}
