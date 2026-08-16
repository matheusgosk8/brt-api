import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { produtos, cupons } from '../db/schema';
import { getDb, getPool } from '../db';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type ProdutoSeed = {
  id: string;
  descricaoProduto: string;
  quantidadeEstoque: number;
  precoLiquido: number;
};

type CupomSeed = {
  id: string;
  codigoCupom: string;
  percentualDesconto: number;
};

function readJson<T>(relativePath: string): T {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw) as T;
}

async function main() {
  const db = getDb();
  const produtosSeed = readJson<ProdutoSeed[]>('data/produtos.json');
  const cuponsSeed = readJson<CupomSeed[]>('data/cupons.json');

  await db
    .insert(produtos)
    .values(
      produtosSeed.map((p) => ({
        id: p.id,
        descricaoProduto: p.descricaoProduto,
        quantidadeEstoque: p.quantidadeEstoque,
        precoLiquido: p.precoLiquido.toFixed(2),
      })),
    )
    .onConflictDoNothing({ target: produtos.id });

  await db
    .insert(cupons)
    .values(
      cuponsSeed.map((c) => ({
        id: c.id,
        codigoCupom: c.codigoCupom,
        percentualDesconto: c.percentualDesconto.toFixed(2),
      })),
    )
    .onConflictDoNothing({ target: cupons.id });

  console.log(
    `Seed OK: ${produtosSeed.length} produtos, ${cuponsSeed.length} cupons.`,
  );
  await getPool().end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await getPool().end();
  } catch {
    // ignore
  }
  process.exit(1);
});
