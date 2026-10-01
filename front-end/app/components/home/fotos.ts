/**
 * Fotografias da página inicial (public/home/v2/). Cada uma tem versão paisagem (16:9) e
 * retrato (9:16) e, quando há um aparelho, o retângulo EXATO da tela no quadro
 * (0..1, medido na cena 3D que gerou a imagem). A interface HTML é posicionada ali.
 *
 * Para trocar por novas fotos: substitua os arquivos mantendo os nomes e atualize
 * `tela` (x, y, largura e altura da tela do aparelho em fração da imagem) e `foco`.
 */

export type Retangulo = { x: number; y: number; w: number; h: number };

export type VarianteFoto = {
  /** Caminho sem sufixo de largura/extensão. Arquivos: `${base}-${largura}.avif|webp`. */
  base: string;
  larguras: number[];
  w: number;
  h: number;
  /** Ponto que deve permanecer visível quando a imagem é recortada (object-position). */
  foco: [number, number];
  tela?: Retangulo;
  /** Aparelhos na foto final (04): para onde celular e notebook "voltam" no zoom out da cena 10. */
  alvos?: { laptop: Retangulo; celular: Retangulo };
};

export type Foto = {
  id: "01" | "02" | "03" | "04";
  alt: string;
  paisagem: VarianteFoto;
  retrato: VarianteFoto;
};

const P = [1280, 1920, 2400];
const R = [720, 1080];

export const FOTOS: Record<Foto["id"], Foto> = {
  "01": {
    id: "01",
    alt: "Mesa de cozinha à noite, iluminada por uma luminária quente: um caderno aberto com o esboço de hortas num telhado, um lápis, uma xícara de chá e um celular em pé, com a tela apagada.",
    paisagem: { base: "/home/v2/01-criadora-mesa-16x9", larguras: P, w: 2400, h: 1350, foco: [0.62, 0.5], tela: { x: 0.59275, y: 0.35650, w: 0.09449, h: 0.35811 } },
    retrato: { base: "/home/v2/01-criadora-mesa-9x16", larguras: R, w: 1080, h: 1920, foco: [0.5, 0.6], tela: { x: 0.41328, y: 0.55602, w: 0.17343, h: 0.20796 } },
  },
  "02": {
    id: "02",
    alt: "Mesa clara junto a uma janela, de manhã, em luz fria: uma xícara de café, um notebook fechado, um vaso com planta e um celular em pé.",
    paisagem: { base: "/home/v2/02-interessado-manha-16x9", larguras: P, w: 2400, h: 1350, foco: [0.38, 0.5], tela: { x: 0.31275, y: 0.35650, w: 0.09449, h: 0.35811 } },
    retrato: { base: "/home/v2/02-interessado-manha-9x16", larguras: R, w: 1080, h: 1920, foco: [0.5, 0.6], tela: { x: 0.41328, y: 0.55602, w: 0.17343, h: 0.20796 } },
  },
  "03": {
    id: "03",
    alt: "O mesmo canto de manhã: um notebook aberto de frente, com a tela apagada, ao lado de um café e de um celular deitado.",
    paisagem: { base: "/home/v2/03-laptop-mesa-16x9", larguras: P, w: 2400, h: 1350, foco: [0.5, 0.5], tela: { x: 0.33934, y: 0.31977, w: 0.32131, h: 0.34470 } },
    retrato: { base: "/home/v2/03-laptop-mesa-9x16", larguras: R, w: 1080, h: 1920, foco: [0.5, 0.55], tela: { x: 0.27881, y: 0.54149, w: 0.44238, h: 0.15016 } },
  },
  "04": {
    id: "04",
    alt: "Fim de tarde, luz quente e fria na mesma mesa: o caderno com o esboço das hortas no centro, um notebook, um celular, uma xícara de chá e outra de café, uma de cada lado.",
    paisagem: {
      base: "/home/v2/04-encontro-mesa-16x9",
      larguras: P,
      w: 2400,
      h: 1350,
      foco: [0.5, 0.55],
      alvos: { laptop: { x: 0.65623, y: 0.01054, w: 0.23578, h: 0.26362 }, celular: { x: 0.16452, y: 0.40356, w: 0.12618, h: 0.12662 } },
    },
    retrato: {
      base: "/home/v2/04-encontro-mesa-9x16",
      larguras: R,
      w: 1080,
      h: 1920,
      foco: [0.5, 0.55],
      alvos: { laptop: { x: 0.75791, y: 0.20353, w: 0.40282, h: 0.14313 }, celular: { x: -0.04328, y: 0.43354, w: 0.20275, h: 0.08391 } },
    },
  },
};

/** Paisagem ou retrato, pelo mesmo critério usado no CSS (<picture media>). */
export function varianteAtual(foto: Foto, vw: number, vh: number) {
  return vw / vh <= 1 ? foto.retrato : foto.paisagem;
}

export const MEDIA_RETRATO = "(max-aspect-ratio: 1/1)";
