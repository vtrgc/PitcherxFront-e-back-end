"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Check, FileSignature, Loader2, Pencil, Plus, Reply, Trash2, X } from "lucide-react";

import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import FormValorDescricao from "../../components/FormValorDescricao";
import Alerta from "../../components/ui/Alerta";
import Modal from "../../components/ui/Modal";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { ChipStatusNegociacao } from "../../components/projeto/ChipsNegociacao";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { formatarDataHora } from "../../lib/date";
import { formatarMoeda } from "../../lib/validacao";
import { Proposta } from "../../types/Proposta";
import { ContraProposta } from "../../types/ContraProposta";
import { Projeto } from "../../types/Projeto";
import {
  aceitarProposta,
  buscarProposta,
  esquecerPropostaEnviada,
  excluirProposta,
  idsPropostasEnviadas,
  recusarProposta,
} from "../../services/proposta.service";
import {
  aceitarContraProposta,
  atualizarContraProposta,
  criarContraProposta,
  excluirContraProposta,
  listarContraPropostas,
  listarContraPropostasDoProjeto,
  listarContraPropostasRecebidas,
  rejeitarContraProposta,
} from "../../services/contraProposta.service";
import { buscarProjeto } from "../../services/projeto.service";
import { listarIdsProjetosCriados } from "../../services/projetoUsuario.service";

/**
 * Negociação de uma proposta:
 *  - criador do projeto: aceita/recusa a proposta e envia contrapropostas (edita/exclui as suas);
 *  - autor da proposta: aceita ou rejeita (com justificativa) cada contraproposta pendente.
 * Todas as regras são conferidas pelo backend; a tela só oferece as ações cabíveis.
 */
