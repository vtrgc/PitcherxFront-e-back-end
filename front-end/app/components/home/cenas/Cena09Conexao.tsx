import type { gsap } from "gsap";
import TextoCena from "../palco/TextoCena";
import { digitar, entrarTexto, pose, sairTexto, textoOculto, tocar, trocarPagina, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/**
 * Cena 09 — Conexão (clímax). Luz quente de um lado, fria do outro; uma linha fina liga os
 * dois aparelhos e a equipe do projeto passa a ter Criador + Investidor (papel real de vínculo).
 */
export default function Cena09Conexao() {
  return (
    <>
      <div className="hx-luz-dupla" aria-hidden="true">
        <span data-hx="luz09-quente" className="hx-luz09 hx-luz09--quente" />
        <span data-hx="luz09-fria" className="hx-luz09 hx-luz09--fria" />
      </div>
      <svg data-hx="linha" className="hx-linha" aria-hidden="true" preserveAspectRatio="none">
        <path data-hx="linha-traco" className="hx-linha-traco" d="M0 0" />
        <circle data-hx="linha-a" className="hx-linha-no" r="4" cx="0" cy="0" />
        <circle data-hx="linha-b" className="hx-linha-no" r="4" cx="0" cy="0" />
      </svg>
      <TextoCena cena="09" posicao="topo" {...TEXTOS.c09} />
    </>
  );
}

/** Criadora adiciona Rafael à equipe: Pessoa → Tipo de vínculo "Investidor" → Adicionar à equipe. */
function adicionarMembro(tl: gsap.core.Timeline, c: Ctx, cel: HTMLElement, t: number) {
  const { el, d } = c;
  const f = (x: number) => t + d("c09", x);
  const lista = el("a-papel-lista", cel);
  tocar(tl, el("a-btn-membro", cel), f(0), d("c09", 0.03));
  tl.to(el("a-form-membro", cel), { height: "auto", autoAlpha: 1, duration: d("c09", 0.04), ease: "power2.out", immediateRender: false }, f(0.02));
  tl.to(el("a-pessoa-vazio", cel), { autoAlpha: 0, duration: d("c09", 0.01), immediateRender: false }, f(0.06));
  tl.to(el("a-pessoa-valor", cel), { autoAlpha: 1, duration: d("c09", 0.01), immediateRender: false }, f(0.06));
  tl.to(lista, { autoAlpha: 1, y: 0, duration: d("c09", 0.03), immediateRender: false }, f(0.08));
  tl.to(el("a-papel-opcao", cel), { backgroundColor: "#F6F2FF", color: "#5613BE", duration: d("c09", 0.02), immediateRender: false }, f(0.11));
  tl.to(el("a-papel-vazio", cel), { autoAlpha: 0, duration: d("c09", 0.01), immediateRender: false }, f(0.13));
  tl.to(el("a-papel-valor", cel), { autoAlpha: 1, duration: d("c09", 0.01), immediateRender: false }, f(0.13));
  tl.to(lista, { autoAlpha: 0, y: 6, duration: d("c09", 0.02), immediateRender: false }, f(0.14));
  tocar(tl, el("a-btn-adicionar", cel), f(0.16), d("c09", 0.03));
  tl.to(el("a-form-membro", cel), { height: 0, autoAlpha: 0, duration: d("c09", 0.04), ease: "power2.inOut", immediateRender: false }, f(0.2));
  tl.to(el("a-novo-membro", cel), { height: "auto", autoAlpha: 1, duration: d("c09", 0.05), ease: "power2.out", immediateRender: false }, f(0.21));
}

/**
 * 0–16%: o celular da criadora volta (luz quente, à esquerda / em cima); o notebook dele fica
 * (luz fria, à direita) — no celular, o dele fica embaixo · 4–16%: a publicação vai do celular
 * dele para o dela · 18–24%: o comentário dele aparece no celular dela · 22–38%: ela responde
 * 40–55%: uma linha fina liga os dois aparelhos · 55–80%: "Equipe do projeto" → Rafael Moura
 * como Investidor (papel de vínculo real; nada de dinheiro) · 80–100%: a equipe aparece
 * atualizada nas duas telas: Lia Campos — Criador · Rafael Moura — Investidor.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, geo, a, d, palco, bp } = c;
  const celA = el("cel-a");
  const aFeed = el("a-feed", celA);
  const aProj = el("a-projeto", celA);
  const celB = el("cel-b");
  const lap = el("lap");
  const cartao = el("cartao");
  const linha = el("linha");
  const traco = el<SVGPathElement & HTMLElement>("linha-traco", linha);
  const noA = el("linha-a", linha);
  const noB = el("linha-b", linha);
  const bloco = c.texto("09");

  // ---- notebook HTML: mesmo estado final da tela da foto 03 (troca imperceptível)
  g.set(lap, { ...pose(geo.poseL08), autoAlpha: 0 });
  g.set(el("l-pag-perfil", lap), { autoAlpha: 0, xPercent: 0 });
  g.set(el("l-pag-projeto", lap), { autoAlpha: 1, xPercent: 0 });
  g.set(el("l-pag-projeto-rolagem", lap), { y: 0 });
  g.set(el("l-coracao", lap), { autoAlpha: 1, scale: 1 });
  g.set(el("l-curtidas-0", lap), { autoAlpha: 0 });
  g.set(el("l-curtidas-1", lap), { autoAlpha: 1 });
  g.set(el("l-novo-membro", lap), { height: 0, autoAlpha: 0 });
  g.set(el("b-novo-membro", celB), { height: 0, autoAlpha: 0 });
  g.set([el("a-pessoa-valor", celA), el("a-papel-valor", celA)], { autoAlpha: 0 });
  g.set([el("a-pessoa-vazio", celA), el("a-papel-vazio", celA)], { autoAlpha: 1 });
  g.set(el("a-papel-lista", celA), { autoAlpha: 0, y: 6 });
  g.set([el("luz09-quente"), el("luz09-fria")], { autoAlpha: 0 });
  traco.setAttribute("d", geo.linha.d);
  noA.setAttribute("cx", String(geo.linha.a.x));
  noA.setAttribute("cy", String(geo.linha.a.y));
  noB.setAttribute("cx", String(geo.linha.b.x));
  noB.setAttribute("cy", String(geo.linha.b.y));
  const comprimento = traco.getTotalLength();
  g.set(linha, { autoAlpha: 0 });
  g.set(traco, { strokeDasharray: comprimento, strokeDashoffset: comprimento });
  g.set([noA, noB], { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%" });
  textoOculto(g, bloco);

  sairTexto(tl, c.texto("08"), a("c09", 0), d("c09", 0.1));
  entrarTexto(tl, bloco, a("c09", 0.05), d("c09", 0.18));
  tl.to(el("luz09-quente"), { autoAlpha: 1, duration: d("c09", 0.2), immediateRender: false }, a("c09", 0.04));
  tl.to(el("luz09-fria"), { autoAlpha: 1, duration: d("c09", 0.2), immediateRender: false }, a("c09", 0.08));

  // ---- aparelhos em posição
  const mover = { duration: d("c09", 0.13), ease: "power3.inOut", immediateRender: false };
  if (geo.temLaptop) {
    const foto3 = palco.querySelector<HTMLElement>('[data-foto="03"]')!;
    tl.set(lap, { autoAlpha: 1 }, a("c09", 0));
    tl.to(foto3, { autoAlpha: 0, duration: d("c09", 0.1), immediateRender: false }, a("c09", 0.01));
    tl.to(lap, { ...pose(geo.poseL09), ...mover }, a("c09", 0.05));
  }
  // ---- a publicação sai do celular dele (que deixa a cena) e pousa no dela
  const meio = {
    x: geo.centro.x - (358 * geo.cartaoA09.s * 1.25) / 2,
    y: geo.centro.y - (geo.alturaCartao * geo.cartaoA09.s * 1.25) / 2 + c.vh * 0.06,
    s: geo.cartaoA09.s * 1.25,
  };
  tl.to(cartao, { ...pose(meio), duration: d("c09", 0.1), ease: "power2.inOut", immediateRender: false }, a("c09", 0.03));
  tl.to(el("cartao-sombra"), { autoAlpha: 1, duration: d("c09", 0.06), immediateRender: false }, a("c09", 0.04));
  tl.to(celB, { ...pose(geo.poseB09), ...mover }, a("c09", 0.05));
  if (bp !== "celular") tl.set(celB, { autoAlpha: 0 }, a("c09", 0.19));

  tl.set(celA, { ...pose(geo.poseAFora09), autoAlpha: 1 }, a("c09", 0.08));
  tl.set(el("a-feed-rolagem", celA), { y: geo.rolA09 }, a("c09", 0.08));
  tl.set(aProj, { autoAlpha: 0 }, a("c09", 0.08));
  tl.set(aFeed, { autoAlpha: 1, xPercent: 0 }, a("c09", 0.08));
  tl.to(celA, { ...pose(geo.poseA09), ...mover }, a("c09", 0.09));
  tl.to(cartao, { ...pose(geo.cartaoA09), duration: d("c09", 0.1), ease: "power2.inOut", immediateRender: false }, a("c09", 0.16));
  tl.to(el("cartao-sombra"), { autoAlpha: 0, duration: d("c09", 0.06), immediateRender: false }, a("c09", 0.2));

  tl.to(el("comentarios", cartao), { height: "auto", autoAlpha: 1, duration: d("c09", 0.05), ease: "power2.out", immediateRender: false }, a("c09", 0.26));
  tl.to(el("resposta", cartao), { height: "auto", autoAlpha: 1, duration: d("c09", 0.03), ease: "power2.out", immediateRender: false }, a("c09", 0.31));
  digitar(tl, c, el("resposta-texto", cartao), a("c09", 0.33), d("c09", 0.1), { porPalavra: true });

  // ---- a linha
  tl.set(linha, { autoAlpha: 1 }, a("c09", 0.44));
  tl.to(noA, { autoAlpha: 1, scale: 1, duration: d("c09", 0.03), immediateRender: false }, a("c09", 0.44));
  tl.to(traco, { strokeDashoffset: 0, duration: d("c09", 0.12), ease: "power1.inOut", immediateRender: false }, a("c09", 0.45));
  tl.to(noB, { autoAlpha: 1, scale: 1, duration: d("c09", 0.03), immediateRender: false }, a("c09", 0.56));

  // ---- Equipe do projeto (no celular dela)
  trocarPagina(tl, aFeed, aProj, a("c09", 0.58), d("c09", 0.06));
  tl.set(el("a-projeto-rolagem", celA), { y: geo.rolAEquipe }, a("c09", 0.58));
  tl.to(cartao, { x: `-=${390 * 0.3 * geo.poseA09.s}`, autoAlpha: 0, duration: d("c09", 0.06), ease: "power3.inOut", immediateRender: false }, a("c09", 0.58));
  adicionarMembro(tl, c, celA, a("c09", 0.62));

  // ---- a outra tela mostra a equipe atualizada
  if (geo.temLaptop) {
    tl.to(el("l-pag-projeto-rolagem", lap), { y: geo.rolLEquipe, duration: d("c09", 0.1), ease: "power2.inOut", immediateRender: false }, a("c09", 0.62));
    tl.to(el("l-novo-membro", lap), { height: "auto", autoAlpha: 1, duration: d("c09", 0.05), ease: "power2.out", immediateRender: false }, a("c09", 0.86));
  } else {
    const bFeed = el("b-feed", celB);
    const bProj = el("b-projeto", celB);
    tl.set(el("b-projeto-rolagem", celB), { y: geo.rolBEquipe }, a("c09", 0.62));
    trocarPagina(tl, bFeed, bProj, a("c09", 0.62), d("c09", 0.06));
    tl.to(el("b-novo-membro", celB), { height: "auto", autoAlpha: 1, duration: d("c09", 0.05), ease: "power2.out", immediateRender: false }, a("c09", 0.86));
  }
}
