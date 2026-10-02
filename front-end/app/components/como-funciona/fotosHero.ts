/**
 * Fotos reais do hero de /como-funciona (Unsplash, licença Unsplash — uso livre, crédito abaixo).
 * Carregadas direto do CDN do Unsplash (imgix), que já recorta e redimensiona pela URL;
 * `images.unsplash.com` já está liberado em next.config.js.
 *
 * Créditos:
 *  - riso    — Ghen Mar Cuaño     https://unsplash.com/photos/R6dSBkz32B8
 *  - equipe  — Jud Mackrill       https://unsplash.com/photos/Of_m3hMsoAA
 *  - dupla   — Surface            https://unsplash.com/photos/ZlJmOUFRBfQ
 *  - ideias  — UX Indonesia       https://unsplash.com/photos/w00FkE6e8zE
 *  - rostos  — Nicolas Horn (MTZTGvDsHFY, ARBQCe2GrjQ), laura adai (enkfbbb9yf8),
 *              Bahador (pVdYTPWeu8I), abdullah ali (1w9I6H4aftw), Filipe Almeida (XHpgMMiOvuM)
 */

const U = "https://images.unsplash.com/photo-";

/** URL recortada no tamanho exato (2× para telas de alta densidade). */
export function foto(id: string, w: number, h: number, foco: "faces" | "entropy" = "faces") {
  return `${U}${id}?auto=format&fit=crop&crop=${foco}&w=${w * 2}&h=${h * 2}&q=72`;
}

export const CENAS = {
  riso: { id: "1595986630530-969786b19b4d", alt: "Mulher sorrindo enquanto olha o celular" },
  equipe: { id: "1572021335469-31706a17aaef", alt: "Quatro colegas rindo em volta de um notebook" },
  dupla: { id: "1621570277341-4fea9203f5e0", alt: "Duas pessoas conversando numa mesa de trabalho" },
  ideias: { id: "1586936893354-362ad6ae47ba", alt: "Equipe organizando ideias com post-its sobre a mesa" },
};

export const ROSTOS = {
  a: "1527980965255-d3b416303d12",
  b: "1615751596346-9df8006e5381",
  c: "1625241152315-4a698f74ceb7",
  d: "1583058905141-deef2de746bb",
  e: "1623605931891-d5b95ee98459",
  f: "1484684096794-03e03b5e713e",
};
