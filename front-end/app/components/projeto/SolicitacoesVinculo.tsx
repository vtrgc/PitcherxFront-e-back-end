"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Handshake, Loader2, Send, UserPlus, X } from "lucide-react";

import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import { formatarData } from "../../lib/date";
import {
  aprovarSolicitacao,
  listarMinhasSolicitacoes,
  listarSolicitacoesDoProjeto,
  rejeitarSolicitacao,
  solicitarVinculo,
} from "../../services/solicitacaoVinculo.service";
import { ProjetoUsuario, TIPO_VINCULO_ID, rotuloVinculo } from "../../types/ProjetoUsuario";
import { ROTULO_STATUS_SOLICITACAO, SolicitacaoVinculo } from "../../types/SolicitacaoVinculo";

/** Tipos que podem ser pedidos (SolicitacaoVinculoController: "SOCIO ou INVESTIDOR"). */
export const TIPOS_SOLICITAVEIS = [
  { id: TIPO_VINCULO_ID.SOCIO, nome: "SOCIO", rotulo: "Sócio" },
  { id: TIPO_VINCULO_ID.INVESTIDOR, nome: "INVESTIDOR", rotulo: "Investidor" },
];

const ESTILO_STATUS: Record<string, string> = {
  PENDENTE: "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800",
  ACEITE: cls.chipAtivo,
  RECUSADA: "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700",
};

export function ChipStatusSolicitacao({ status }: { status: string }) {
  return <span className={ESTILO_STATUS[status] ?? cls.chipInativo}>{ROTULO_STATUS_SOLICITACAO[status] ?? status}</span>;
}

/** O servidor só concede SÓCIO/INVESTIDOR quando o tipo registrado é um deles. */
export function tipoRegistradoInesperado(s: Pick<SolicitacaoVinculo, "nomeTipoVinculoDesejado">) {
  return !TIPOS_SOLICITAVEIS.some((t) => t.nome === s.nomeTipoVinculoDesejado);
}

/**
 * Aprovar/recusar com confirmação. O servidor confere se `idCriador` é o CRIADOR do projeto e
 * concede exatamente o tipo REGISTRADO na solicitação — por isso a confirmação o mostra.
 */
export function useDecisaoSolicitacao(idCriador: number | null | undefined, aoDecidir: (s: SolicitacaoVinculo) => void) {
  const { notificar, confirmar } = useFeedback();
  const [processando, setProcessando] = useState<number | null>(null);

  const decidir = useCallback(
    async (s: SolicitacaoVinculo, aprovar: boolean) => {
      if (!idCriador) return;
      const tipo = rotuloVinculo(s.nomeTipoVinculoDesejado);
      const aviso = tipoRegistradoInesperado(s)
        ? ` Atenção: o servidor registrou este pedido como "${tipo}", e é esse vínculo que a pessoa receberá.`
        : "";
      const ok = await confirmar(
        aprovar
          ? `Aprovar o pedido de ${s.nomeSolicitante} para participar como ${tipo}?${aviso}`
          : `Recusar o pedido de ${s.nomeSolicitante}? A pessoa será avisada por e-mail.`,
        { titulo: aprovar ? "Aprovar solicitação" : "Recusar solicitação", confirmarLabel: aprovar ? "Aprovar" : "Recusar", perigo: !aprovar }
      );
      if (!ok) return;
      setProcessando(s.idSolicitacaoVinculo);
      try {
        const atualizada = aprovar ? await aprovarSolicitacao(s.idSolicitacaoVinculo, idCriador) : await rejeitarSolicitacao(s.idSolicitacaoVinculo, idCriador);
        aoDecidir(atualizada);
        notificar(aprovar ? "Solicitação aprovada." : "Solicitação recusada.", "sucesso");
      } catch (error) {
        notificar(mensagemErro(error, "Não foi possível responder à solicitação. O servidor também envia um e-mail: tente novamente em instantes."));
      } finally {
        setProcessando(null);
      }
    },
    [idCriador, confirmar, notificar, aoDecidir]
  );

  return { decidir, processando };
}

