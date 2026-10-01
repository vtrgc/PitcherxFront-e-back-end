import type { gsap } from "gsap";
import FotoCena from "../palco/FotoCena";
import TextoCena from "../palco/TextoCena";
import DemoNota from "../demo/DemoNota";
import { sairTexto, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/**
 * Cena 01 — A ideia nasce. Fotografia em tela cheia (a mesa, à noite) e o h1 da página.
 * A tela do celular da foto recebe a nota em HTML (acesa na cena 02).
 */
export default function Cena01Ideia() {
  return (
    <>
      <FotoCena id="01" prioridade tela={<DemoNota />} />
      <TextoCena cena="01" nivel={1} posicao="esquerda" {...TEXTOS.c01} />
      <div data-hx="dica" className="hx-dica" aria-hidden="true">
        <span className="hx-dica-rato">
          <span className="hx-dica-roda" />
        </span>
        <span className="hx-dica-texto">Role para começar</span>
      </div>
    </>
  );
}

/**
 * 5–27%: a linha de apoio surge · 0–100%: a câmera avança devagar em direção ao celular
 * · 52–82%: o título sai para cima · 60–90%: o véu de legibilidade se abre.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d } = c;
  const bloco = c.texto("01");
  const apoio = bloco.querySelector<HTMLElement>('[data-hx="apoio"]')!;
  const zoom = el("zoom-01");
  const veu = el("veu-01");

  g.set(bloco, { autoAlpha: 1 });
  g.set(apoio, { autoAlpha: 0, y: 16 });
  g.set(zoom, { x: 0, y: 0, scale: 1 });
  g.set(veu, { autoAlpha: 1 });
  g.set(el("etiqueta"), { autoAlpha: 0 });
  g.set(el("dica"), { autoAlpha: 1, y: 0 });

  // a dica "role para começar" desce e some assim que o scroll começa
  tl.to(el("dica"), { autoAlpha: 0, y: 24, duration: d("c01", 0.1), ease: "power1.in", immediateRender: false }, a("c01", 0));
  tl.to(apoio, { autoAlpha: 1, y: 0, duration: d("c01", 0.22), ease: "power2.out", immediateRender: false }, a("c01", 0.05));
  tl.to(
    zoom,
    { x: geo.z1b.x, y: geo.z1b.y, scale: geo.z1b.scale, duration: d("c01", 1), ease: "power1.in", immediateRender: false },
    a("c01", 0),
  );
  sairTexto(tl, bloco, a("c01", 0.52), d("c01", 0.3));
  tl.to(veu, { autoAlpha: 0.3, duration: d("c01", 0.3), immediateRender: false }, a("c01", 0.6));
}
