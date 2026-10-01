/**
 * Timeline-mestra da página inicial.
 *
 *   scroll (nativo, suavizado por Lenis) → ScrollTrigger (scrub) → timeline-mestra
 *   → cada cena (cenas/CenaXX.tsx exporta `timeline(tl, ctx)`) escreve direto nos estilos.
 *
 * A duração da timeline é medida em "vh de rolagem" (motion/duracoes.ts). Toda a geometria
 * (enquadramento das fotos, poses de aparelhos e do cartão) é calculada aqui, uma vez, e de
 * novo em resize — nunca por quadro. Em resize/orientação a timeline é reconstruída e o
 * progresso é preservado.
 */
import { gsap, ScrollTrigger, criarLenis, registrar, restaurarConfig } from "./setup";
import { CENAS, duracoes, type Cena } from "./duracoes";
import {
  CEL,
  breakpoint,
  clamp,
  fotoGeo,
  grid,
  cobrir,
  escreverTexto,
  hx,
  hxTodos,
  offsetRel,
  pontoNaViewport,
  poseCelularPorTela,
  poseLaptopPorTela,
  poseNoAparelho,
  telaCelular,
  telaLaptop,
  zoomNoPonto,
  zoomParaAlvo,
  type Pose,
} from "./util";
import type { Ctx, GeoCompleta, Zoom } from "./anima";
import { ROTULOS_CENAS } from "../cenas/textos";
import { EVENTO_PULAR } from "../constantes";
import { TELA_CELULAR } from "../palco/Celular";
import { TELA_LAPTOP } from "../palco/Laptop";
import * as c01 from "../cenas/Cena01Ideia";
import * as c02 from "../cenas/Cena02Celular";
import * as c03 from "../cenas/Cena03PitcherX";
import * as c04 from "../cenas/Cena04Criacao";
import * as c05 from "../cenas/Cena05Publicacao";
import * as c06 from "../cenas/Cena06Descoberta";
import * as c07 from "../cenas/Cena07Interessado";
import * as c08 from "../cenas/Cena08Analise";
import * as c09 from "../cenas/Cena09Conexao";
import * as c10 from "../cenas/Cena10Conclusao";

const CONSTRUTORES: Record<Cena, { timeline: (tl: gsap.core.Timeline, c: Ctx) => void }> = {
  c01,
  c02,
  c03,
  c04,
  c05,
  c06,
  c07,
  c08,
  c09,
  c10,
};

/** Carrega a imagem de uma foto adiada (data-src → src). */
function carregarFoto(palco: HTMLElement, id: string) {
  const foto = palco.querySelector<HTMLElement>(`[data-foto="${id}"]`);
  if (!foto || foto.dataset.carregada) return;
  foto.dataset.carregada = "1";
  foto.querySelectorAll<HTMLElement>("[data-srcset]").forEach((s) => {
    s.setAttribute("srcset", s.dataset.srcset!);
    s.removeAttribute("data-srcset");
  });
  foto.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((img) => {
    img.src = img.dataset.src!;
    img.removeAttribute("data-src");
    img.loading = "eager";
  });
}

