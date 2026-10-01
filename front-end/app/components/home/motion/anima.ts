/**
 * Blocos reutilizáveis de animação (sempre dentro da timeline-mestra, sempre reversíveis).
 * Convenção: todo tween usa `immediateRender: false`; estados iniciais são aplicados com
 * gsap.set ANTES de a timeline ser montada.
 */
import type { gsap } from "gsap";
import { escreverTexto, type Breakpoint, type Pose } from "./util";
import type { Cena } from "./duracoes";
import type { Enquadramento } from "./util";

type TL = gsap.core.Timeline;
type G = typeof gsap;

export type Geo = Record<string, unknown>;

export type Ctx = {
  gsap: G;
  bp: Breakpoint;
  vw: number;
  vh: number;
  header: number;
  palco: HTMLElement;
  D: Record<Cena, number>;
  T: Record<Cena, number>;
  /** Tempo absoluto: fração `f` (0..1) da cena `c`. */
  a: (c: Cena, f: number) => number;
  /** Duração correspondente a uma fração da cena. */
  d: (c: Cena, f: number) => number;
  el: <T extends HTMLElement = HTMLElement>(nome: string, raiz?: ParentNode) => T;
  els: <T extends HTMLElement = HTMLElement>(nome: string, raiz?: ParentNode) => T[];
  texto: (n: string) => HTMLElement;
  /** Textos "digitados" alterados pelo motor (restaurados na limpeza). */
  digitados: Set<HTMLElement>;
  geo: GeoCompleta;
};

export type Zoom = { x: number; y: number; scale: number };

export type GeoCompleta = {
  f1: Enquadramento;
  f2: Enquadramento;
  f3: Enquadramento;
  f4: Enquadramento;
  z1b: Zoom;
  z1max: Zoom;
  z2a: Zoom;
  z2b: Zoom;
  z2c: Zoom;
  z3: Zoom;
  z3a: Zoom;
  z4a: Zoom;
  cartaoMascara07: Pose;
  /** Pose do aparelho do interessado (notebook, ou celular no mobile) presa ao notebook da foto 04. */
  aparelhoNaFoto04: (z: Zoom) => Pose;
  /** Pose final do celular da criadora, sobre o celular da foto 04. */
  celularNaFoto04: Pose;
  poseA: Pose;
  poseA09: Pose;
  poseAFora09: Pose;
  poseB08: Pose;
  poseB09: Pose;
  poseL08: Pose;
  poseL09: Pose;
  centro: { x: number; y: number };
  cartaoA05: Pose;
  cartaoGrande06: Pose;
  cartao06: Pose;
  cartaoDock07: (z: Zoom) => Pose;
  cartaoB: (p: Pose, rolagem: number) => Pose;
  cartaoA09: Pose;
  rolA05: number;
  rolA09: number;
  rolAEquipe: number;
  rolB08: number;
  rolBEquipe: number;
  rolLDescricao: number;
  rolBDescricao: number;
  rolLEquipe: number;
  alturaCartao: number;
  linha: { d: string; a: { x: number; y: number }; b: { x: number; y: number } };
  temLaptop: boolean;
};

// ------------------------------------------------------------------ textos
function partes(bloco: HTMLElement) {
  return {
    palavras: Array.from(bloco.querySelectorAll<HTMLElement>('[data-hx="palavra"]')),
    rotulo: bloco.querySelector<HTMLElement>('[data-hx="rotulo"]'),
    apoio: bloco.querySelector<HTMLElement>('[data-hx="apoio"]'),
    extra: bloco.querySelector<HTMLElement>('[data-hx="assinatura"]'),
  };
}

/** Estado inicial de um bloco de texto (fora da tela, palavras abaixo da máscara). */
export function textoOculto(g: G, bloco: HTMLElement) {
  const { palavras, rotulo, apoio, extra } = partes(bloco);
  g.set(bloco, { autoAlpha: 0 });
  g.set(palavras, { yPercent: 115 });
  if (rotulo) g.set(rotulo, { autoAlpha: 0, x: -18 });
  if (apoio) g.set(apoio, { autoAlpha: 0, y: 18 });
  if (extra) g.set(extra, { autoAlpha: 0, y: 18 });
}

/** Palavras sobem de dentro da máscara, uma a uma; rótulo desliza; apoio sobe. */
export function entrarTexto(tl: TL, bloco: HTMLElement, t: number, d: number) {
  const { palavras, rotulo, apoio } = partes(bloco);
  tl.set(bloco, { autoAlpha: 1 }, t);
  if (rotulo) tl.to(rotulo, { autoAlpha: 1, x: 0, duration: d * 0.5, ease: "power2.out", immediateRender: false }, t);
  tl.to(
    palavras,
    { yPercent: 0, duration: d * 0.6, ease: "power3.out", stagger: palavras.length > 1 ? (d * 0.4) / (palavras.length - 1) : 0, immediateRender: false },
    t + d * 0.05,
  );
  if (apoio) tl.to(apoio, { autoAlpha: 1, y: 0, duration: d * 0.45, ease: "power2.out", immediateRender: false }, t + d * 0.45);
}

