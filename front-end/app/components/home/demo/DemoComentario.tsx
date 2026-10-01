import { Heart, MessageCircle, Send } from "lucide-react";
import Avatar from "../../ui/Avatar";

/**
 * Réplica visual de ComentarioCard (sem API, sem ações). O texto pode ser "digitado"
 * pela timeline através de `data-hx`.
 */
export default function DemoComentario({
  nome,
  texto,
  hx,
  resposta = false,
}: {
  nome: string;
  texto: string;
  hx?: string;
  resposta?: boolean;
}) {
  return (
    <article className={`relative border-b border-ink-100 last:border-b-0 ${resposta ? "py-3 pl-[2.85rem]" : "py-4"}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar nome={nome} tamanho={resposta ? 28 : 36} />
        <span className="truncate text-[13.5px] font-semibold text-ink-900">{nome}</span>
      </div>
      <p
        data-hx={hx}
        className="mt-2 max-w-[600px] whitespace-pre-line break-words pl-[2.85rem] text-[0.9375rem] leading-[1.65] text-ink-700"
      >
        {texto}
      </p>
      {!resposta && (
        <div className="mt-1.5 flex items-center gap-1 pl-[2.6rem]">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-500">
            <Heart size={16} strokeWidth={1.75} aria-hidden="true" />
            Curtir
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-500">
            <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
            Responder
          </span>
        </div>
      )}
    </article>
  );
}

/**
 * Bloco "Comentários" da publicação (réplica de PostCard + CriarComentario): composer com o
 * texto digitado pela timeline e a lista, onde o comentário enviado e a resposta aparecem.
 */
export function DemoComentarios({
  prefixo,
  autor,
  texto,
  outro,
  resposta,
}: {
  prefixo: string;
  autor: string;
  texto: string;
  outro: string;
  resposta: string;
}) {
  return (
    <div className="mt-3 border-t border-ink-100 pt-4">
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-500">Comentários</p>
      <div className="mt-3">
        <div className="relative max-w-2xl border-b border-ink-100 py-4 pl-5 before:absolute before:bottom-[0.35rem] before:left-0 before:top-[0.35rem] before:w-[2px] before:rounded-full before:bg-brand-300 before:opacity-50 before:content-['']">
          <div className="relative min-h-[3.4em]">
            <p data-hx={`${prefixo}-digitando`} data-digitar={texto} className="py-1 text-[0.9375rem] text-ink-900">
              {texto}
            </p>
            <p data-hx={`${prefixo}-ph`} className="hx-ph absolute left-0 top-1 text-[0.9375rem] text-ink-400">
              Escreva um comentário...
            </p>
          </div>
          <div className="mt-2 flex justify-end">
            <span
              data-hx={`${prefixo}-btn`}
              className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] bg-brand-600 px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none text-white"
            >
              <Send size={16} aria-hidden="true" />
              Comentar
            </span>
          </div>
        </div>
      </div>
      <div className="mt-1">
        <div data-hx={`${prefixo}-item`} className="hx-item-comentario overflow-hidden">
          <DemoComentario nome={autor} texto={texto} />
        </div>
        <div data-hx={`${prefixo}-item-resposta`} className="hx-item-comentario overflow-hidden">
          <DemoComentario nome={outro} texto={resposta} resposta />
        </div>
      </div>
    </div>
  );
}
