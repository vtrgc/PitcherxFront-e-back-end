import type { gsap } from "gsap";
import TextoCena from "../palco/TextoCena";
import { digitar, entrarTexto, textoOculto, type Ctx } from "../motion/anima";
import { telaCelular } from "../motion/util";
import { TEXTOS } from "./textos";

/** Cena 02 — O celular. A câmera entra no celular da foto 01 (o zoom é do palco). */
export default function Cena02Celular() {
  return <TextoCena cena="02" posicao="esquerda" {...TEXTOS.c02} />;
}

/**
 * 2–14%: a tela da foto acende (nota em HTML sobre a tela vazia da foto)
 * 6–46%: a ideia é digitada, linha por linha
 * 8–80%: a câmera entra no celular até a tela ocupar a posição do aparelho das próximas cenas
 * 28–70%: o resto da cena escurece em volta do aparelho · 50–80%: texto.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, els, geo, a, d } = c;
  const tela = el("tela-01");
  const zoom = el("zoom-01");
  const escuro = el("escuro-01");
  const bloco = c.texto("02");
  const linhas = els("nota-linha", tela);
  const tA = telaCelular(geo.poseA);

  textoOculto(g, bloco);
  g.set(tela, { autoAlpha: 0 });
  g.set(escuro, { autoAlpha: 0, "--ex": `${tA.cx}px`, "--ey": `${tA.cy}px`, "--er": `${tA.h * 0.62}px` });

  tl.to(tela, { autoAlpha: 1, duration: d("c02", 0.12), immediateRender: false }, a("c02", 0.02));
  linhas.forEach((linha, i) => digitar(tl, c, linha, a("c02", 0.06 + i * 0.1), d("c02", 0.09)));
  tl.to(
    zoom,
    { x: geo.z1max.x, y: geo.z1max.y, scale: geo.z1max.scale, duration: d("c02", 0.72), ease: "power2.inOut", immediateRender: false },
    a("c02", 0.08),
  );
  tl.to(escuro, { autoAlpha: 1, duration: d("c02", 0.42), immediateRender: false }, a("c02", 0.28));
  tl.to(el("etiqueta"), { autoAlpha: 1, duration: d("c02", 0.1), immediateRender: false }, a("c02", 0.3));
  entrarTexto(tl, bloco, a("c02", 0.5), d("c02", 0.3));
}
