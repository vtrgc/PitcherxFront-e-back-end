import type { gsap } from "gsap";
import { Briefcase, ChevronDown, Users } from "lucide-react";
import { cls } from "../../ui/estilos";
import TextoCena from "../palco/TextoCena";
import CartaoFantasma from "../demo/CartaoFantasma";
import { entrarTexto, pose, sairTexto, textoOculto, type Ctx } from "../motion/anima";
import { TEXTOS } from "./textos";

/** Colunas de cartões fantasma (sem conteúdo inventado). A coluna do meio reserva o lugar do cartão-fio. */
const COLUNAS: ("publicacao" | "projeto")[][] = [
  ["projeto", "publicacao", "projeto", "publicacao"],
  ["publicacao", "projeto", "publicacao", "projeto"],
  ["publicacao", "projeto", "publicacao", "projeto"],
];

/**
 * Cena 06 — A ideia entra na plataforma. Uma "página" do Explorar/feed vista de longe:
 * abas e filtro reais, cartões fantasma em colunas que se movem em velocidades diferentes.
 */
export default function Cena06Descoberta() {
  return (
    <>
      <div data-hx="grade" className="hx-grade" aria-hidden="true">
        <div className="hx-grade-cabeca">
          <p className={cls.eyebrow}>Descubra</p>
          <p className={cls.h1}>Pessoas e projetos em destaque</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-ink-100">
            <div className="flex items-center gap-6">
              <span className="relative flex items-center gap-1.5 pb-3 text-[14px] font-bold text-ink-400">
                <Users size={15} aria-hidden="true" /> Pessoas
              </span>
              <span className="relative flex items-center gap-1.5 pb-3 text-[14px] font-bold text-ink-900">
                <Briefcase size={15} aria-hidden="true" /> Projetos
                <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-brand-600" />
              </span>
            </div>
            <div className="pb-2">
              <span className={`${cls.input} !w-auto !bg-white !py-2 !text-[13px] inline-flex items-center gap-6`}>
                Todos os tipos <ChevronDown size={14} className="text-ink-400" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
        <div className="hx-grade-colunas">
          {COLUNAS.map((col, i) => (
            <div key={i} data-hx="grade-coluna" className={`hx-grade-coluna hx-grade-coluna--${i}`}>
              {col.map((tipo, j) => (
                <CartaoFantasma key={j} tipo={tipo} className="hx-grade-item" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <TextoCena cena="06" posicao="esquerda" {...TEXTOS.c06} />
    </>
  );
}

/**
 * 0–30%: o cartão SAI do celular e vem para o centro, maior; o celular desce e sai de cena
 * 20–56%: a câmera "recua" e gira: a plataforma (Explorar) entra pela direita; o cartão volta à escala
 * 30–100%: colunas de cartões fantasma deslizam em velocidades diferentes (parallax; no celular, uma coluna)
 * 72–90%: os outros cartões se apagam; a publicação ganha um contorno roxo — é ela que vai ser encontrada.
 */
export function timeline(tl: gsap.core.Timeline, c: Ctx) {
  const { gsap: g, el, els, geo, a, d, bp, vw, vh } = c;
  const cartao = el("cartao");
  const cel = el("cel-a");
  const grade = el("grade");
  const colunas = els("grade-coluna", grade);
  const itens = Array.from(grade.querySelectorAll<HTMLElement>(".hx-grade-item"));

  // a plataforma entra de lado (da direita), como se a câmera girasse para ela
  const entrada = bp === "celular" ? vw * 0.5 : vw * 0.38;
  g.set(grade, { autoAlpha: 0, x: entrada, y: 40, scale: 0.92, transformOrigin: "50% 0%" });
  g.set(colunas, { y: 0 });
  g.set(itens, { opacity: 1 });
  textoOculto(g, c.texto("06"));

  sairTexto(tl, c.texto("05"), a("c06", 0), d("c06", 0.12));
  tl.to(cartao, { ...pose(geo.cartaoGrande06), duration: d("c06", 0.28), ease: "power2.inOut", immediateRender: false }, a("c06", 0.02));
  tl.to(cel, { y: geo.poseA.y + vh * 0.95, duration: d("c06", 0.26), ease: "power2.in", immediateRender: false }, a("c06", 0.02));
  tl.set(cel, { autoAlpha: 0 }, a("c06", 0.29));

  tl.to(grade, { autoAlpha: 1, duration: d("c06", 0.12), ease: "none", immediateRender: false }, a("c06", 0.2));
  tl.to(grade, { x: 0, y: 0, scale: 1, duration: d("c06", 0.36), ease: "power3.out", immediateRender: false }, a("c06", 0.2));
  tl.to(cartao, { ...pose(geo.cartao06), duration: d("c06", 0.3), ease: "power2.inOut", immediateRender: false }, a("c06", 0.28));
  entrarTexto(tl, c.texto("06"), a("c06", 0.38), d("c06", 0.24));

  const deslocamentos = bp === "celular" ? [-110, 0, 0] : [-150, -60, -230];
  colunas.forEach((col, i) => {
    if (deslocamentos[i]) {
      tl.to(col, { y: deslocamentos[i], duration: d("c06", 0.7), ease: "none", immediateRender: false }, a("c06", 0.3));
    }
  });

  tl.to(itens, { opacity: 0.35, duration: d("c06", 0.14), immediateRender: false }, a("c06", 0.72));
  tl.to(el("cartao-anel"), { autoAlpha: 1, duration: d("c06", 0.1), immediateRender: false }, a("c06", 0.76));
}