// ------------------------------------------------------------------ geometria
function calcularGeo(c: Omit<Ctx, "geo">): GeoCompleta {
  const { vw, vh, bp, header, el } = c;
  const g = grid(vw);
  const f1 = fotoGeo("01", vw, vh);
  const f2 = fotoGeo("02", vw, vh);
  const f3 = fotoGeo("03", vw, vh);
  const f4 = fotoGeo("04", vw, vh);

  // ---- celular principal (criadora)
  let cxA: number, cyA: number, hDevA: number;
  if (bp === "desktop") {
    const f = g.faixa(7, 11);
    hDevA = Math.min(vh * 0.76, ((f.x1 - f.x0) * CEL.h) / CEL.w, 900);
    cxA = (f.x0 + f.x1) / 2;
    cyA = header + (vh - header) / 2 + 6;
  } else if (bp === "tablet") {
    hDevA = Math.min(vh * 0.56, (vw * 0.62 * CEL.h) / CEL.w);
    cxA = vw / 2;
    cyA = vh - 28 - hDevA / 2;
  } else {
    hDevA = Math.min(vh * 0.58, (vw * 0.84 * CEL.h) / CEL.w);
    cxA = vw / 2;
    cyA = vh - Math.max(18, vh * 0.03) - hDevA / 2;
  }
  const hTelaA = (hDevA * TELA_CELULAR.h) / CEL.h;
  const poseA = poseCelularPorTela(cxA, cyA, hTelaA);
  const tA = telaCelular(poseA);
  const z1max = zoomParaAlvo(f1, { cx: tA.cx, cy: tA.cy, h: tA.h });
  const t1 = f1.tela!;
  const z1b = zoomNoPonto(f1, (t1.x + t1.w / 2) / f1.W, (t1.y + t1.h / 2) / f1.H, 1.3);

  // ---- slots do cartão (medidos sem transform)
  const celA = el("cel-a");
  const pagAFeed = el("a-feed", celA);
  const rolAFeed = el("a-feed-rolagem", celA);
  const slotA = el("slot-cartao", pagAFeed);
  const baseRolA = offsetRel(rolAFeed, pagAFeed).y;
  const offSlotA = offsetRel(slotA, rolAFeed);
  const alturaCartao = slotA.offsetHeight;
  const rolA05 = -clamp(offSlotA.y - 96, 0, 2000);
  const rolA09 = -clamp(offSlotA.y - 40, 0, 2000);
  const pontoA = (rol: number) => ({ x: offSlotA.x, y: baseRolA + offSlotA.y + rol });
  const cartaoA05 = poseNoAparelho(poseA, CEL.borda, pontoA(rolA05));

  const pagAProj = el("a-projeto", celA);
  const rolAProj = el("a-projeto-rolagem", celA);
  const equipeA = el("a-equipe", pagAProj);
  const rolAEquipe = -clamp(offsetRel(equipeA, rolAProj).y - 24, 0, 3000);

  // ---- cena 06: cartão grande e cartão na "plataforma"
  const sGrande = Math.min((vh * 0.62) / alturaCartao, (vw * (bp === "celular" ? 0.86 : 0.42)) / 358, 1.7);
  const cartaoGrande06 = { x: vw / 2 - (358 * sGrande) / 2, y: vh / 2 - (alturaCartao * sGrande) / 2 + header / 3, s: sGrande };
  let cx6: number, cy6: number, s6: number;
  if (bp === "desktop") {
    const f = g.faixa(6, 12);
    const larg = f.x1 - f.x0;
    s6 = Math.min((larg * 0.44) / 358, ((vh - header) * 0.62) / alturaCartao, 1.15);
    cx6 = (f.x0 + f.x1) / 2;
    cy6 = header + 24 + (vh - header - 24) * 0.56;
  } else {
    const topo = vh * (bp === "tablet" ? 0.38 : 0.4);
    s6 = Math.min(((vw - 2 * g.m) * (bp === "tablet" ? 0.5 : 0.8)) / 358, ((vh - topo) * 0.62) / alturaCartao, 1.1);
    cx6 = vw / 2;
    cy6 = topo + (vh - topo) * 0.52;
  }
  const cartao06 = { x: cx6 - (358 * s6) / 2, y: cy6 - (alturaCartao * s6) / 2, s: s6 };

  // ---- cena 07: o cartão pousa na tela do celular da foto 02
  const celB = el("cel-b");
  const tela2 = el("tela-02-virtual");
  const pag2 = el("f2-feed", tela2);
  const rol2 = el("f2-feed-rolagem", tela2);
  const slot2 = el("slot-cartao", pag2);
  const off2 = offsetRel(slot2, rol2);
  const base2 = offsetRel(rol2, pag2).y;
  const tela2q = f2.tela!;
  const k2 = tela2q.w / TELA_CELULAR.w;
  const slot2q = { x: tela2q.x + k2 * off2.x, y: tela2q.y + k2 * (base2 + off2.y) };
  const cartaoDock07 = (z: Zoom): Pose => {
    const p = pontoNaViewport(f2, z, slot2q.x, slot2q.y);
    return { x: p.x, y: p.y, s: z.scale * k2 };
  };
  // cena 07: o cartão vai ao centro e cresce; a nova foto se abre a partir do contorno dele
  const sMasc = Math.min(s6 * 1.28, (vh * 0.6) / alturaCartao, (vw * (bp === "celular" ? 0.88 : 0.5)) / 358);
  const cxM = vw / 2;
  const cyM = vh / 2 + header / 4;
  const cartaoMascara07 = { x: cxM - (358 * sMasc) / 2, y: cyM - (alturaCartao * sMasc) / 2, s: sMasc };
  // zoom em que o cartão pousado tem 72% desse tamanho, no mesmo centro
  const sDock = (sMasc * 0.72) / k2;
  const centroSlotQ = { x: slot2q.x + k2 * 179, y: slot2q.y + (k2 * alturaCartao) / 2 };
  const z2a: Zoom = { scale: sDock, x: cxM - f2.left - sDock * centroSlotQ.x, y: cyM - f2.top - sDock * centroSlotQ.y };
  const t2 = f2.tela!;
  const z2b = zoomNoPonto(f2, (t2.x + t2.w / 2) / f2.W, (t2.y + t2.h / 2) / f2.H, bp === "celular" ? 1.12 : 1.06);

  // ---- cena 08: celular dele (HTML) e notebook
  const temLaptop = bp !== "celular";
  let poseB08: Pose;
  let poseL08: Pose = { x: 0, y: 0, s: 1 };
  let z3: Zoom = { x: 0, y: 0, scale: 1 };
  if (bp === "desktop") {
    const fB = g.faixa(1, 4);
    const hDevB = Math.min(vh * 0.5, ((fB.x1 - fB.x0) * CEL.h) / CEL.w);
    poseB08 = poseCelularPorTela((fB.x0 + fB.x1) / 2 + g.c * 0.4, vh - 30 - hDevB / 2, (hDevB * TELA_CELULAR.h) / CEL.h);
    const fL = g.faixa(6, 12);
    const wTelaL = Math.min(fL.x1 - fL.x0, ((vh - header) * 0.8 * TELA_LAPTOP.w) / TELA_LAPTOP.h);
    poseL08 = poseLaptopPorTela((fL.x0 + fL.x1) / 2, header + (vh - header) * 0.5, wTelaL);
  } else if (bp === "tablet") {
    const hDevB = Math.min(vh * 0.34, vw * 0.3 * (CEL.h / CEL.w));
    poseB08 = poseCelularPorTela(g.m + (hDevB * CEL.w) / CEL.h / 2 + 8, vh - 24 - hDevB / 2, (hDevB * TELA_CELULAR.h) / CEL.h);
    const wTelaL = Math.min(vw * 0.8, ((vh * 0.5) * TELA_LAPTOP.w) / TELA_LAPTOP.h);
    poseL08 = poseLaptopPorTela(vw / 2 + vw * 0.06, vh * 0.62, wTelaL);
  } else {
    poseB08 = poseA;
  }
  let z3a: Zoom = z3;
  if (temLaptop) {
    const tL = telaLaptop(poseL08);
    z3 = zoomParaAlvo(f3, { cx: tL.cx, cy: tL.cy, h: tL.h });
    // antes de "crescer", o notebook aparece menor, no mesmo ponto da tela
    const t3 = f3.tela!;
    const q3 = { x: t3.x + t3.w / 2, y: t3.y + t3.h / 2 };
    const P3 = { x: f3.left + z3.x + z3.scale * q3.x, y: f3.top + z3.y + z3.scale * q3.y };
    const s3a = z3.scale * 0.7;
    z3a = cobrir(f3, { scale: s3a, x: P3.x - f3.left - s3a * q3.x, y: P3.y - f3.top - s3a * q3.y }, vw, vh);
  }
  const tB08 = telaCelular(poseB08);
  const z2c = zoomParaAlvo(f2, { cx: tB08.cx, cy: tB08.cy, h: tB08.h });

  const pagBFeed = el("b-feed", celB);
  const rolBFeed = el("b-feed-rolagem", celB);
  const slotB = el("slot-cartao", pagBFeed);
  const offB = offsetRel(slotB, rolBFeed);
  const baseB = offsetRel(rolBFeed, pagBFeed).y;
  const rolB08 = -clamp(offB.y - 20, 0, 2000);
  const cartaoB = (p: Pose, rol: number) => poseNoAparelho(p, CEL.borda, { x: offB.x, y: baseB + offB.y + rol });
  const pagBProj = el("b-projeto", celB);
  const rolBProj = el("b-projeto-rolagem", celB);
  const rolBEquipe = -clamp(offsetRel(el("b-equipe", pagBProj), rolBProj).y - 24, 0, 3000);
  const rolBDescricao = -clamp(offsetRel(el("b-descricao", pagBProj), rolBProj).y - 140, 0, 2000);

  const lap = el("lap");
  const rolLProj = el("l-pag-projeto-rolagem", lap);
  const rolLDescricao = -clamp(offsetRel(el("l-descricao", lap), rolLProj).y - 120, 0, 2000);
  const rolLEquipe = -clamp(offsetRel(el("l-equipe", lap), rolLProj).y - 40, 0, 3000);

  // ---- cena 09: lado a lado (ou empilhados no celular)
  let poseA09: Pose, poseB09: Pose, poseL09: Pose;
  const caixa09 = c.texto("09").querySelector<HTMLElement>(".hx-texto-caixa")!;
  const fimTexto09 = offsetRel(caixa09, c.palco).y + caixa09.offsetHeight + 16;
  const topoTexto = Math.max(bp === "desktop" ? vh * 0.22 : vh * 0.2, fimTexto09);
  if (bp === "desktop") {
    const fA = g.faixa(1, 4);
    const hDev = Math.min((vh - topoTexto) * 0.86, ((fA.x1 - fA.x0) * CEL.h) / CEL.w);
    poseA09 = poseCelularPorTela((fA.x0 + fA.x1) / 2, topoTexto + (vh - topoTexto) / 2, (hDev * TELA_CELULAR.h) / CEL.h);
    const fL = g.faixa(6, 12);
    const wTela = Math.min(fL.x1 - fL.x0, ((vh - topoTexto) * 0.78 * TELA_LAPTOP.w) / TELA_LAPTOP.h);
    poseL09 = poseLaptopPorTela((fL.x0 + fL.x1) / 2, topoTexto + (vh - topoTexto) / 2 - 10, wTela);
    poseB09 = { ...poseB08, y: vh + 40 };
  } else if (bp === "tablet") {
    const hDev = Math.min((vh - topoTexto) * 0.7, vw * 0.36 * (CEL.h / CEL.w));
    poseA09 = poseCelularPorTela(g.m + (hDev * CEL.w) / CEL.h / 2, topoTexto + (vh - topoTexto) / 2, (hDev * TELA_CELULAR.h) / CEL.h);
    const wTela = Math.min(vw - 2 * g.m - (hDev * CEL.w) / CEL.h - 40, ((vh - topoTexto) * 0.78 * TELA_LAPTOP.w) / TELA_LAPTOP.h);
    poseL09 = poseLaptopPorTela(vw - g.m - wTela / 2 - 10, topoTexto + (vh - topoTexto) / 2, wTela);
    poseB09 = { ...poseB08, y: vh + 40 };
  } else {
    const disp = vh - topoTexto - 28;
    const hDev = Math.min(disp / 2 - 10, vw * 0.9 * (CEL.h / CEL.w));
    const hT = (hDev * TELA_CELULAR.h) / CEL.h;
    poseA09 = poseCelularPorTela(vw / 2, topoTexto + 8 + hDev / 2, hT);
    poseB09 = poseCelularPorTela(vw / 2, vh - 12 - hDev / 2, hT);
    poseL09 = poseL08;
  }
  const poseAFora09 = { ...poseA09, x: bp === "celular" ? poseA09.x : -CEL.w * poseA09.s - 40, y: bp === "celular" ? -CEL.h * poseA09.s - 40 : poseA09.y };
  const cartaoA09 = poseNoAparelho(poseA09, CEL.borda, pontoA(rolA09));

  // ---- cena 10: zoom out — os aparelhos "voltam" para dentro da foto final
  const alv = f4.alvos!;
  const lapQ = { x: alv.laptop.x + alv.laptop.w / 2, y: alv.laptop.y + alv.laptop.h / 2 };
  const aparelhoNaFoto04 = (z: Zoom): Pose => {
    const cx = f4.left + z.x + z.scale * lapQ.x;
    const cy = f4.top + z.y + z.scale * lapQ.y;
    const w = z.scale * alv.laptop.w;
    return temLaptop ? poseLaptopPorTela(cx, cy, w) : poseCelularPorTela(cx, cy, (w * TELA_CELULAR.h) / TELA_CELULAR.w);
  };
  let z4a: Zoom;
  {
    const alvoTela = temLaptop ? telaLaptop(poseL09) : telaCelular(poseB09);
    const s = alvoTela.w / alv.laptop.w;
    // sem mostrar a borda da foto: se o notebook da foto não alcança o aparelho, o aparelho vai até ele
    z4a = cobrir(f4, { scale: s, x: alvoTela.cx - f4.left - s * lapQ.x, y: alvoTela.cy - f4.top - s * lapQ.y }, vw, vh);
  }
  const celQ = { x: alv.celular.x + alv.celular.w / 2, y: alv.celular.y + alv.celular.h / 2 };
  const celularNaFoto04 = poseCelularPorTela(
    clamp(f4.left + celQ.x, 30, vw - 30),
    f4.top + celQ.y,
    Math.max(alv.celular.h * 1.4, 40),
  );

  // linha entre os aparelhos
  const tA9 = telaCelular(poseA09);
  let a: { x: number; y: number }, b: { x: number; y: number }, d: string;
  if (bp === "celular") {
    const tB9 = telaCelular(poseB09);
    a = { x: tA9.cx, y: poseA09.y + CEL.h * poseA09.s + 2 };
    b = { x: tB9.cx, y: poseB09.y - 2 };
    d = `M ${a.x} ${a.y} C ${a.x + 40} ${(a.y + b.y) / 2}, ${b.x - 40} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`;
  } else {
    const tL9 = telaLaptop(poseL09);
    a = { x: poseA09.x + CEL.w * poseA09.s + 4, y: tA9.cy };
    b = { x: poseL09.x - 4, y: tL9.cy };
    const meio = (a.x + b.x) / 2;
    d = `M ${a.x} ${a.y} C ${meio} ${a.y - 60}, ${meio} ${b.y + 60}, ${b.x} ${b.y}`;
  }

  return {
    f1,
    f2,
    f3,
    f4,
    z1b,
    z1max,
    z2a,
    z2b,
    z2c,
    z3,
    z3a,
    z4a,
    cartaoMascara07,
    aparelhoNaFoto04,
    celularNaFoto04,
    poseA,
    poseA09,
    poseAFora09,
    poseB08,
    poseB09,
    poseL08,
    poseL09,
    centro: { x: vw / 2, y: vh / 2 },
    cartaoA05,
    cartaoGrande06,
    cartao06,
    cartaoDock07,
    cartaoB,
    cartaoA09,
    rolA05,
    rolA09,
    rolAEquipe,
    rolB08,
    rolBEquipe,
    rolLDescricao,
    rolLEquipe,
    rolBDescricao,
    alturaCartao,
    linha: { d, a, b },
    temLaptop,
  };
}

