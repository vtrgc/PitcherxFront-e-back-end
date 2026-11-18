"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle, PenSquare, Search, WifiOff } from "lucide-react";
import Avatar from "../ui/Avatar";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { horarioCurto, previaMensagem } from "../../lib/mensagens";
import { Conversa } from "../../types/Mensagem";

interface Props {
  conversas: Conversa[];
  carregando: boolean;
  erro: string;
  semConexao: boolean;
  selecionada: number | null;
  onTentarNovamente: () => void;
  onNovaMensagem: () => void;
}

/** Coluna da esquerda: conversas da mais recente para a mais antiga, com busca por nome. */
export default function ListaConversas({ conversas, carregando, erro, semConexao, selecionada, onTentarNovamente, onNovaMensagem }: Props) {
  const [busca, setBusca] = useState("");
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return termo ? conversas.filter((c) => c.participante.nomeUsuario.toLocaleLowerCase("pt-BR").includes(termo)) : conversas;
  }, [busca, conversas]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3.5">
        <h1 className="font-display text-[1.125rem] font-bold text-ink-900">Mensagens</h1>
        <button type="button" onClick={onNovaMensagem} className={cls.btnIcone} aria-label="Nova mensagem" title="Nova mensagem">
          <PenSquare size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="border-b border-ink-100 px-4 py-2.5">
        <label className="relative block">
          <span className="sr-only">Buscar conversa pelo nome</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar conversa"
            className={`${cls.input} !py-2 !pl-9 !text-[13.5px]`}
          />
        </label>
      </div>

      {semConexao && !erro && (
        <p className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-[12.5px] text-amber-800" role="status">
          <WifiOff size={14} aria-hidden="true" /> Sem conexão com o servidor. Tentando de novo…
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {carregando ? (
          <ul aria-label="Carregando conversas" className="divide-y divide-ink-50">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`${cls.skeleton} h-12 w-12 shrink-0 rounded-full`} />
                <div className="flex-1 space-y-2">
                  <div className={`${cls.skeleton} h-3 w-1/2 rounded`} />
                  <div className={`${cls.skeleton} h-3 w-3/4 rounded`} />
                </div>
              </li>
            ))}
          </ul>
        ) : erro ? (
          <div className="p-4">
            <Alerta onTentarNovamente={onTentarNovamente}>{erro}</Alerta>
          </div>
        ) : conversas.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600" aria-hidden="true">
              <MessageCircle size={26} />
            </span>
            <p className="font-display text-[15px] font-bold text-ink-900">Nenhuma conversa ainda</p>
            <p className="mt-1.5 text-[13px] leading-5 text-ink-500">Converse com as pessoas com quem você tem uma conexão aceita.</p>
            <button type="button" onClick={onNovaMensagem} className={`${cls.btnPrimario} mt-5 !text-[13px]`}>
              <PenSquare size={15} aria-hidden="true" /> Nova mensagem
            </button>
          </div>
        ) : filtradas.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-ink-500">Nenhuma conversa com esse nome.</p>
        ) : (
          <nav aria-label="Conversas">
            <ul className="divide-y divide-ink-50">
              {filtradas.map((c) => {
                const ativa = c.idConversa === selecionada;
                const naoLida = c.naoLidas > 0;
                return (
                  <li key={c.idConversa}>
                    <Link
                      href={`/mensagens?conversa=${c.idConversa}`}
                      aria-current={ativa ? "page" : undefined}
                      className={`relative flex items-center gap-3 px-4 py-3.5 transition-colors ${
                        ativa ? "bg-brand-50/70" : "hover:bg-ink-25"
                      }`}
                    >
                      {ativa && <span className="absolute inset-y-0 left-0 w-[3px] bg-brand-600" aria-hidden="true" />}
                      <Avatar url={c.participante.urlImagemUsuario} nome={c.participante.nomeUsuario} tamanho={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`truncate text-[14px] ${naoLida ? "font-bold text-ink-900" : "font-semibold text-ink-800"}`}>
                            {c.participante.nomeUsuario}
                          </p>
                          <time
                            dateTime={c.ultimaMensagem?.dataEnvio ?? undefined}
                            className={`shrink-0 text-[11.5px] ${naoLida ? "font-semibold text-brand-700" : "text-ink-400"}`}
                          >
                            {horarioCurto(c.ultimaMensagem?.dataEnvio ?? c.dataUltimaMensagem)}
                          </time>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className={`truncate text-[13px] ${naoLida ? "font-semibold text-ink-800" : "text-ink-500"}`}>
                            {previaMensagem(c.ultimaMensagem)}
                          </p>
                          {naoLida && (
                            <span className="min-w-[1.25rem] shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-center text-[10.5px] font-bold leading-none text-white">
                              {c.naoLidas > 99 ? "99+" : c.naoLidas}
                              <span className="sr-only"> não lidas</span>
                            </span>
                          )}
                        </div>
                        {!c.podeEnviar && <p className="mt-0.5 text-[11.5px] text-ink-400">Somente leitura</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
