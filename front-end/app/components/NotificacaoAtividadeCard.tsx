"use client";

import Link from "next/link";
import { ArrowRight, CheckCheck, Heart, MessageCircle, Reply, Vote } from "lucide-react";
import { tempoRelativo } from "../lib/date";
import { NotificacaoAtividade, TipoAtividade } from "../lib/atividade";

const ICONES: Record<TipoAtividade, { icone: typeof Heart; cor: string }> = {
  CURTIDA: { icone: Heart, cor: "bg-red-50 text-red-600" },
  COMENTARIO: { icone: MessageCircle, cor: "bg-brand-50 text-brand-700" },
  RESPOSTA: { icone: Reply, cor: "bg-sky-50 text-sky-700" },
  VOTO: { icone: Vote, cor: "bg-amber-50 text-amber-700" },
};

/** Notificação de atividade (curtida, comentário, resposta ou voto) gerada no front. */
export default function NotificacaoAtividadeCard({
  notificacao,
  onAbrir,
  onMarcarLida,
}: {
  notificacao: NotificacaoAtividade;
  onAbrir: () => void;
  onMarcarLida: () => void;
}) {
  const { icone: Icone, cor } = ICONES[notificacao.tipo];
  const naoLida = !notificacao.lida;
  return (
    <li className={`flex gap-3 border-b border-ink-100 px-4 py-4 last:border-b-0 sm:px-5 ${naoLida ? "bg-brand-50/50" : ""}`}>
      <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cor}`}>
        <Icone size={18} className={notificacao.tipo === "CURTIDA" ? "fill-current" : ""} aria-hidden="true" />
        {naoLida && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-accent-500" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className={`text-[14px] text-ink-900 ${naoLida ? "font-bold" : "font-semibold"}`}>
            {notificacao.titulo}
            {naoLida && <span className="sr-only"> (não lida)</span>}
          </p>
          {notificacao.data && (
            <time className="shrink-0 text-[12px] text-ink-400" dateTime={notificacao.data}>
              {tempoRelativo(notificacao.data)}
            </time>
          )}
        </div>
        <p className="mt-0.5 break-words text-[13.5px] leading-relaxed text-ink-600">{notificacao.mensagem}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Link
            href={notificacao.link}
            onClick={onAbrir}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-700"
          >
            {notificacao.tipo === "VOTO" ? "Ver projeto" : "Ver publicação"} <ArrowRight size={13} aria-hidden="true" />
          </Link>
          {naoLida && (
            <button
              type="button"
              onClick={onMarcarLida}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-100"
            >
              <CheckCheck size={14} aria-hidden="true" /> Marcar como lida
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
