import type { Breakpoint } from "./util";

/**
 * Duração de cada cena em "vh de rolagem" (desktop). É a única tabela a calibrar para
 * deixar a história mais longa ou mais curta. Tablet = 85%, celular = 70%.
 *
 * ATENÇÃO: a altura da trilha em home.css (.hx-trilha) = soma + 100 (1780 / 1528 / 1276 svh).
 */
export const CENAS = ["c01", "c02", "c03", "c04", "c05", "c06", "c07", "c08", "c09", "c10"] as const;
export type Cena = (typeof CENAS)[number];

const BASE: Record<Cena, number> = {
  c01: 150,
  c02: 150,
  c03: 120,
  c04: 190,
  c05: 150,
  c06: 180,
  c07: 170,
  c08: 210,
  c09: 190,
  c10: 170,
};

export function duracoes(bp: Breakpoint) {
  const f = bp === "desktop" ? 1 : bp === "tablet" ? 0.85 : 0.7;
  const D = {} as Record<Cena, number>;
  const T = {} as Record<Cena, number>;
  let t = 0;
  for (const c of CENAS) {
    D[c] = BASE[c] * f;
    T[c] = t;
    t += D[c];
  }
  return { D, T, total: t };
}
