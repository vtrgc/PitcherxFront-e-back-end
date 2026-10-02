"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Clock, Loader2, UserCheck, UserMinus, UserPlus, X } from "lucide-react";
import { RelacaoConexao, rotuloBotaoConexao } from "../../lib/conexao";
import { cls } from "../ui/estilos";

interface Props {
  relacao: RelacaoConexao;
  ocupado?: boolean;
  compacto?: boolean;
  /** Mostra Aceitar/Recusar quando há solicitação recebida (padrão: true). */
  mostrarResposta?: boolean;
  /** Mostra apenas Aceitar/Recusar (sem o botão de seguir). */
  somenteResposta?: boolean;
  onSeguir?: () => void;
  onDeixarDeSeguir?: () => void;
  onCancelar?: () => void;
  onAceitar?: () => void;
  onRecusar?: () => void;
}

/**
 * Botão de conexão com todos os estados do modelo do backend:
 * Seguir · Seguir de volta · Solicitação enviada (cancelar) · Seguindo (menu com "Parar de seguir")
 * e, quando a outra pessoa pediu para seguir, Aceitar / Recusar.
 */
export default function BotaoConexao({
  relacao,
  ocupado = false,
  compacto = false,
  mostrarResposta = true,
  somenteResposta = false,
  onSeguir,
  onDeixarDeSeguir,
  onCancelar,
  onAceitar,
  onRecusar,
}: Props) {
  const tamanho = compacto ? "!px-3 !py-[0.45rem] !text-[12.5px]" : "";
  const icone = compacto ? 14 : 16;
  const rotulo = rotuloBotaoConexao(relacao);

  const principal = relacao.euSigo ? (
    <MenuSeguindo rotulo={rotulo} tamanho={tamanho} icone={icone} ocupado={ocupado} onPararDeSeguir={onDeixarDeSeguir} />
  ) : relacao.solicitacaoEnviada ? (
    <button
      type="button"
      onClick={onCancelar}
      disabled={ocupado}
      className={`${cls.btnSecundario} ${tamanho}`}
    >
      {ocupado ? <Loader2 size={icone} className="animate-spin" aria-hidden="true" /> : <Clock size={icone} aria-hidden="true" />}
      {rotulo}
      <span className="sr-only"> (clique para cancelar)</span>
    </button>
  ) : (
    <button type="button" onClick={onSeguir} disabled={ocupado} className={`${cls.btnPrimario} ${tamanho}`}>
      {ocupado ? <Loader2 size={icone} className="animate-spin" aria-hidden="true" /> : <UserPlus size={icone} aria-hidden="true" />}
      {rotulo}
    </button>
  );

  const resposta =
    relacao.solicitacaoRecebida && onAceitar && onRecusar ? (
      <>
        <button type="button" onClick={onAceitar} disabled={ocupado} className={`${cls.btnPrimario} ${tamanho}`}>
          <Check size={icone} aria-hidden="true" /> Aceitar
        </button>
        <button type="button" onClick={onRecusar} disabled={ocupado} className={`${cls.btnContorno} ${tamanho}`}>
          <X size={icone} aria-hidden="true" /> Recusar
        </button>
      </>
    ) : null;

  if (somenteResposta) return resposta ? <div className="flex flex-wrap items-center gap-2">{resposta}</div> : null;
  if (!(mostrarResposta && resposta)) return principal;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {resposta}
      {principal}
    </div>
  );
}

/**
 * "Seguindo" abre um menu com a opção "Parar de seguir" (funciona por clique e toque; antes
 * a opção só aparecia ao passar o mouse). A confirmação fica a cargo de `onPararDeSeguir`.
 */
function MenuSeguindo({
  rotulo,
  tamanho,
  icone,
  ocupado,
  onPararDeSeguir,
}: {
  rotulo: string;
  tamanho: string;
  icone: number;
  ocupado: boolean;
  onPararDeSeguir?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const idMenu = useId();

  useEffect(() => {
    if (!aberto) return;
    function fechar(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setAberto(false);
        return;
      }
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [aberto]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        disabled={ocupado}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        className={`${cls.btnContorno} ${tamanho}`}
      >
        {ocupado ? <Loader2 size={icone} className="animate-spin" aria-hidden="true" /> : <UserCheck size={icone} aria-hidden="true" />}
        {rotulo}
        <ChevronDown size={icone - 2} aria-hidden="true" className={`transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div
          id={idMenu}
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            onClick={() => {
              setAberto(false);
              onPararDeSeguir?.();
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] font-medium text-red-600 hover:bg-red-50"
          >
            <UserMinus size={15} aria-hidden="true" /> Parar de seguir
          </button>
        </div>
      )}
    </div>
  );
}
