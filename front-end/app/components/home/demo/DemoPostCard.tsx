import { Heart, MessageCircle, Share2 } from "lucide-react";
import Avatar from "../../ui/Avatar";
import { COMENTARIO, CRIADORA, INTERESSADO, PUBLICACAO, RESPOSTA } from "./dados";
import DemoComentario from "./DemoComentario";

/**
 * Réplica visual do PostCard real (mesmas classes), sem hooks nem API.
 * É a MESMA publicação da história inteira: o palco usa uma única instância como
 * "objeto-fio"; as outras instâncias (`fantasma`) só reservam o espaço exato dela.
 *
 * Estados animados (via data-hx):
 *  - curtidas: contador de curtidas da publicação
 *  - comentarios: bloco de comentários (fechado por padrão no cinema)
 *  - resposta: resposta da criadora ao comentário
 */
export default function DemoPostCard({
  fantasma = false,
  comComentarios = false,
  comResposta = false,
  className = "",
}: {
  fantasma?: boolean;
  comComentarios?: boolean;
  comResposta?: boolean;
  className?: string;
}) {
  return (
    <article
      data-hx={fantasma ? "slot-cartao" : undefined}
      className={`hx-postcard relative rounded-2xl border border-ink-100 bg-white px-4 py-5 ${fantasma ? "invisible" : ""} ${className}`}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar nome={CRIADORA.nome} tamanho={44} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="truncate text-[15px] font-bold text-ink-900">{CRIADORA.nome}</span>
              <span className="truncate text-[0.75rem] text-ink-400">@{CRIADORA.handle}</span>
            </div>
            <p className="text-[0.75rem] text-ink-400">
              <time>{PUBLICACAO.data}</time>
            </p>
          </div>
        </div>
      </header>

      <div className="mt-3">
        <h3 className="font-display break-words text-[18px] font-bold leading-snug tracking-tight text-ink-900">
          {PUBLICACAO.titulo}
        </h3>
        <p className="mt-1.5 whitespace-pre-line break-words text-[0.9375rem] leading-[1.65] text-ink-700">{PUBLICACAO.texto}</p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-0.5">
        <span className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-500">
          <Heart size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hx-rotulo-acao">Curtir</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-500">
          <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hx-rotulo-acao">Comentários</span>
          {comComentarios && (
            <span data-hx="n-comentarios" className="hx-n-comentarios">
              1
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-500">
          <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hx-rotulo-acao">Compartilhar</span>
        </span>
      </div>

      {comComentarios && (
        <div data-hx="comentarios" className="mt-2 border-t border-ink-100 pt-2">
          <DemoComentario nome={INTERESSADO.nome} texto={COMENTARIO} hx="comentario-texto" />
          {comResposta && (
            <div data-hx="resposta">
              <DemoComentario nome={CRIADORA.nome} texto={RESPOSTA} hx="resposta-texto" resposta />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
