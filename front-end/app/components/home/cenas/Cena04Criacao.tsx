import type { gsap } from "gsap";
import TextoCena from "../palco/TextoCena";
import { digitar, entrarTexto, sairTexto, textoOculto, tocar, trocarPagina, type Ctx } from "../motion/anima";
import { offsetRel } from "../motion/util";
import { TEXTOS } from "./textos";

/** Cena 04 — Criando o projeto (formulário real de /projetos, preenchido pelo scroll). */
export default function Cena04Criacao() {
  return <TextoCena cena="04" posicao="esquerda" {...TEXTOS.c04} />;
}

/**
 * 4–14%: do feed para Projetos · 12–22%: "Novo projeto" abre o formulário
 * 22–30% nome · 30–48% descrição · 48–56% datas · 56–70% tipo (lista abre e escolhe)
 * 72–78% "Publicar projeto" · 80–90% página do projeto · 90–98% a criadora aparece na equipe como Criador.
 * Somente campos que existem no sistema; nenhuma requisição é feita.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, els, a, d } = c;
  const cel = el("cel-a");
  const feed = el("a-feed", cel);
  const pag = el("a-projetos", cel);
  const rol = el("a-projetos-rolagem", cel);
  const form = el("form-projeto", cel);
  const projeto = el("a-projeto", cel);
  const rolProjeto = el("a-projeto-rolagem", cel);
  const lista = el("tipo-lista", cel);
  const opcao = el("tipo-opcao", cel);
  const datas = els("data-valor", cel);
  const chipCriador = el("papel-chip", el("a-equipe", cel));
  const alturaUtil = pag.offsetHeight - 44 - 110;
  const rolar = (alvo: HTMLElement, folga: number) => -Math.max(0, offsetRel(alvo, rol).y + alvo.offsetHeight - alturaUtil + folga);

  textoOculto(g, c.texto("04"));
  g.set(form, { autoAlpha: 0, y: 24 });
  g.set(datas, { autoAlpha: 0 });
  g.set(el("tipo-valor", cel), { autoAlpha: 0 });
  g.set(el("tipo-vazio", cel), { autoAlpha: 1 });
  g.set(lista, { autoAlpha: 0, y: -6 });
  g.set([rol, rolProjeto], { y: 0 });
  g.set([el("a-form-membro", cel), el("a-novo-membro", cel)], { height: 0, autoAlpha: 0 });

  sairTexto(tl, c.texto("03"), a("c04", 0), d("c04", 0.1));
  entrarTexto(tl, c.texto("04"), a("c04", 0.06), d("c04", 0.2));

  trocarPagina(tl, feed, pag, a("c04", 0.04), d("c04", 0.1));
  tocar(tl, el("btn-novo", cel), a("c04", 0.13), d("c04", 0.04));
  tl.to(form, { autoAlpha: 1, y: 0, duration: d("c04", 0.06), ease: "power2.out", immediateRender: false }, a("c04", 0.16));

  digitar(tl, c, el("proj-nome", cel), a("c04", 0.22), d("c04", 0.07));
  tl.to(rol, { y: rolar(el("proj-desc-campo", cel), 0), duration: d("c04", 0.06), ease: "power2.inOut", immediateRender: false }, a("c04", 0.29));
  digitar(tl, c, el("proj-desc", cel), a("c04", 0.31), d("c04", 0.16), { placeholder: el("proj-desc-ph", cel), porPalavra: true });
  tl.to(rol, { y: rolar(el("bloco-tipo", cel), 150), duration: d("c04", 0.07), ease: "power2.inOut", immediateRender: false }, a("c04", 0.47));
  tl.to(datas, { autoAlpha: 1, duration: d("c04", 0.04), stagger: d("c04", 0.03), immediateRender: false }, a("c04", 0.5));

  tl.to(lista, { autoAlpha: 1, y: 0, duration: d("c04", 0.04), ease: "power2.out", immediateRender: false }, a("c04", 0.58));
  tl.to(opcao, { backgroundColor: "#F6F2FF", color: "#5613BE", duration: d("c04", 0.03), immediateRender: false }, a("c04", 0.63));
  tl.to(el("tipo-vazio", cel), { autoAlpha: 0, duration: d("c04", 0.01), immediateRender: false }, a("c04", 0.66));
  tl.to(el("tipo-valor", cel), { autoAlpha: 1, duration: d("c04", 0.01), immediateRender: false }, a("c04", 0.66));
  tl.to(lista, { autoAlpha: 0, y: -6, duration: d("c04", 0.03), immediateRender: false }, a("c04", 0.67));

  tl.to(rol, { y: rolar(el("btn-criar", cel), 24), duration: d("c04", 0.05), ease: "power2.inOut", immediateRender: false }, a("c04", 0.7));
  tocar(tl, el("btn-criar", cel), a("c04", 0.75), d("c04", 0.04));

  trocarPagina(tl, pag, projeto, a("c04", 0.8), d("c04", 0.1));
  tl.to(rolProjeto, { y: -150, duration: d("c04", 0.06), ease: "power2.inOut", immediateRender: false }, a("c04", 0.88));
  tl.fromTo(chipCriador, { scale: 1 }, { scale: 1.14, duration: d("c04", 0.03), ease: "power2.out", immediateRender: false }, a("c04", 0.92));
  tl.to(chipCriador, { scale: 1, duration: d("c04", 0.03), ease: "power2.in", immediateRender: false }, a("c04", 0.95));
}