/** Saída para cima (nunca só fade): palavras sobem para fora da máscara. */
export function sairTexto(tl: TL, bloco: HTMLElement, t: number, d: number) {
  const { palavras, rotulo, apoio, extra } = partes(bloco);
  tl.to(palavras, { yPercent: -115, duration: d * 0.6, ease: "power2.in", stagger: palavras.length > 1 ? (d * 0.3) / (palavras.length - 1) : 0, immediateRender: false }, t);
  if (rotulo) tl.to(rotulo, { autoAlpha: 0, x: 12, duration: d * 0.4, ease: "power2.in", immediateRender: false }, t);
  if (apoio) tl.to(apoio, { autoAlpha: 0, y: -14, duration: d * 0.4, ease: "power2.in", immediateRender: false }, t);
  if (extra) tl.to(extra, { autoAlpha: 0, y: -14, duration: d * 0.4, ease: "power2.in", immediateRender: false }, t);
  tl.set(bloco, { autoAlpha: 0 }, t + d);
}

// ------------------------------------------------------------------ digitação
/**
 * "Digita" o texto de data-digitar conforme o scroll. O texto completo fica no DOM (e é
 * restaurado na limpeza); só escrevemos quando o número de caracteres muda.
 */
export function digitar(
  tl: TL,
  ctx: Ctx,
  el: HTMLElement,
  t: number,
  d: number,
  opts: { placeholder?: HTMLElement | null; contador?: HTMLElement | null; porPalavra?: boolean } = {},
) {
  const completo = el.dataset.digitar ?? el.textContent ?? "";
  ctx.digitados.add(el);
  escreverTexto(el, "");
  const unidades = opts.porPalavra ? completo.split(/(\s+)/) : Array.from(completo);
  const estado = { n: 0 };
  let ultimo = -1;
  const escrever = () => {
    const n = Math.round(estado.n);
    if (n === ultimo) return;
    ultimo = n;
    const texto = unidades.slice(0, n).join("");
    escreverTexto(el, texto);
    if (opts.contador) escreverTexto(opts.contador, String(texto.length));
  };
  if (opts.contador) escreverTexto(opts.contador, "0");
  if (opts.placeholder) {
    ctx.gsap.set(opts.placeholder, { autoAlpha: 1 });
    tl.set(opts.placeholder, { autoAlpha: 0 }, t);
  }
  tl.to(estado, { n: unidades.length, duration: d, ease: "none", onUpdate: escrever, onReverseComplete: escrever, immediateRender: false }, t);
  return {
    /** Apaga o texto de uma vez (ex.: composer limpo após publicar). */
    limpar(tempo: number) {
      tl.to(estado, { n: 0, duration: 0.001, onUpdate: escrever, onReverseComplete: escrever, immediateRender: false }, tempo);
      if (opts.placeholder) tl.set(opts.placeholder, { autoAlpha: 1 }, tempo);
    },
  };
}

// ------------------------------------------------------------------ navegação entre páginas
/** Página nova entra da direita; a antiga recua (como a navegação do app). */
export function trocarPagina(tl: TL, de: HTMLElement, para: HTMLElement, t: number, d: number, volta = false) {
  tl.set(para, { autoAlpha: 1, zIndex: 3 }, t);
  tl.set(de, { zIndex: 2 }, t);
  tl.fromTo(para, { xPercent: volta ? -30 : 100 }, { xPercent: 0, duration: d, ease: "power3.inOut", immediateRender: false }, t);
  tl.fromTo(de, { xPercent: 0 }, { xPercent: volta ? 100 : -30, duration: d, ease: "power3.inOut", immediateRender: false }, t);
  tl.set(de, { autoAlpha: 0 }, t + d);
}

/** "Toque" num botão: leve compressão e volta. */
export function tocar(tl: TL, el: HTMLElement, t: number, d: number) {
  tl.to(el, { scale: 0.94, duration: d * 0.4, ease: "power2.out", immediateRender: false }, t);
  tl.to(el, { scale: 1, duration: d * 0.6, ease: "power2.out", immediateRender: false }, t + d * 0.4);
}

/** Pose → propriedades GSAP. */
export const pose = (p: Pose) => ({ x: p.x, y: p.y, scale: p.s });
