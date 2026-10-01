import { Loader2, Send } from "lucide-react";
import { cls } from "../../ui/estilos";
import Avatar from "../../ui/Avatar";
import { CRIADORA, PUBLICACAO } from "./dados";

/** Réplica do CriarPost (composer do feed). Campos "digitados" pela timeline. */
export default function DemoCriarPost() {
  return (
    <section className={`${cls.composer} !max-w-none`}>
      <div className="flex items-center gap-3">
        <Avatar nome={CRIADORA.nome} tamanho={44} />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold text-ink-900">{CRIADORA.nome}</p>
          <p className="text-[0.75rem] text-ink-400">O que você está construindo hoje?</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="relative border-b border-ink-200 pb-2">
          <p data-hx="post-titulo" data-digitar={PUBLICACAO.titulo} className="min-h-[1.5em] text-[17px] font-bold leading-snug text-ink-900">
            {PUBLICACAO.titulo}
          </p>
          <p data-hx="post-titulo-ph" className="hx-ph absolute left-0 top-0 text-[17px] font-bold text-ink-400">
            Título da publicação
          </p>
        </div>
        <div className="relative">
          <p data-hx="post-texto" data-digitar={PUBLICACAO.texto} className="min-h-[4.9em] py-1 text-[0.9375rem] leading-[1.6] text-ink-900">
            {PUBLICACAO.texto}
          </p>
          <p data-hx="post-texto-ph" className="hx-ph absolute left-0 top-1 text-[0.9375rem] text-ink-400">
            Sobre o que você quer falar?
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-[12px] text-ink-400">
            <span data-hx="post-contador">{PUBLICACAO.texto.length}</span>/2000
          </span>
          <span className="relative inline-flex">
            <span data-hx="btn-publicar" className={`${cls.btnPrimario} min-w-[140px] !text-[13px]`}>
              <Send size={15} aria-hidden="true" />
              Publicar
            </span>
            <span
              data-hx="btn-publicando"
              className={`${cls.btnPrimario} absolute inset-0 min-w-[140px] !text-[13px] opacity-0`}
            >
              <Loader2 size={15} aria-hidden="true" />
              Publicando...
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
