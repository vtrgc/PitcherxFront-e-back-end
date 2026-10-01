/**
 * Imagens da página /como-funciona — renderizações 3D feitas para esta página (Blender/Cycles),
 * sem pessoas e sem texto. Arquivos em public/como-funciona (AVIF + WebP em várias larguras).
 */
export type Variante = { base: string; w: number; h: number; larguras: number[] };
export type Imagem = { alt: string; principal: Variante; retrato?: Variante };

const P = "/como-funciona";

export const IMAGENS = {
  telhado: {
    alt: "Horta em canteiros de madeira no telhado de um prédio, ao amanhecer, com a cidade ao fundo.",
    principal: { base: `${P}/telhado-16x9`, w: 2400, h: 1350, larguras: [1280, 1920, 2400] },
    retrato: { base: `${P}/telhado-9x16`, w: 1080, h: 1920, larguras: [720, 1080] },
  },
  caderno: {
    alt: "Caderno aberto sobre a mesa com a planta dos canteiros desenhada a lápis, ao lado de uma muda, uma trena e uma xícara.",
    principal: { base: `${P}/caderno-4x5`, w: 1600, h: 2000, larguras: [640, 960, 1280] },
  },
  conversa: {
    alt: "Mesa redonda junto à janela, com duas cadeiras, duas xícaras e um notebook fechado.",
    principal: { base: `${P}/conversa-3x4`, w: 1500, h: 2000, larguras: [600, 900, 1200] },
  },
} satisfies Record<string, Imagem>;

/** Mesma regra da página inicial: telas em pé usam a variante vertical. */
export const MEDIA_RETRATO = "(max-aspect-ratio: 1/1)";
