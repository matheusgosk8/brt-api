import { cupons, Db, getDb } from '@src/db';
import { CuponsRepository } from './ports/cupons.port';
import { mapCupom } from './mappers/cupons.mapper';
import { eq } from 'drizzle-orm';

export function createCuponsRepository(db: Db = getDb()): CuponsRepository {
  return {
    async findById(id: string) {
      try {
        const [row] = await db.select().from(cupons).where(eq(cupons.id, id)).limit(1);
        return row ? mapCupom(row) : null;
      } catch (error) {
        logger.error('Pg error on findById cupon', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async findByCodigo(codigo: string) {
      try {
        const [row] = await db.select().from(cupons).where(eq(cupons.codigoCupom, codigo)).limit(1);
        return row ? mapCupom(row) : null;
      } catch (error) {
        logger.error('Pg error on findByCodigo cupon', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  };
}

let cuponsRepository: CuponsRepository | null = null;

export function getCuponsRepository(): CuponsRepository {
  if (!cuponsRepository) {
    cuponsRepository = createCuponsRepository(getDb());
  }
  return cuponsRepository;
}
