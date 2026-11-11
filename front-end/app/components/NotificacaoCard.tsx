"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  FileCheck2,
  FileX2,
  Flag,
  HandCoins,
  Loader2,
  Scale,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { tempoRelativo } from "../lib/date";
import { Notificacao, TIPO_NOTIFICACAO } from "../types/Conexao";
import { cls } from "./ui/estilos";

const ICONES: Record<string, { icone: typeof Bell; cor: string }> = {
  [TIPO_NOTIFICACAO.CONEXAO_SOLICITADA]: { icone: UserPlus, cor: "bg-brand-50 text-brand-700" },
  [TIPO_NOTIFICACAO.CONEXAO_ACEITA]: { icone: UserCheck, cor: "bg-emerald-50 text-emerald-700" },
  [TIPO_NOTIFICACAO.CONEXAO_RECUSADA]: { icone: UserX, cor: "bg-ink-50 text-ink-500" },
  [TIPO_NOTIFICACAO.CONTRAPROPOSTA_RECEBIDA]: { icone: HandCoins, cor: "bg-brand-50 text-brand-700" },
  [TIPO_NOTIFICACAO.CONTRAPROPOSTA_ACEITA]: { icone: HandCoins, cor: "bg-emerald-50 text-emerald-700" },
  [TIPO_NOTIFICACAO.CONTRAPROPOSTA_REJEITADA]: { icone: HandCoins, cor: "bg-ink-50 text-ink-500" },
  [TIPO_NOTIFICACAO.DENUNCIA_NOVA]: { icone: Flag, cor: "bg-red-50 text-red-700" },
  [TIPO_NOTIFICACAO.DENUNCIA_APELACAO]: { icone: Scale, cor: "bg-amber-50 text-amber-800" },
  [TIPO_NOTIFICACAO.DENUNCIA_RESULTADO]: { icone: Flag, cor: "bg-brand-50 text-brand-700" },
  [TIPO_NOTIFICACAO.COMPROVANTE_IDENTIDADE_NOVO]: { icone: FileCheck2, cor: "bg-amber-50 text-amber-800" },
  [TIPO_NOTIFICACAO.IDENTIDADE_APROVADA]: { icone: FileCheck2, cor: "bg-emerald-50 text-emerald-700" },
  [TIPO_NOTIFICACAO.IDENTIDADE_REPROVADA]: { icone: FileX2, cor: "bg-red-50 text-red-700" },
  [TIPO_NOTIFICACAO.NIVEL_CONTA_ALTERADO]: { icone: Award, cor: "bg-brand-50 text-brand-700" },
  [TIPO_NOTIFICACAO.NIVEL_CONTA_EVOLUICAO]: { icone: Award, cor: "bg-emerald-50 text-emerald-700" },
};

/** Para onde cada tipo de notificação leva (a tela que resolve o assunto). */
export function destinoNotificacao(tipo: string): { href: string; rotulo: string } | null {
  switch (tipo) {
    case TIPO_NOTIFICACAO.CONTRAPROPOSTA_RECEBIDA:
      return { href: "/propostas?aba=contras-recebidas", rotulo: "Responder contraproposta" };
    case TIPO_NOTIFICACAO.CONTRAPROPOSTA_ACEITA:
    case TIPO_NOTIFICACAO.CONTRAPROPOSTA_REJEITADA:
      return { href: "/propostas?aba=contras-enviadas", rotulo: "Ver contrapropostas" };
    case TIPO_NOTIFICACAO.DENUNCIA_RESULTADO:
      return { href: "/denuncias", rotulo: "Ver minhas denúncias" };
    case TIPO_NOTIFICACAO.DENUNCIA_NOVA:
    case TIPO_NOTIFICACAO.DENUNCIA_APELACAO:
      return { href: "/admin/denuncias", rotulo: "Moderar" };
    case TIPO_NOTIFICACAO.COMPROVANTE_IDENTIDADE_NOVO:
      return { href: "/admin/identidades", rotulo: "Analisar identidade" };
    case TIPO_NOTIFICACAO.IDENTIDADE_APROVADA:
    case TIPO_NOTIFICACAO.IDENTIDADE_REPROVADA:
    case TIPO_NOTIFICACAO.NIVEL_CONTA_ALTERADO:
    case TIPO_NOTIFICACAO.NIVEL_CONTA_EVOLUICAO:
      return { href: "/configuracoes#verificacao", rotulo: "Ver minha conta" };
    default:
      return null;
  }
}

