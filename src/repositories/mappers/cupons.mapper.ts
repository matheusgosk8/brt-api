import { Cupom as CupomRow } from '@src/db';
import { Cupom } from '@src/models/cupons.models';

export const mapCupom = (row: CupomRow): Cupom => {
  return {
    id: row.id,
    codigoCupom: row.codigoCupom,
    percentualDesconto: row.percentualDesconto,
  };
};
