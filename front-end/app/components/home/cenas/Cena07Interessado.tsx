import type { gsap } from "gsap";
import FotoCena from "../palco/FotoCena";
import TextoCena from "../palco/TextoCena";
import DemoFeed from "../demo/DemoFeed";
import { PaginaApp } from "../demo/DemoTela";
import { entrarTexto, pose, sairTexto, textoOculto, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/**
 * Cena 07 — Outra pessoa encontra. A segunda fotografia (manhã, luz fria) se abre a partir do
 * cartão; o cartão pousa na tela do celular dessa foto (o feed dele, em HTML) e a câmera recua.
 */
export default function Cena07Interessado() {
  return (
    <>
      <FotoCena
        id="02"
        tela={
          <PaginaApp hx="f2-feed" hora="08:12" nav="feed">
            <DemoFeed comComposer={false} />
          </PaginaApp>
        }
      />
      <TextoCena cena="07" posicao="direita" {...TEXTOS.c07} />
    </>
  );
}

/**
 * A publicação VIAJA até a próxima pessoa:
 * 0–16%: o cartão sai da plataforma, vai ao centro e cresce (a plataforma recua e se apaga)
 * 14–46%: o contorno do cartão vira uma janela — a segunda fotografia se abre a partir das
 *         bordas dele até ocupar a tela (câmera ainda colada no celular dele)
 * 40–66%: o cartão encolhe e POUSA na tela do celular da foto (o feed dele, em HTML)
 * 68–100%: a câmera recua e revela o lugar — cartão e foto se movem juntos (mesmo easing,
 *          mesmo intervalo: o cartão acompanha a tela exatamente) · 70–96%: texto.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d, vw, vh, palco } = c;
  const foto = palco.querySelector<HTMLElement>('[data-foto="02"]')!;
  const zoom = el("zoom-02");
  const tela = el("tela-02");
  const veu = el("veu-02");
  const cartao = el("cartao");
  const m = geo.cartaoMascara07;
  const r = 16 * m.s;
  const topo = m.y;
  const esq = m.x;
  const dir = vw - (m.x + 358 * m.s);
  const base = vh - (m.y + geo.alturaCartao * m.s);
  /** clip-path inset(topo direita base esquerda round raio). */
  const janela = (t: number, ri: number, b: number, e: number, raio: number) => `inset(${t}px ${ri}px ${b}px ${e}px round ${raio}px)`;

  const janelaInicial = janela(topo + 2, dir + 2, base + 2, esq + 2, r);
  g.set(foto, { autoAlpha: 0, zIndex: 14, clipPath: janelaInicial });
  g.set(zoom, { x: geo.z2a.x, y: geo.z2a.y, scale: geo.z2a.scale });
  g.set(tela, { autoAlpha: 1 });
  g.set(veu, { autoAlpha: 0 });
  textoOculto(g, c.texto("07"));

  sairTexto(tl, c.texto("06"), a("c07", 0), d("c07", 0.12));
  // o cartão se desloca e cresce; a plataforma recua
  tl.to(cartao, { ...pose(m), duration: d("c07", 0.16), ease: "power2.inOut", immediateRender: false }, a("c07", 0));
  tl.to(el("grade"), { autoAlpha: 0, scale: 0.94, x: -vw * 0.06, duration: d("c07", 0.2), ease: "power2.in", immediateRender: false }, a("c07", 0.02));
  tl.to(el("cartao-anel"), { autoAlpha: 0, duration: d("c07", 0.08), immediateRender: false }, a("c07", 0.1));

  // o contorno do cartão vira janela para a outra cena
  tl.set(foto, { autoAlpha: 1 }, a("c07", 0.14));
  // fromTo com o valor inicial explícito: o navegador "encurta" o inset lido do estilo
  // (esquerda = direita → 3 valores) e o GSAP casaria os números errados (o raio viraria a esquerda).
  tl.fromTo(
    foto,
    { clipPath: janelaInicial },
    { clipPath: janela(0, 0, 0, 0, 0), duration: d("c07", 0.32), ease: "power3.inOut", immediateRender: false },
    a("c07", 0.14),
  );
  tl.to(el("cartao-sombra"), { autoAlpha: 1, duration: d("c07", 0.1), immediateRender: false }, a("c07", 0.14));

  // o cartão pousa no celular dele
  tl.to(cartao, { ...pose(geo.cartaoDock07(geo.z2a)), duration: d("c07", 0.26), ease: "power2.inOut", immediateRender: false }, a("c07", 0.4));
  tl.to(el("cartao-sombra"), { autoAlpha: 0, duration: d("c07", 0.12), immediateRender: false }, a("c07", 0.52));

  // a câmera recua
  const recuo = { duration: d("c07", 0.32), ease: "power2.inOut", immediateRender: false };
  tl.to(zoom, { x: geo.z2b.x, y: geo.z2b.y, scale: geo.z2b.scale, ...recuo }, a("c07", 0.68));
  tl.to(cartao, { ...pose(geo.cartaoDock07(geo.z2b)), ...recuo }, a("c07", 0.68));
  tl.to(veu, { autoAlpha: 1, duration: d("c07", 0.2), immediateRender: false }, a("c07", 0.72));
  entrarTexto(tl, c.texto("07"), a("c07", 0.72), d("c07", 0.24));
}