export type RespostaSolicitacao = "aceita" | "recusada" | "processada";

interface Props {
  notificacao: Notificacao;
  /** Resultado de uma resposta já dada nesta tela (apenas CONEXAO_SOLICITADA). */
  resposta?: RespostaSolicitacao;
  ocupado?: boolean;
  marcando?: boolean;
  onMarcarLida: () => void;
  onAceitar?: () => void;
  onRecusar?: () => void;
}

/** Uma notificação (NotificacaoResponseDTO) com as ações que o backend permite. */
export default function NotificacaoCard({ notificacao, resposta, ocupado, marcando, onMarcarLida, onAceitar, onRecusar }: Props) {
  const { icone: Icone, cor } = ICONES[notificacao.tipo] ?? { icone: Bell, cor: "bg-ink-50 text-ink-500" };
  const solicitacao =
    notificacao.tipo === TIPO_NOTIFICACAO.CONEXAO_SOLICITADA && typeof notificacao.referenciaId === "number" && !!onAceitar && !!onRecusar;
  const naoLida = !notificacao.lida;
  const destino = destinoNotificacao(notificacao.tipo);

  return (
    <li className={`flex gap-3 border-b border-ink-100 px-4 py-4 last:border-b-0 sm:px-5 ${naoLida ? "bg-brand-50/50" : ""}`}>
      <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cor}`}>
        <Icone size={18} aria-hidden="true" />
        {naoLida && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-accent-500" aria-hidden="true" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className={`text-[14px] text-ink-900 ${naoLida ? "font-bold" : "font-semibold"}`}>
            {notificacao.titulo}
            {naoLida && <span className="sr-only"> (não lida)</span>}
          </p>
          <time className="shrink-0 text-[12px] text-ink-400" dateTime={notificacao.dataCriacao ?? undefined}>
            {tempoRelativo(notificacao.dataCriacao)}
          </time>
        </div>
        <p className="mt-0.5 break-words text-[13.5px] leading-relaxed text-ink-600">{notificacao.mensagem}</p>

        {(solicitacao || naoLida || destino) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {destino && (
              <Link
                href={destino.href}
                onClick={() => naoLida && onMarcarLida()}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-100"
              >
                {destino.rotulo} <ChevronRight size={13} aria-hidden="true" />
              </Link>
            )}
            {solicitacao &&
              (resposta ? (
                <span className={resposta === "aceita" ? cls.chipAtivo : cls.chipInativo}>
                  {resposta === "aceita" ? "Solicitação aceita" : resposta === "recusada" ? "Solicitação recusada" : "Solicitação já respondida"}
                </span>
              ) : (
                <>
                  <button type="button" onClick={onAceitar} disabled={ocupado} className={`${cls.btnPrimario} !px-3 !py-[0.45rem] !text-[12.5px]`}>
                    {ocupado ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                    Aceitar
                  </button>
                  <button type="button" onClick={onRecusar} disabled={ocupado} className={`${cls.btnContorno} !px-3 !py-[0.45rem] !text-[12.5px]`}>
                    <X size={14} aria-hidden="true" /> Recusar
                  </button>
                </>
              ))}
            {naoLida && (
              <button
                type="button"
                onClick={onMarcarLida}
                disabled={marcando}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
              >
                {marcando ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <CheckCheck size={14} aria-hidden="true" />}
                Marcar como lida
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
