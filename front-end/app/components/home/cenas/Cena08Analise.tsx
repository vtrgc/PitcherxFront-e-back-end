import type { gsap } from "gsap";
import FotoCena from "../palco/FotoCena";
import TextoCena from "../palco/TextoCena";
import { TelaNotebook } from "../demo/DemoNotebook";
import { digitar, entrarTexto, pose, sairTexto, textoOculto, tocar, trocarPagina, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/**
 * Cena 08 — O interessado analisa: página do projeto, curtida, perfil de quem criou e o
 * comentário. No desktop a câmera entra no notebook da foto 03; no celular, tudo acontece
 * no celular dele.
 */
export default function Cena08Analise() {
  return (
    <>
      <FotoCena id="03" tela={<TelaNotebook prefixo="f3" />} />
      <TextoCena cena="08" posicao="esquerda" {...TEXTOS.c08} />
    </>
  );
}

/** Curtir o projeto (réplica do botão da capa de /projetos/[id]). */
function curtir(tl: gsap.core.Timeline, c: Ctx, raiz: HTMLElement, prefixo: string, t: number) {
  const { el, d } = c;
  tocar(tl, el(`${prefixo}-curtir`, raiz), t, d("c08", 0.04));
  tl.fromTo(
    el(`${prefixo}-coracao`, raiz),
    { autoAlpha: 0, scale: 0.3 },
    { autoAlpha: 1, scale: 1, duration: d("c08", 0.05), ease: "back.out(2.2)", immediateRender: false },
    t + d("c08", 0.01),
  );
  tl.to(el(`${prefixo}-curtidas-0`, raiz), { autoAlpha: 0, duration: d("c08", 0.01), immediateRender: false }, t + d("c08", 0.02));
  tl.to(el(`${prefixo}-curtidas-1`, raiz), { autoAlpha: 1, duration: d("c08", 0.01), immediateRender: false }, t + d("c08", 0.02));
}

/**
 * Desktop/tablet: a câmera entra no celular da foto 02 e o celular vira HTML (canto
 * esquerdo, com a publicação); a foto 03 se abre por trás — o notebook dele, com a página do
 * projeto na tela (HTML sobre a tela vazia da foto).
 *   32–45% "Ele lê" (a página rola até a descrição) · 46–55% "Curte" (curtir projeto)
 *   56–72% perfil de quem criou · 74–100% "Pergunta" (comentário digitado e enviado no celular)
 * Celular: tudo acontece no celular dele (página do projeto, perfil como folha, comentário).
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d, palco, vw } = c;
  const foto2 = palco.querySelector<HTMLElement>('[data-foto="02"]')!;
  const zoom2 = el("zoom-02");
  const foto3 = palco.querySelector<HTMLElement>('[data-foto="03"]')!;
  const cartao = el("cartao");
  const celB = el("cel-b");
  const bFeed = el("b-feed", celB);
  const bRol = el("b-feed-rolagem", celB);
  const bProj = el("b-projeto", celB);
  const bProjRol = el("b-projeto-rolagem", celB);
  const folha = el("b-folha", celB);
  const bCom = el("b-comentarios", celB);
  const item = el("b-com-item", celB);
  const bloco = c.texto("08");
  const palavras = Array.from(bloco.querySelectorAll<HTMLElement>('[data-hx="palavra"]'));

  // ---- estados iniciais (celular dele, notebook da foto, textos)
  g.set(celB, { ...pose(geo.poseB08), autoAlpha: 0 });
  g.set(bFeed, { autoAlpha: 1, xPercent: 0 });
  g.set([bProj], { autoAlpha: 0, xPercent: 0 });
  g.set([bRol, bProjRol], { y: 0 });
  g.set(folha, { yPercent: 100 });
  g.set(bCom, { height: 0, autoAlpha: 0 });
  g.set([item, el("b-com-item-resposta", celB)], { height: 0, autoAlpha: 0 });
  g.set(foto3, { autoAlpha: 0, zIndex: 15, x: vw });
  g.set(el("zoom-03"), { x: geo.z3a.x, y: geo.z3a.y, scale: geo.z3a.scale });
  g.set(el("tela-03"), { autoAlpha: 1 });
  g.set(el("veu-03"), { autoAlpha: 0 });
  g.set(el("f3-pag-perfil"), { autoAlpha: 0, xPercent: 0 });
  g.set(el("f3-pag-projeto-rolagem"), { y: 0 });
  g.set(el("f3-novo-membro"), { height: 0, autoAlpha: 0 });
  g.set(el("f3-coracao"), { autoAlpha: 0 });
  g.set(el("b-coracao", celB), { autoAlpha: 0 });
  textoOculto(g, bloco);

  // ---- 0–15%: a câmera entra no celular da foto 02; o cartão acompanha a tela
  sairTexto(tl, c.texto("07"), a("c08", 0), d("c08", 0.1));
  const entrada = { duration: d("c08", 0.15), ease: "power2.inOut", immediateRender: false };
  tl.to(zoom2, { x: geo.z2c.x, y: geo.z2c.y, scale: geo.z2c.scale, ...entrada }, a("c08", 0));
  tl.to(cartao, { ...pose(geo.cartaoDock07(geo.z2c)), ...entrada }, a("c08", 0));
  tl.to(el("veu-02"), { autoAlpha: 0, duration: d("c08", 0.08), immediateRender: false }, a("c08", 0.02));
  // troca foto → celular HTML, no mesmo lugar
  tl.set(celB, { autoAlpha: 1 }, a("c08", 0.15));
  if (geo.temLaptop) {
    // a câmera faz uma panorâmica: a mesa dele sai pela esquerda, o notebook entra pela direita
    // (as duas fotos andam juntas, como um filme contínuo — sem vão entre elas)
    tl.to(foto2, { x: -vw, duration: d("c08", 0.17), ease: "power3.inOut", immediateRender: false }, a("c08", 0.15));
    tl.set(foto2, { autoAlpha: 0 }, a("c08", 0.32));
  } else {
    tl.to(foto2, { autoAlpha: 0, duration: d("c08", 0.1), immediateRender: false }, a("c08", 0.16));
  }

  // palavras do título começam apagadas e acendem com cada ação
  const grupos = [palavras.slice(0, 2), palavras.slice(2, 3), palavras.slice(3)];
  g.set(palavras, { opacity: 0.28 });
  entrarTexto(tl, bloco, a("c08", 0.18), d("c08", 0.14));

  if (geo.temLaptop) {
    // ---- a foto 03 (o notebook dele) se abre por trás
    tl.set(foto3, { autoAlpha: 1 }, a("c08", 0.15));
    tl.to(foto3, { x: 0, duration: d("c08", 0.17), ease: "power3.inOut", immediateRender: false }, a("c08", 0.15));
    tl.to(el("veu-03"), { autoAlpha: 1, duration: d("c08", 0.12), immediateRender: false }, a("c08", 0.22));
    // o projeto cresce: a câmera se aproxima do notebook
    const zoom3 = el("zoom-03");
    tl.to(zoom3, { x: geo.z3.x, y: geo.z3.y, scale: geo.z3.scale, duration: d("c08", 0.12), ease: "power2.inOut", immediateRender: false }, a("c08", 0.3));

    tl.to(grupos[0], { opacity: 1, duration: d("c08", 0.04), immediateRender: false }, a("c08", 0.42));
    tl.to(el("f3-pag-projeto-rolagem"), { y: geo.rolLDescricao, duration: d("c08", 0.08), ease: "power2.inOut", immediateRender: false }, a("c08", 0.43));

    tl.to(el("f3-pag-projeto-rolagem"), { y: 0, duration: d("c08", 0.05), ease: "power2.inOut", immediateRender: false }, a("c08", 0.52));
    tl.to(grupos[1], { opacity: 1, duration: d("c08", 0.04), immediateRender: false }, a("c08", 0.54));
    curtir(tl, c, foto3, "f3", a("c08", 0.57));

    trocarPagina(tl, el("f3-pag-projeto"), el("f3-pag-perfil"), a("c08", 0.62), d("c08", 0.06));
    trocarPagina(tl, el("f3-pag-perfil"), el("f3-pag-projeto"), a("c08", 0.71), d("c08", 0.05), true);
  } else {
    // ---- celular: página do projeto, curtir, perfil (folha que sobe)
    tl.to(grupos[0], { opacity: 1, duration: d("c08", 0.04), immediateRender: false }, a("c08", 0.32));
    trocarPagina(tl, bFeed, bProj, a("c08", 0.3), d("c08", 0.06));
    tl.to(cartao, { x: `-=${390 * 0.3 * geo.poseB08.s}`, autoAlpha: 0, duration: d("c08", 0.06), ease: "power3.inOut", immediateRender: false }, a("c08", 0.3));
    tl.to(bProjRol, { y: geo.rolBDescricao, duration: d("c08", 0.08), ease: "power2.inOut", immediateRender: false }, a("c08", 0.37));
    tl.to(bProjRol, { y: 0, duration: d("c08", 0.05), ease: "power2.inOut", immediateRender: false }, a("c08", 0.46));
    tl.to(grupos[1], { opacity: 1, duration: d("c08", 0.04), immediateRender: false }, a("c08", 0.48));
    curtir(tl, c, celB, "b", a("c08", 0.51));
    tl.to(folha, { yPercent: 0, duration: d("c08", 0.06), ease: "power3.out", immediateRender: false }, a("c08", 0.57));
    tl.to(folha, { yPercent: 100, duration: d("c08", 0.05), ease: "power3.in", immediateRender: false }, a("c08", 0.67));
    trocarPagina(tl, bProj, bFeed, a("c08", 0.72), d("c08", 0.05), true);
    tl.to(cartao, { x: `+=${390 * 0.3 * geo.poseB08.s}`, autoAlpha: 1, duration: d("c08", 0.05), ease: "power3.inOut", immediateRender: false }, a("c08", 0.72));
  }

  // ---- 74–100%: "Pergunta" — comentário no celular dele, sob a publicação
  tl.to(grupos[2], { opacity: 1, duration: d("c08", 0.04), immediateRender: false }, a("c08", 0.76));
  const rolagem = { duration: d("c08", 0.06), ease: "power2.inOut", immediateRender: false };
  tl.to(bCom, { height: "auto", autoAlpha: 1, ...rolagem }, a("c08", 0.77));
  tl.to(bRol, { y: geo.rolB08, ...rolagem }, a("c08", 0.77));
  tl.to(cartao, { ...pose(geo.cartaoB(geo.poseB08, geo.rolB08)), ...rolagem }, a("c08", 0.77));
  const comentario = digitar(tl, c, el("b-com-digitando", celB), a("c08", 0.83), d("c08", 0.09), {
    placeholder: el("b-com-ph", celB),
    porPalavra: true,
  });
  tocar(tl, el("b-com-btn", celB), a("c08", 0.92), d("c08", 0.03));
  comentario.limpar(a("c08", 0.95));
  tl.to(item, { height: "auto", autoAlpha: 1, duration: d("c08", 0.04), ease: "power2.out", immediateRender: false }, a("c08", 0.95));
  tl.to(el("n-comentarios", cartao), { autoAlpha: 1, duration: d("c08", 0.02), immediateRender: false }, a("c08", 0.96));
}
