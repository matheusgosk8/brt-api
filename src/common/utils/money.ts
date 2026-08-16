/**
 * Converte reais → centavos (evita float no banco).
 * Ex.: 349.9 → 34990
 */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Converte centavos → reais (borda da API / serialização).
 * Ex.: 34990 → 349.9
 */
export function fromCents(centavos: number): number {
  return centavos / 100;
}