export default function PropostaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { isAuthenticated, usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const idUsuario = usuario?.idUsuario ?? null;

  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [contraPropostas, setContraPropostas] = useState<ContraProposta[]>([]);
  const [idsRecebidas, setIdsRecebidas] = useState<Set<number>>(new Set());
  const [souDonoDoProjeto, setSouDonoDoProjeto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [erroContras, setErroContras] = useState("");
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<ContraProposta | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [rejeitando, setRejeitando] = useState<ContraProposta | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [erroRejeicao, setErroRejeicao] = useState("");

  const carregar = useCallback(async () => {
    if (!idUsuario) return;
    if (!Number.isInteger(id) || id <= 0) {
      setNaoEncontrada(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro("");
    setErroContras("");
    setNaoEncontrada(false);
    try {
      const dados = await buscarProposta(id);
      setProposta(dados);
      const projetoId = dados.projetoId ?? null;
      const [rProjeto, meus, rContras, recebidas] = await Promise.all([
        projetoId ? buscarProjeto(projetoId).catch(() => null) : Promise.resolve(null),
        listarIdsProjetosCriados(idUsuario).catch(() => new Set<number>()),
        (projetoId ? listarContraPropostasDoProjeto(projetoId) : listarContraPropostas()).then(
          (v) => ({ ok: true as const, v }),
          (e) => ({ ok: false as const, e })
        ),
        listarContraPropostasRecebidas().catch(() => [] as ContraProposta[]),
      ]);
      setProjeto(rProjeto);
      setSouDonoDoProjeto(projetoId != null && meus.has(projetoId));
      setIdsRecebidas(new Set((recebidas ?? []).map((c) => c.idContraProposta)));
      if (rContras.ok) {
        setContraPropostas((rContras.v ?? []).filter((cp) => cp.propostaId === id).sort((a, b) => a.idContraProposta - b.idContraProposta));
      } else {
        setErroContras(mensagemErro(rContras.e, "Não foi possível carregar as contrapropostas."));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNaoEncontrada(true);
      else setErro(mensagemErro(error, "Não foi possível carregar a proposta."));
    } finally {
      setLoading(false);
    }
  }, [id, idUsuario]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const pendente = (proposta?.statusProposta ?? "PENDENTE") === "PENDENTE";
  const souAutor = !!idUsuario && (idsPropostasEnviadas(idUsuario).has(id) || contraPropostas.some((c) => idsRecebidas.has(c.idContraProposta)));
  const temContraPendente = contraPropostas.some((c) => (c.status ?? "PENDENTE") === "PENDENTE");

  async function salvar(descricao: string, valor: number | null) {
    const payload = { descricaoContraProposta: descricao, valorContraProposta: valor, idProposta: id };
    if (editando) {
      await atualizarContraProposta(editando.idContraProposta, payload);
      notificar("Contraproposta atualizada.", "sucesso");
    } else {
      await criarContraProposta(payload);
      notificar("Contraproposta enviada. O autor da proposta foi notificado.", "sucesso");
    }
    setMostrarForm(false);
    setEditando(null);
    await carregar();
  }

  async function excluirContra(cp: ContraProposta) {
    if (!(await confirmar("Excluir esta contraproposta?", { titulo: "Excluir contraproposta", perigo: true }))) return;
    try {
      await excluirContraProposta(cp.idContraProposta);
      setContraPropostas((atual) => atual.filter((c) => c.idContraProposta !== cp.idContraProposta));
      notificar("Contraproposta excluída.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a contraproposta."));
    }
  }

  async function aceitarContra(cp: ContraProposta) {
    const ok = await confirmar(`Aceitar a contraproposta de ${formatarMoeda(cp.valorContraProposta)}?`, {
      titulo: "Aceitar contraproposta",
      confirmarLabel: "Aceitar",
    });
    if (!ok) return;
    setProcessando(`cp-${cp.idContraProposta}`);
    try {
      const r = await aceitarContraProposta(cp.idContraProposta);
      setContraPropostas((l) => l.map((c) => (c.idContraProposta === cp.idContraProposta ? { ...c, ...r } : c)));
      notificar("Contraproposta aceita. O criador do projeto foi notificado.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível aceitar a contraproposta."));
    } finally {
      setProcessando(null);
    }
  }

  async function confirmarRejeicao() {
    if (!rejeitando) return;
    if (!justificativa.trim()) {
      setErroRejeicao("A justificativa é obrigatória para rejeitar.");
      return;
    }
    setProcessando(`cp-${rejeitando.idContraProposta}`);
    setErroRejeicao("");
    try {
      const r = await rejeitarContraProposta(rejeitando.idContraProposta, justificativa.trim());
      setContraPropostas((l) => l.map((c) => (c.idContraProposta === rejeitando.idContraProposta ? { ...c, ...r } : c)));
      notificar("Contraproposta rejeitada.", "sucesso");
      setRejeitando(null);
    } catch (error) {
      setErroRejeicao(mensagemErro(error, "Não foi possível rejeitar a contraproposta."));
    } finally {
      setProcessando(null);
    }
  }

  async function decidirProposta(aceitar: boolean) {
    if (!proposta) return;
    const ok = await confirmar(
      aceitar
        ? "Aceitar esta proposta? O autor passa a ser sócio do projeto e o valor é somado ao arrecadado."
        : "Recusar esta proposta?",
      { titulo: aceitar ? "Aceitar proposta" : "Recusar proposta", confirmarLabel: aceitar ? "Aceitar" : "Recusar", perigo: !aceitar }
    );
    if (!ok) return;
    setProcessando("proposta");
    try {
      const r = aceitar ? await aceitarProposta(proposta.idProposta) : await recusarProposta(proposta.idProposta);
      setProposta({ ...proposta, ...r });
      notificar(aceitar ? "Proposta aceita." : "Proposta recusada.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível registrar a decisão."));
    } finally {
      setProcessando(null);
    }
  }

  async function excluirPropria() {
    if (!proposta || !idUsuario) return;
    if (!(await confirmar(`Excluir a proposta #${proposta.idProposta}?`, { titulo: "Excluir proposta", perigo: true }))) return;
    try {
      await excluirProposta(proposta.idProposta);
      esquecerPropostaEnviada(idUsuario, proposta.idProposta);
      notificar("Proposta excluída.", "sucesso");
      router.push("/propostas");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a proposta."));
    }
  }

  return (
    <PageShell area="usuario">
      <Link href="/propostas" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para propostas
      </Link>

      {loading ? (
        <div className={`${cls.card} p-6`} aria-label="Carregando proposta">
          <div className={`${cls.skeleton} h-5 w-32 rounded-lg`} />
          <div className={`${cls.skeleton} mt-4 h-4 w-full rounded-lg`} />
          <div className={`${cls.skeleton} mt-2 h-4 w-3/4 rounded-lg`} />
        </div>
      ) : naoEncontrada ? (
        <div className={cls.card}>
          <EmptyState icon={Reply} title="Proposta não encontrada" description="Ela pode ter sido excluída." />
        </div>
      ) : erro ? (
        <Alerta onTentarNovamente={carregar}>{erro}</Alerta>
      ) : proposta ? (
        <>
          <div className="relative -mx-4 overflow-hidden rounded-[1.25rem] bg-stage-gradient px-5 pb-8 pt-10 sm:-mx-8 sm:px-10 lg:-mx-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cls.chip}>Proposta #{proposta.idProposta}</span>
              <ChipStatusNegociacao status={proposta.statusProposta} />
            </div>
            <h1 className="sr-only">Proposta #{proposta.idProposta}</h1>
            {proposta.projetoId != null && (
              <Link
                href={`/projetos/${proposta.projetoId}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-800 hover:text-brand-700"
              >
                <Briefcase size={15} aria-hidden="true" /> {projeto?.nomeProjeto ?? `Projeto #${proposta.projetoId}`}
              </Link>
            )}
            <p className={`${cls.texto} mt-3 max-w-2xl whitespace-pre-line break-words`}>{proposta.descricaoProposta}</p>
            <p className="font-display mt-5 text-[1.35rem] font-extrabold text-ink-900">{formatarMoeda(proposta.valorProposta)}</p>

            {pendente && (souDonoDoProjeto || souAutor) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {souDonoDoProjeto && (
                  <>
                    <button type="button" onClick={() => decidirProposta(true)} disabled={processando !== null} className={`${cls.btnPrimario} !text-[13px]`}>
                      {processando === "proposta" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                      Aceitar proposta
                    </button>
                    <button type="button" onClick={() => decidirProposta(false)} disabled={processando !== null} className={`${cls.btnPerigo} !text-[13px]`}>
                      <X size={15} aria-hidden="true" /> Recusar
                    </button>
                    {proposta.projetoId != null && (
                      <Link href={`/contratos?projetoId=${proposta.projetoId}&propostaId=${proposta.idProposta}`} className={`${cls.btnContorno} !text-[13px]`}>
                        <FileSignature size={15} aria-hidden="true" /> Formalizar contrato
                      </Link>
                    )}
                  </>
                )}
                {souAutor && !souDonoDoProjeto && !temContraPendente && (
                  <button type="button" onClick={excluirPropria} className={`${cls.btnPerigo} !text-[13px]`}>
                    <Trash2 size={15} aria-hidden="true" /> Excluir proposta
                  </button>
                )}
              </div>
            )}
            {souDonoDoProjeto && pendente && (
              <p className="mt-3 max-w-2xl text-[12.5px] text-ink-500">
                Se houver um contrato pendente para esta proposta, o servidor exige que ele seja aceito antes de aceitar a proposta.
              </p>
            )}
          </div>

          <section className="mt-8" aria-labelledby="titulo-contras">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="titulo-contras" className={cls.eyebrow}>
                <Reply size={14} aria-hidden="true" />
                Contrapropostas
              </h2>
              {souDonoDoProjeto && pendente && (
                <button
                  type="button"
                  onClick={() => {
                    setEditando(null);
                    setMostrarForm((v) => !v);
                  }}
                  aria-expanded={mostrarForm && !editando}
                  className={`${cls.btnSecundario} !text-[13px]`}
                >
                  <Plus size={15} aria-hidden="true" />
                  Nova contraproposta
                </button>
              )}
            </div>

            {mostrarForm && (
              <div className={`${cls.composer} mt-4`}>
                <h3 className="text-[15px] font-bold text-ink-900">{editando ? "Editar contraproposta" : "Nova contraproposta"}</h3>
                <FormValorDescricao
                  key={editando?.idContraProposta ?? "nova"}
                  idPrefixo="contra"
                  descricaoInicial={editando?.descricaoContraProposta}
                  valorInicial={editando?.valorContraProposta}
                  placeholder="Descreva a contraproposta..."
                  rotuloEnviar={editando ? "Salvar alterações" : "Enviar"}
                  onEnviar={salvar}
                  onCancelar={() => {
                    setMostrarForm(false);
                    setEditando(null);
                  }}
                />
              </div>
            )}

            {erroContras ? (
              <Alerta className="mt-4" onTentarNovamente={carregar}>
                {erroContras}
              </Alerta>
            ) : contraPropostas.length === 0 ? (
              <p className="text-[0.8125rem] text-ink-500 mt-5">
                Nenhuma contraproposta ainda.{souDonoDoProjeto && pendente ? " Você pode responder com outra oferta." : ""}
              </p>
            ) : (
              <ul className="mt-3">
                {contraPropostas.map((cp) => {
                  const cpPendente = (cp.status ?? "PENDENTE") === "PENDENTE";
                  const minha = cp.usuarioId != null && cp.usuarioId === idUsuario;
                  const possoDecidir = idsRecebidas.has(cp.idContraProposta) && cpPendente;
                  const ocupado = processando === `cp-${cp.idContraProposta}`;
                  return (
                    <li key={cp.idContraProposta} className={`${cls.linha} flex flex-wrap items-start justify-between gap-3`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-bold text-ink-900">{formatarMoeda(cp.valorContraProposta)}</span>
                          <ChipStatusNegociacao status={cp.status} />
                        </div>
                        <p className={`${cls.texto} mt-2 whitespace-pre-line break-words`}>{cp.descricaoContraProposta}</p>
                        <p className="mt-1 text-[12.5px] text-ink-500">
                          {cp.usuarioNome ? `Por ${cp.usuarioNome}` : "Contraproposta"}
                          {cp.dataCriacao && ` · ${formatarDataHora(cp.dataCriacao)}`}
                          {cp.dataDecisao && ` · decidida em ${formatarDataHora(cp.dataDecisao)}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        {possoDecidir && (
                          <>
                            <button type="button" onClick={() => aceitarContra(cp)} disabled={processando !== null} className={`${cls.btnPrimario} !px-3 !text-[13px]`}>
                              {ocupado ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                              Aceitar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejeitando(cp);
                                setJustificativa("");
                                setErroRejeicao("");
                              }}
                              disabled={processando !== null}
                              className={`${cls.btnPerigo} !px-3 !text-[13px]`}
                            >
                              <X size={15} aria-hidden="true" /> Rejeitar
                            </button>
                          </>
                        )}
                        {minha && cpPendente && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditando(cp);
                              setMostrarForm(true);
                            }}
                            className={cls.btnIcone}
                            aria-label="Editar contraproposta"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {minha && (
                          <button type="button" onClick={() => excluirContra(cp)} className={cls.btnIconePerigo} aria-label="Excluir contraproposta">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <Modal
        aberto={!!rejeitando}
        titulo="Rejeitar contraproposta"
        descricao="A justificativa é enviada ao criador do projeto."
        onFechar={() => setRejeitando(null)}
        ocupado={processando !== null}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (processando === null) confirmarRejeicao();
          }}
        >
          {erroRejeicao && <Alerta className="mb-3">{erroRejeicao}</Alerta>}
          <label htmlFor="rejeicao-justificativa" className={cls.label}>
            Justificativa *
          </label>
          <textarea
            id="rejeicao-justificativa"
            value={justificativa}
            maxLength={1000}
            rows={4}
            onChange={(e) => setJustificativa(e.target.value)}
            className={`${cls.input} resize-y`}
          />
          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={() => setRejeitando(null)} disabled={processando !== null} className={cls.btnSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={processando !== null} className={cls.btnPerigo}>
              {processando !== null ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
              Rejeitar
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