/** Enquadra as fotos (mesma conta do object-fit do CSS) e escala as telas HTML das fotos. */
function aplicarFotos(c: Ctx) {
  const { geo, palco } = c;
  const mapa = { "01": geo.f1, "02": geo.f2, "03": geo.f3, "04": geo.f4 } as const;
  (Object.keys(mapa) as (keyof typeof mapa)[]).forEach((id) => {
    const e = mapa[id];
    const quadro = hx(palco, `quadro-${id}`);
    gsap.set(quadro, { left: e.left, top: e.top, width: e.W, height: e.H });
    const tela = palco.querySelector<HTMLElement>(`[data-hx="tela-${id}"]`);
    if (tela && e.tela) {
      const larguraVirtual = id === "03" ? TELA_LAPTOP.w : TELA_CELULAR.w;
      tela.style.setProperty("--k", String(e.tela.w / larguraVirtual));
    }
  });
}

// ------------------------------------------------------------------ montagem
export function montarMotor(raiz: HTMLElement, opcoes: { aoPronto?: () => void } = {}) {
  registrar();
  const palco = hx(raiz, "palco");
  const trilha = hx(raiz, "trilha");
  const header = raiz.querySelector<HTMLElement>('[data-hx="header"]');
  const barra = hx(palco, "ind-barra");
  const indNum = hx(palco, "ind-num");
  const indRotulo = hx(palco, "ind-rotulo");
  const { lenis, destruir: destruirLenis } = criarLenis();

  let contexto: gsap.Context | null = null;
  let digitados = new Set<HTMLElement>();
  let gatilho: ScrollTrigger | null = null;
  let chaveTamanho = "";
  let total = 1;
  /** Último progresso conhecido (antes de qualquer mudança de layout do resize). */
  let ultimoProgresso = 0;
  let ultimoAlemDoFim = 0;

  function limparDigitados() {
    digitados.forEach((el) => {
      if (el.dataset.digitar !== undefined) escreverTexto(el, el.dataset.digitar);
    });
    digitados = new Set();
  }

  let geracao = 0;
  /** Devolve o controle ao navegador entre as etapas (evita tarefas longas na montagem). */
  const pausa = () => new Promise<void>((r) => window.setTimeout(r, 0));

  /**
   * Monta a timeline em etapas (geometria → uma cena por vez → ScrollTrigger), cedendo o
   * processador entre elas. Enquanto monta, a tela continua exatamente no quadro inicial.
   */
  async function construir(): Promise<boolean> {
    const minha = ++geracao;
    const vw = palco.clientWidth;
    const vh = palco.clientHeight;
    const bp = breakpoint(vw);
    chaveTamanho = `${vw}x${Math.round(vh / 60)}`;
    const { D, T, total: tot } = duracoes(bp);
    total = tot;
    const alturaHeader = header?.offsetHeight ?? 72;
    const ctxG = gsap.context(() => {}, raiz);
    contexto = ctxG;
    let ctx: Ctx | null = null;
    const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });

    ctxG.add(() => {
      const base = {
        gsap,
        bp,
        vw,
        vh,
        header: alturaHeader,
        palco,
        D,
        T,
        a: (cena: Cena, f: number) => T[cena] + D[cena] * f,
        d: (cena: Cena, f: number) => D[cena] * f,
        el: <E extends HTMLElement>(nome: string, r: ParentNode = palco) => hx<E>(r, nome),
        els: <E extends HTMLElement>(nome: string, r: ParentNode = palco) => hxTodos<E>(r, nome),
        texto: (n: string) => palco.querySelector<HTMLElement>(`[data-texto="${n}"]`)!,
        digitados,
      };
      ctx = { ...base, geo: calcularGeo(base) };
      aplicarFotos(ctx);
    });

    for (const cena of CENAS) {
      await pausa();
      if (minha !== geracao || !ctx) return false;
      const c = ctx;
      ctxG.add(() => CONSTRUTORES[cena].timeline(tl, c));
    }
    await pausa();
    if (minha !== geracao) return false;

    ctxG.add(() => {
      // garante a duração exata (as cenas podem terminar antes do fim do seu trecho)
      tl.set({}, {}, total);

      // Carregamento progressivo das fotos: cada uma perto de ser usada.
      const limiares: [number, string][] = [
        [(T.c05 + D.c05 * 0.5) / total, "02"],
        [(T.c06 + D.c06 * 0.5) / total, "03"],
        [(T.c08 + D.c08 * 0.3) / total, "04"],
      ];
      let cenaAtual = -1;
      const aoAtualizar = (p: number) => {
        ultimoProgresso = p;
        ultimoAlemDoFim = gatilho ? Math.max(0, window.scrollY - gatilho.end) : 0;
        barra.style.transform = `scaleX(${p.toFixed(4)})`;
        const t = p * total;
        let idx = 0;
        for (let i = 0; i < CENAS.length; i++) if (t >= T[CENAS[i]]) idx = i;
        if (idx !== cenaAtual) {
          cenaAtual = idx;
          escreverTexto(indNum, String(idx + 1).padStart(2, "0"));
          escreverTexto(indRotulo, ROTULOS_CENAS[idx]);
        }
        for (const [lim, id] of limiares) if (p >= lim) carregarFoto(palco, id);
      };

      gatilho = ScrollTrigger.create({
        trigger: trilha,
        start: "top top",
        end: "bottom bottom",
        animation: tl,
        // mouse/trackpad: Lenis já dá o peso; no toque (sem Lenis no touch) um pouco de atraso
        scrub: window.matchMedia("(pointer: coarse)").matches ? 0.35 : true,
        invalidateOnRefresh: false,
        onUpdate: (self) => aoAtualizar(self.progress),
        onRefresh: (self) => aoAtualizar(self.progress),
      });
      aoAtualizar(gatilho.progress);
      tl.progress(gatilho.progress);

      // Header: sólido depois do início; some ao descer e volta ao subir.
      if (header) {
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const y = self.scroll();
            header.classList.toggle("hx-header--solido", y > vh * 0.05);
            header.classList.toggle("hx-header--oculto", self.direction === 1 && y > vh * 0.3);
          },
        });
      }
    });
    return true;
  }

  function desmontarTimeline() {
    geracao++;
    contexto?.revert();
    contexto = null;
    gatilho = null;
    limparDigitados();
    palco.querySelectorAll<HTMLElement>("[data-hx^='tela-']").forEach((t) => t.style.removeProperty("--k"));
  }

  // ---- montagem inicial
  const quadro01 = hx(palco, "quadro-01");
  const alvoFinal = raiz.querySelector<HTMLElement>("#comecar");
  let intro: gsap.core.Tween | null = null;
  let vivo = true;
  const introPossivel = window.scrollY < 10;
  construir().then((ok) => {
    if (!ok || !vivo) return;
    raiz.classList.add("hx-pronto");
    // link com #comecar (ou volta para ele): vai direto ao fim, sem passar pelas cenas
    if (location.hash === "#comecar" && alvoFinal) lenis.scrollTo(alvoFinal, { immediate: true, force: true });
    // intro discreta da primeira fotografia (não disputa propriedades com a timeline)
    if (introPossivel && window.scrollY < 10) {
      intro = gsap.fromTo(quadro01, { scale: 1.045 }, { scale: 1, duration: 2.2, ease: "power2.out" });
    }
    opcoes.aoPronto?.();
  });

  function aoPular(e: Event) {
    if (!alvoFinal) return;
    e.preventDefault();
    lenis.scrollTo(alvoFinal, { immediate: true, force: true });
    history.replaceState(null, "", "#comecar");
    alvoFinal.focus({ preventScroll: true });
  }
  window.addEventListener(EVENTO_PULAR, aoPular);

  // ---- resize / orientação: reconstrói preservando o progresso
  let espera = 0;
  let capturado: { p: number; alem: number } | null = null;
  function aoRedimensionar() {
    // o progresso é capturado no PRIMEIRO evento de uma sequência de resize, antes de qualquer
    // recálculo do ScrollTrigger com o layout novo
    if (!capturado) capturado = { p: ultimoProgresso, alem: ultimoAlemDoFim };
    window.clearTimeout(espera);
    espera = window.setTimeout(() => {
      const salvo = capturado ?? { p: ultimoProgresso, alem: ultimoAlemDoFim };
      capturado = null;
      const vw = palco.clientWidth;
      const vh = palco.clientHeight;
      if (`${vw}x${Math.round(vh / 60)}` === chaveTamanho) return;
      const progresso = salvo.p;
      const alemDoFim = salvo.alem;
      const depois = progresso >= 1 && alemDoFim > 0;
      desmontarTimeline();
      construir().then((ok) => {
        if (!ok || !vivo) return;
        ScrollTrigger.refresh();
        const g = gatilho as ScrollTrigger | null;
        if (g) {
          const y = depois ? g.end + alemDoFim : g.start + progresso * (g.end - g.start);
          lenis.scrollTo(y, { immediate: true, force: true });
          ScrollTrigger.update();
        }
      });
    }, 180);
  }
  window.addEventListener("resize", aoRedimensionar);
  window.addEventListener("orientationchange", aoRedimensionar);

  return () => {
    vivo = false;
    window.clearTimeout(espera);
    window.removeEventListener("resize", aoRedimensionar);
    window.removeEventListener("orientationchange", aoRedimensionar);
    window.removeEventListener(EVENTO_PULAR, aoPular);
    intro?.kill();
    gsap.set(quadro01, { clearProps: "transform" });
    desmontarTimeline();
    destruirLenis();
    restaurarConfig();
    raiz.classList.remove("hx-pronto");
    header?.classList.remove("hx-header--solido", "hx-header--oculto");
  };
}
