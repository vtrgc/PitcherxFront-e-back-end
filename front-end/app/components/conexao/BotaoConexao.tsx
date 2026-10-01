"use client";

import { Check, Clock, Loader2, UserCheck, UserPlus, X } from "lucide-react";
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
 * Seguir · Seguir de volta · Solicitação enviada (cancelar) · Seguindo (deixar de seguir)
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
    <button
      type="button"
      onClick={onDeixarDeSeguir}
      disabled={ocupado}
      className={`${cls.btnContorno} ${tamanho} group`}
    >
      {ocupado ? <Loader2 size={icone} className="animate-spin" aria-hidden="true" /> : <UserCheck size={icone} aria-hidden="true" />}
      <span className="group-hover:hidden">{rotulo}</span>
      <span className="hidden group-hover:inline" aria-hidden="true">Deixar de seguir</span>
      <span className="sr-only"> (clique para deixar de seguir)</span>
    </button>
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
