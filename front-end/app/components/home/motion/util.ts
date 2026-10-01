/**
 * Utilitários do motor: geometria (grid, enquadramento "cover", poses de aparelhos),
 * seleção de elementos e medidas. Nada aqui roda por quadro: tudo é calculado ao montar
 * a timeline (e de novo em resize).
 */
import { FOTOS, varianteAtual, type Foto, type Retangulo } from "../fotos";
import { MOLDURA_CELULAR, TELA_CELULAR } from "../palco/Celular";
import { MOLDURA_LAPTOP, TELA_LAPTOP } from "../palco/Laptop";

export type Breakpoint = "desktop" | "tablet" | "celular";
export type Pose = { x: number; y: number; s: number };

export const CEL = { w: TELA_CELULAR.w + MOLDURA_CELULAR * 2, h: TELA_CELULAR.h + MOLDURA_CELULAR * 2, borda: MOLDURA_CELULAR };
export const LAP = { w: TELA_LAPTOP.w + MOLDURA_LAPTOP * 2, h: TELA_LAPTOP.h + MOLDURA_LAPTOP * 2, borda: MOLDURA_LAPTOP };

export function breakpoint(vw: number): Breakpoint {
  if (vw >= 1024) return "desktop";
  if (vw >= 768) return "tablet";
  return "celular";
}

// ------------------------------------------------------------------ seleção
export function hx<T extends HTMLElement = HTMLElement>(raiz: ParentNode, nome: string): T {
  const el = raiz.querySelector<T>(`[data-hx="${nome}"]`);
  if (!el) throw new Error(`[home] elemento data-hx="${nome}" não encontrado`);
  return el;
}
export function hxTodos<T extends HTMLElement = HTMLElement>(raiz: ParentNode, nome: string): T[] {
  return Array.from(raiz.querySelectorAll<T>(`[data-hx="${nome}"]`));
}