export function LinhaSolicitacao({
  solicitacao: s,
  mostrarProjeto = false,
  mostrarSolicitante = true,
  onDecidir,
  processando = false,
}: {
  solicitacao: SolicitacaoVinculo;
  mostrarProjeto?: boolean;
  mostrarSolicitante?: boolean;
  onDecidir?: (s: SolicitacaoVinculo, aprovar: boolean) => void;
  processando?: boolean;
}) {
  const pendente = s.status === "PENDENTE";
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {mostrarSolicitante ? (
            <Link href={`/perfil/${s.solicitanteId}`} className="font-display text-[14.5px] font-semibold text-ink-900 hover:underline">
              {s.nomeSolicitante}
            </Link>
          ) : (
            <span className="font-display text-[14.5px] font-semibold text-ink-900">Pedido de participação</span>
          )}
          <ChipStatusSolicitacao status={s.status} />
        </div>
        {mostrarProjeto && (
          <p className="mt-0.5 text-[13px] text-ink-600">
            Projeto:{" "}
            <Link href={`/projetos/${s.projetoId}`} className="font-semibold text-brand-700 hover:underline">
              {s.nomeProjeto}
            </Link>
          </p>
        )}
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          Vínculo registrado: <strong className="font-semibold text-ink-700">{rotuloVinculo(s.nomeTipoVinculoDesejado)}</strong> · enviado em{" "}
          {formatarData(s.dataSolicitacao)}
          {s.dataResposta && ` · respondido em ${formatarData(s.dataResposta)}`}
        </p>
        {pendente && tipoRegistradoInesperado(s) && (
          <p className="mt-1 text-[12px] text-amber-700">
            O servidor registrou um tipo diferente de Sócio/Investidor (limitação conhecida da API de solicitações).
          </p>
        )}
      </div>
      {pendente && onDecidir && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={processando} onClick={() => onDecidir(s, true)} className={`${cls.btnPrimario} !px-3 !py-2 !text-[13px]`}>
            {processando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} aria-hidden="true" />} Aprovar
          </button>
          <button type="button" disabled={processando} onClick={() => onDecidir(s, false)} className={`${cls.btnPerigo} !px-3 !py-2 !text-[13px]`}>
            <X size={14} aria-hidden="true" /> Recusar
          </button>
        </div>
      )}
    </li>
  );
}

