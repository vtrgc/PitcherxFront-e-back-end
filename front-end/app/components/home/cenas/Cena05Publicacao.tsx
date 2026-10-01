import type { gsap } from "gsap";
import TextoCena from "../palco/TextoCena";
import { digitar, entrarTexto, pose, sairTexto, textoOculto, tocar, trocarPagina, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/** Cena 05 — Publicando (composer do feed). O cartão da publicação nasce aqui. */
export default function Cena05Publicacao() {
  return <TextoCena cena="05" posicao="esquerda" {...TEXTOS.c05} />;
}

/**
 * 4–14%: volta ao feed · 14–28% título · 26–42% texto (contador de caracteres)
 * 44–54%: Publicar → Publicando... → aviso "Publicação criada." (texto real do sistema)
 * 55–66%: o composer se limpa e o feed rola · 68–80%: a publicação aparece no topo do feed —
 * é o CARTÃO-FIO, o mesmo elemento que atravessa as cenas 06–09 · 82–92%: ganha destaque.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d } = c;
  const cel = el("cel-a");
  const feed = el("a-feed", cel);
  const rolFeed = el("a-feed-rolagem", cel);
  const projeto = el("a-projeto", cel);
  const cartao = el("cartao");
  const toast = el("toast", cel);
  const publicando = el("btn-publicando", cel);

  // estado inicial do cartão-fio
  g.set(cartao, { ...pose(geo.cartaoA05), autoAlpha: 0 });
  g.set([el("cartao-sombra"), el("cartao-anel")], { autoAlpha: 0 });
  g.set(el("comentarios", cartao), { height: 0, autoAlpha: 0, overflow: "hidden" });
  g.set(el("resposta", cartao), { height: 0, autoAlpha: 0, overflow: "hidden" });
  g.set(el("n-comentarios", cartao), { autoAlpha: 0 });
  g.set(toast, { autoAlpha: 0, y: 16 });
  g.set(publicando, { autoAlpha: 0 });
  textoOculto(g, c.texto("05"));

  sairTexto(tl, c.texto("04"), a("c05", 0), d("c05", 0.12));
  entrarTexto(tl, c.texto("05"), a("c05", 0.06), d("c05", 0.22));
  trocarPagina(tl, projeto, feed, a("c05", 0.04), d("c05", 0.1), true);

  const titulo = digitar(tl, c, el("post-titulo", cel), a("c05", 0.14), d("c05", 0.13), { placeholder: el("post-titulo-ph", cel) });
  const texto = digitar(tl, c, el("post-texto", cel), a("c05", 0.26), d("c05", 0.16), {
    placeholder: el("post-texto-ph", cel),
    contador: el("post-contador", cel),
    porPalavra: true,
  });

  tocar(tl, el("btn-publicar", cel), a("c05", 0.44), d("c05", 0.04));
  tl.set(publicando, { autoAlpha: 1 }, a("c05", 0.47));
  tl.set(publicando, { autoAlpha: 0 }, a("c05", 0.55));
  tl.to(toast, { autoAlpha: 1, y: 0, duration: d("c05", 0.05), ease: "power2.out", immediateRender: false }, a("c05", 0.52));
  tl.to(toast, { autoAlpha: 0, y: 10, duration: d("c05", 0.05), immediateRender: false }, a("c05", 0.84));

  titulo.limpar(a("c05", 0.56));
  texto.limpar(a("c05", 0.56));
  tl.to(rolFeed, { y: geo.rolA05, duration: d("c05", 0.1), ease: "power2.inOut", immediateRender: false }, a("c05", 0.57));

  tl.fromTo(
    cartao,
    { autoAlpha: 0, y: geo.cartaoA05.y + 26 * geo.cartaoA05.s, scale: geo.cartaoA05.s * 0.97 },
    { autoAlpha: 1, y: geo.cartaoA05.y, scale: geo.cartaoA05.s, duration: d("c05", 0.12), ease: "power3.out", immediateRender: false },
    a("c05", 0.68),
  );
  tl.to(el("cartao-sombra"), { autoAlpha: 1, duration: d("c05", 0.1), immediateRender: false }, a("c05", 0.82));
}
