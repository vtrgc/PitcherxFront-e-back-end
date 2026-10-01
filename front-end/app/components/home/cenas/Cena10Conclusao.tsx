import type { gsap } from "gsap";
import Image from "next/image";
import FotoCena from "../palco/FotoCena";
import TextoCena from "../palco/TextoCena";
import { entrarTexto, pose, sairTexto, textoOculto, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/**
 * Cena 10 — A ideia encontra quem acredita nela. Sem interface: os aparelhos voltam para dentro
 * da última fotografia (a mesa das duas pessoas). O logo assina, discreto.
 */
export default function Cena10Conclusao() {
  return (
    <>
      <FotoCena id="04" />
      <span data-hx="ponto-roxo" className="hx-ponto-roxo" aria-hidden="true" />
      <TextoCena cena="10" posicao="centro" titulo={TEXTOS.c10.titulo}>
        <div data-hx="assinatura" className="hx-assinatura">
          <Image src="/home/logo-mark.png" alt="" width={475} height={584} sizes="44px" className="hx-assinatura-logo" />
          <p className="hx-apoio hx-apoio--centro">{TEXTOS.c10.apoio}</p>
        </div>
      </TextoCena>
    </>
  );
}

/**
 * Conexão → zoom out → as duas pessoas:
 * 0–17%: o texto da conexão sai; a fotografia final surge POR TRÁS dos aparelhos, tão aproximada
 *        que o notebook dela coincide com o notebook que está na tela
 * 17–60%: a câmera recua (zoom out): o notebook HTML acompanha o notebook da foto e se funde a
 *         ele; o celular da criadora volta para o celular sobre a mesa — as duas interfaces eram
 *         duas pessoas, à mesma mesa (xícara de chá de um lado, café do outro)
 * 50–76%: a história respira — "Uma ideia. Alguém que acredita nela." · 76–92%: o logo assina.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d, palco } = c;
  const foto = palco.querySelector<HTMLElement>('[data-foto="04"]')!;
  const zoom = el("zoom-04");
  const bloco = c.texto("10");
  const assinatura = el("assinatura", bloco);
  const aparelho = geo.temLaptop ? el("lap") : el("cel-b");

  g.set(foto, { autoAlpha: 0, zIndex: 16 });
  g.set(zoom, { x: geo.z4a.x, y: geo.z4a.y, scale: geo.z4a.scale });
  g.set(el("veu-04"), { autoAlpha: 0 });
  g.set(el("ponto-roxo"), { autoAlpha: 0 });
  textoOculto(g, bloco);

  sairTexto(tl, c.texto("09"), a("c10", 0), d("c10", 0.12));
  tl.to(el("etiqueta"), { autoAlpha: 0, duration: d("c10", 0.08), immediateRender: false }, a("c10", 0.02));
  tl.to(el("linha"), { autoAlpha: 0, duration: d("c10", 0.1), immediateRender: false }, a("c10", 0.1));

  // a foto final aparece atrás dos aparelhos, bem de perto; os aparelhos passam para a frente dela
  tl.set([el("cel-a"), aparelho], { zIndex: 30 }, a("c10", 0.02));
  tl.to(foto, { autoAlpha: 1, duration: d("c10", 0.12), immediateRender: false }, a("c10", 0.02));
  tl.to([el("luz09-quente"), el("luz09-fria")], { autoAlpha: 0, duration: d("c10", 0.12), immediateRender: false }, a("c10", 0.06));
  tl.to(aparelho, { ...pose(geo.aparelhoNaFoto04(geo.z4a)), duration: d("c10", 0.15), ease: "power2.inOut", immediateRender: false }, a("c10", 0.02));

  // zoom out: foto e notebook se movem juntos (mesmo easing, mesmo intervalo)
  const recuo = { duration: d("c10", 0.43), ease: "power2.inOut", immediateRender: false };
  tl.to(zoom, { x: 0, y: 0, scale: 1, ...recuo }, a("c10", 0.17));
  tl.to(aparelho, { ...pose(geo.aparelhoNaFoto04({ x: 0, y: 0, scale: 1 })), ...recuo }, a("c10", 0.17));
  tl.to(aparelho, { autoAlpha: 0, duration: d("c10", 0.22), ease: "power1.in", immediateRender: false }, a("c10", 0.3));
  // o celular dela volta para a mesa
  tl.to(el("cel-a"), { ...pose(geo.celularNaFoto04), duration: d("c10", 0.33), ease: "power2.inOut", immediateRender: false }, a("c10", 0.17));
  tl.to(el("cel-a"), { autoAlpha: 0, duration: d("c10", 0.18), ease: "power1.in", immediateRender: false }, a("c10", 0.34));

  entrarTexto(tl, bloco, a("c10", 0.52), d("c10", 0.24));
  tl.to(el("veu-04"), { autoAlpha: 1, duration: d("c10", 0.24), immediateRender: false }, a("c10", 0.48));
  tl.to(assinatura, { autoAlpha: 1, y: 0, duration: d("c10", 0.14), ease: "power2.out", immediateRender: false }, a("c10", 0.76));
}