/** Painel do CRIADOR na página do projeto: todas as solicitações, pendentes primeiro. */
export function SolicitacoesDoProjeto({ projetoId, idCriador, onMudancaEquipe }: { projetoId: number; idCriador: number; onMudancaEquipe: () => void }) {
  const [lista, setLista] = useState<SolicitacaoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setLista((await listarSolicitacoesDoProjeto(projetoId)) ?? []);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar as solicitações."));
    } finally {
      setCarregando(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aoDecidir = useCallback(
    (atualizada: SolicitacaoVinculo) => {
      setLista((atual) => atual.map((s) => (s.idSolicitacaoVinculo === atualizada.idSolicitacaoVinculo ? atualizada : s)));
      if (atualizada.status === "ACEITE") onMudancaEquipe();
    },
    [onMudancaEquipe]
  );
  const { decidir, processando } = useDecisaoSolicitacao(idCriador, aoDecidir);

  const ordenadas = useMemo(
    () => [...lista].sort((a, b) => Number(b.status === "PENDENTE") - Number(a.status === "PENDENTE") || b.idSolicitacaoVinculo - a.idSolicitacaoVinculo),
    [lista]
  );
  const pendentes = lista.filter((s) => s.status === "PENDENTE").length;

  return (
    <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-solicitacoes">
      <h2 id="titulo-solicitacoes" className={cls.eyebrow}>
        <UserPlus size={14} aria-hidden="true" />
        Solicitações de participação {pendentes > 0 && <span className={cls.chip}>{pendentes} pendente{pendentes === 1 ? "" : "s"}</span>}
      </h2>
      <p className="mt-2 text-[13px] text-ink-500">Pedidos de quem já aceitou os termos e quer entrar como sócio ou investidor.</p>
      {carregando ? (
        <div className={`${cls.skeleton} mt-4 h-14 w-full rounded-xl`} aria-label="Carregando solicitações" />
      ) : erro ? (
        <Alerta className="mt-4" onTentarNovamente={carregar}>
          {erro}
        </Alerta>
      ) : ordenadas.length === 0 ? (
        <p className="mt-4 rounded-xl bg-ink-25 px-4 py-3 text-[13px] text-ink-500">Nenhuma solicitação recebida ainda.</p>
      ) : (
        <ul className="mt-3">
          {ordenadas.map((s) => (
            <LinhaSolicitacao key={s.idSolicitacaoVinculo} solicitacao={s} onDecidir={decidir} processando={processando === s.idSolicitacaoVinculo} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Painel de quem participa sem ser criador: mostra o vínculo atual e permite pedir para ser
 * sócio ou investidor (POST /solicitacao-vinculo/projeto/{id}).
 */
export function MinhaParticipacao({ projetoId, meuVinculo }: { projetoId: number; meuVinculo: ProjetoUsuario }) {
  const { notificar } = useFeedback();
  const [minhas, setMinhas] = useState<SolicitacaoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tipo, setTipo] = useState<number>(TIPO_VINCULO_ID.SOCIO);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setMinhas(((await listarMinhasSolicitacoes()) ?? []).filter((s) => s.projetoId === projetoId).sort((a, b) => b.idSolicitacaoVinculo - a.idSolicitacaoVinculo));
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar suas solicitações."));
    } finally {
      setCarregando(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pendente = minhas.find((s) => s.status === "PENDENTE");
  const jaParte = meuVinculo.tipoVinculoId === TIPO_VINCULO_ID.SOCIO || meuVinculo.tipoVinculoId === TIPO_VINCULO_ID.INVESTIDOR;

  async function enviar() {
    setErroEnvio("");
    setAviso("");
    setEnviando(true);
    try {
      const criada = await solicitarVinculo(projetoId, tipo);
      setMinhas((atual) => [criada, ...atual]);
      const escolhido = TIPOS_SOLICITAVEIS.find((t) => t.id === tipo);
      if (criada.nomeTipoVinculoDesejado !== escolhido?.nome) {
        setAviso(
          `Pedido enviado, mas o servidor o registrou como "${rotuloVinculo(criada.nomeTipoVinculoDesejado)}" em vez de "${escolhido?.rotulo}". O criador verá o tipo registrado ao avaliar.`
        );
      }
      notificar("Solicitação enviada ao criador do projeto.", "sucesso");
    } catch (error) {
      setErroEnvio(mensagemErro(error, "Não foi possível enviar a solicitação. O servidor também envia um e-mail ao criador: tente novamente em instantes."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-participacao-usuario">
      <h2 id="titulo-participacao-usuario" className={cls.eyebrow}>
        <Handshake size={14} aria-hidden="true" /> Sua participação
      </h2>
      <p className="mt-3 text-[14px] text-ink-800">
        Você acompanha este projeto como <strong className="font-semibold">{rotuloVinculo(meuVinculo.nomeTipoVinculo)}</strong>
        {meuVinculo.aceitouTermos && meuVinculo.dataAceite && <span className="text-ink-500"> · termos aceitos em {formatarData(meuVinculo.dataAceite)}</span>}.
      </p>

      {!jaParte && !pendente && !carregando && !erro && (
        <form
          noValidate
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!enviando) enviar();
          }}
        >
          <div>
            <label htmlFor="tipo-solicitacao" className={cls.label}>
              Quero participar como
            </label>
            <select
              id="tipo-solicitacao"
              value={tipo}
              onChange={(e) => setTipo(Number(e.target.value))}
              className={`${cls.input} !w-auto !bg-white !py-2`}
              disabled={enviando}
            >
              {TIPOS_SOLICITAVEIS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={enviando} className={`${cls.btnPrimario} !text-[13px]`}>
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} aria-hidden="true" />}
            Enviar solicitação
          </button>
        </form>
      )}

      {pendente && <Alerta variante="info" className="mt-4">Sua solicitação está aguardando a resposta do criador do projeto.</Alerta>}
      {erroEnvio && <Alerta className="mt-4">{erroEnvio}</Alerta>}
      {aviso && (
        <Alerta variante="aviso" className="mt-4">
          {aviso}
        </Alerta>
      )}

      {carregando ? (
        <div className={`${cls.skeleton} mt-4 h-10 w-full rounded-xl`} aria-label="Carregando solicitações" />
      ) : erro ? (
        <Alerta className="mt-4" onTentarNovamente={carregar}>
          {erro}
        </Alerta>
      ) : (
        minhas.length > 0 && (
          <>
            <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">Seus pedidos</h3>
            <ul className="mt-1">
              {minhas.map((s) => (
                <LinhaSolicitacao key={s.idSolicitacaoVinculo} solicitacao={s} mostrarSolicitante={false} />
              ))}
            </ul>
          </>
        )
      )}
    </section>
  );
}