/** Posição de layout de `el` no documento, ignorando transforms (soma de offsetLeft/Top). */
function offsetAbsoluto(el: HTMLElement) {
  let x = 0;
  let y = 0;
  let atual: HTMLElement | null = el;
  while (atual) {
    x += atual.offsetLeft;
    y += atual.offsetTop;
    atual = atual.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Posição de `el` dentro de `ancestral`, ignorando transforms (vale mesmo se `ancestral` não for posicionado). */
export function offsetRel(el: HTMLElement, ancestral: HTMLElement) {
  const a = offsetAbsoluto(el);
  const b = offsetAbsoluto(ancestral);
  return { x: a.x - b.x, y: a.y - b.y };
}

// ------------------------------------------------------------------ grid
export function grid(vw: number) {
  const m = Math.min(80, Math.max(20, vw * 0.05));
  const larg = Math.min(vw, 1440);
  const esquerda = (vw - larg) / 2 + m;
  const C = larg - 2 * m;
  const g = 24;
  const c = (C - 11 * g) / 12;
  const col = (i: number) => esquerda + (i - 1) * (c + g);
  const faixa = (i: number, j: number) => ({ x0: col(i), x1: col(j) + c });
  return { m, c, g, col, faixa, esquerda, C };
}

// ------------------------------------------------------------------ fotos
export type Enquadramento = {
  left: number;
  top: number;
  W: number;
  H: number;
  tela: Retangulo | null;
  alvos: { laptop: Retangulo; celular: Retangulo } | null;
};

/** Mesmo cálculo de object-fit: cover + object-position (foco) que o CSS faz antes do JS. */
export function enquadrar(foto: Foto, vw: number, vh: number): Enquadramento {
  const v = varianteAtual(foto, vw, vh);
  const ar = v.w / v.h;
  const W = Math.max(vw, vh * ar);
  const H = W / ar;
  const left = (vw - W) * v.foco[0];
  const top = (vh - H) * v.foco[1];
  const px = (r: Retangulo) => ({ x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H });
  const tela = v.tela ? px(v.tela) : null;
  const alvos = v.alvos ? { laptop: px(v.alvos.laptop), celular: px(v.alvos.celular) } : null;
  return { left, top, W, H, tela, alvos };
}

/**
 * Zoom de câmera (transform-origin 0 0 no .hx-zoom) que leva a tela da foto ao retângulo `alvo`
 * da viewport. Devolve { x, y, scale } para o .hx-zoom.
 */
export function zoomParaAlvo(e: Enquadramento, alvo: { cx: number; cy: number; h: number }) {
  if (!e.tela) return { x: 0, y: 0, scale: 1 };
  const s = alvo.h / e.tela.h;
  const cxq = e.tela.x + e.tela.w / 2;
  const cyq = e.tela.y + e.tela.h / 2;
  return { x: alvo.cx - e.left - s * cxq, y: alvo.cy - e.top - s * cyq, scale: s };
}

/**
 * Ajusta um zoom (mesma escala) para que a foto continue cobrindo a viewport inteira —
 * a câmera nunca mostra a borda da fotografia.
 */
export function cobrir(e: Enquadramento, z: { x: number; y: number; scale: number }, vw: number, vh: number) {
  const s = Math.max(z.scale, vw / e.W, vh / e.H);
  const x = clamp(z.x, vw - e.left - s * e.W, -e.left);
  const y = clamp(z.y, vh - e.top - s * e.H, -e.top);
  return { x, y, scale: s };
}

/** Zoom "de câmera" simples ao redor de um ponto do quadro (0..1). */
export function zoomNoPonto(e: Enquadramento, px: number, py: number, s: number) {
  // mantém o ponto (px,py) do quadro parado na viewport
  const qx = px * e.W;
  const qy = py * e.H;
  return { x: qx - s * qx, y: qy - s * qy, scale: s };
}

/** Onde um ponto do quadro (em px do quadro) aparece na viewport, dado o zoom. */
export function pontoNaViewport(e: Enquadramento, z: { x: number; y: number; scale: number }, qx: number, qy: number) {
  return { x: e.left + z.x + z.scale * qx, y: e.top + z.y + z.scale * qy };
}

export function fotoGeo(id: Foto["id"], vw: number, vh: number) {
  return enquadrar(FOTOS[id], vw, vh);
}

// ------------------------------------------------------------------ aparelhos
/** Pose de um celular cuja TELA fica centrada em (cx, cy) com altura h. */
export function poseCelularPorTela(cx: number, cy: number, hTela: number): Pose {
  const s = hTela / TELA_CELULAR.h;
  return { x: cx - (CEL.w * s) / 2, y: cy - (CEL.h * s) / 2, s };
}
/** Retângulo da tela (viewport) de um celular numa pose. */
export function telaCelular(p: Pose) {
  const w = TELA_CELULAR.w * p.s;
  const h = TELA_CELULAR.h * p.s;
  const x = p.x + CEL.borda * p.s;
  const y = p.y + CEL.borda * p.s;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
export function poseLaptopPorTela(cx: number, cy: number, wTela: number): Pose {
  const s = wTela / TELA_LAPTOP.w;
  return { x: cx - (LAP.w * s) / 2, y: cy - (LAP.h * s) / 2, s };
}
export function telaLaptop(p: Pose) {
  const w = TELA_LAPTOP.w * p.s;
  const h = TELA_LAPTOP.h * p.s;
  const x = p.x + LAP.borda * p.s;
  const y = p.y + LAP.borda * p.s;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

/** Pose do cartão (base em px virtuais) quando está num ponto (px virtuais) da tela de um aparelho. */
export function poseNoAparelho(aparelho: Pose, borda: number, ponto: { x: number; y: number }): Pose {
  return { x: aparelho.x + (borda + ponto.x) * aparelho.s, y: aparelho.y + (borda + ponto.y) * aparelho.s, s: aparelho.s };
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Troca o texto de um elemento mudando o nó de texto que já existe (characterData), sem
 * remover/inserir nós. Trocar `textContent` substitui o nó — e, com as regras
 * `html:has(.hx-home)`, isso faz o Chrome recalcular o estilo do documento inteiro.
 */
export function escreverTexto(el: HTMLElement, s: string) {
  const no = el.firstChild;
  if (no && no === el.lastChild && no.nodeType === 3) {
    const t = no as Text;
    if (t.data !== s) t.data = s;
  } else {
    el.textContent = s; // só na primeira vez, se o elemento não tinha um único nó de texto
  }
}
