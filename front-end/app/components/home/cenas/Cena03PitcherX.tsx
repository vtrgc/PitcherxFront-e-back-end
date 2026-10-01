import type { gsap } from "gsap";
import TextoCena from "../palco/TextoCena";
import { entrarTexto, pose, sairTexto, textoOculto, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/** Cena 03 — Entrando no PitcherX. A foto dá lugar ao celular em HTML, que abre o app. */
export default function Cena03PitcherX() {
  return <TextoCena cena="03" posicao="esquerda" {...TEXTOS.c03} />;
}

/**
 * 0%: o celular HTML assume, no MESMO lugar, a tela da foto (troca imperceptível)
 * 2–28%: a fotografia se dissolve no grafite
 * 22–46%: a nota se recolhe num ponto de luz roxo · 40–58%: o ponto vira o logo
 * 60–76%: o app abre no feed · 62–92%: texto.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d, palco } = c;
  const foto = palco.querySelector<HTMLElement>('[data-foto="01"]')!;
  const escuro = el("escuro-01");
  const cel = el("cel-a");
  const nota = el("nota", cel);
  const conteudo = el("nota-conteudo", nota);
  const ponto = el("ponto", nota);
  const logo = el("a-logo", cel);
  const logoImg = logo.querySelector("img")!;
  const feed = el("a-feed", cel);
  const paginas = [logo, feed, el("a-projetos", cel), el("a-projeto", cel)];

  // estado inicial do celular da criadora (usado até a cena 09)
  g.set(cel, { ...pose(geo.poseA), autoAlpha: 0 });
  g.set(nota, { autoAlpha: 1 });
  g.set(paginas, { autoAlpha: 0, xPercent: 0 });
  g.set(ponto, { autoAlpha: 0, scale: 0.2 });
  textoOculto(g, c.texto("03"));

  tl.set(cel, { autoAlpha: 1 }, a("c03", 0));
  sairTexto(tl, c.texto("02"), a("c03", 0), d("c03", 0.2));
  tl.to(foto, { autoAlpha: 0, duration: d("c03", 0.26), immediateRender: false }, a("c03", 0.02));
  tl.to(escuro, { autoAlpha: 0, duration: d("c03", 0.2), immediateRender: false }, a("c03", 0.1));

  tl.to(conteudo, { scale: 0.2, autoAlpha: 0, transformOrigin: "50% 60%", duration: d("c03", 0.2), ease: "power2.in", immediateRender: false }, a("c03", 0.22));
  tl.to(ponto, { autoAlpha: 1, scale: 1.6, duration: d("c03", 0.12), ease: "power2.out", immediateRender: false }, a("c03", 0.32));
  tl.set(logo, { autoAlpha: 1 }, a("c03", 0.4));
  tl.fromTo(logoImg, { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: d("c03", 0.16), ease: "back.out(1.6)", immediateRender: false }, a("c03", 0.4));
  tl.to(ponto, { autoAlpha: 0, duration: d("c03", 0.06), immediateRender: false }, a("c03", 0.44));
  tl.set(nota, { autoAlpha: 0 }, a("c03", 0.5));

  tl.set(feed, { autoAlpha: 1, zIndex: 3 }, a("c03", 0.6));
  tl.fromTo(feed, { yPercent: 12, opacity: 0 }, { yPercent: 0, opacity: 1, duration: d("c03", 0.16), ease: "power3.out", immediateRender: false }, a("c03", 0.6));
  tl.set(logo, { autoAlpha: 0 }, a("c03", 0.77));
  tl.set(feed, { zIndex: "auto" }, a("c03", 0.78));
  entrarTexto(tl, c.texto("03"), a("c03", 0.62), d("c03", 0.3));
}
