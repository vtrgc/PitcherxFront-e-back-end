"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CircleCheck,
  CircleX,
  FileSignature,
  HandCoins,
  Loader2,
  Pencil,
  Reply,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import FormValorDescricao from "../../components/FormValorDescricao";
import Alerta from "../../components/ui/Alerta";
import Modal from "../../components/ui/Modal";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { ChipSituacao, ChipStatusNegociacao } from "../../components/projeto/ChipsNegociacao";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { formatarDataHora } from "../../lib/date";
import { formatarMoeda } from "../../lib/validacao";
import {
  PapelNegociacao,
  contrapropostasDa,
  situacaoNegociacao,
  statusContra,
  temContraPendente,
  valorAcordado,
} from "../../lib/negociacao";
import { Proposta } from "../../types/Proposta";
import { ContraProposta } from "../../types/ContraProposta";
import { Projeto } from "../../types/Projeto";
import {
  aceitarProposta,
  atualizarProposta,
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

const JUSTIFICATIVA_MAX = 1000;

/**
 * Negociação de uma proposta, com o histórico completo:
 *  - criador do projeto: aceita/recusa a proposta e envia contrapropostas (uma por vez);
 *  - autor da proposta: aceita ou rejeita (com justificativa) cada contraproposta, edita ou
 *    cancela a proposta enquanto não houver contraproposta pendente.
 * As regras são conferidas pelo backend; a tela só oferece as ações válidas no momento.
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
  const [contras, setContras] = useState<ContraProposta[]>([]);
  const [idsRecebidas, setIdsRecebidas] = useState<Set<number>>(new Set());
  const [souDono, setSouDono] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [erroContras, setErroContras] = useState("");
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [formContra, setFormContra] = useState<"nova" | ContraProposta | null>(null);
  const [editandoProposta, setEditandoProposta] = useState(false);
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
      setSouDono(projetoId != null && meus.has(projetoId));
      setIdsRecebidas(new Set((recebidas ?? []).map((c) => c.idContraProposta)));
      if (rContras.ok) setContras(contrapropostasDa(id, rContras.v ?? []));
      else setErroContras(mensagemErro(rContras.e, "Não foi possível carregar as contrapropostas."));
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

  const souAutor =
    !!idUsuario &&
    !souDono &&
    (proposta?.autor?.id === idUsuario || idsPropostasEnviadas(idUsuario).has(id) || contras.some((c) => idsRecebidas.has(c.idContraProposta)));
  const papel: PapelNegociacao = souDono ? "dono" : souAutor ? "autor" : "outro";
  const situacao = useMemo(() => (proposta ? situacaoNegociacao(proposta, contras, papel) : null), [proposta, contras, papel]);
  const pendente = (proposta?.statusProposta ?? "PENDENTE") === "PENDENTE";
  const contraEmAberto = temContraPendente(contras);
  const acordado = proposta ? valorAcordado(proposta, contras) : null;
  const autorTexto = proposta?.autor ? proposta.autor.nome : souAutor ? "Você" : null;

  // -------------------------------------------------------------- dono do projeto
  async function salvarContra(descricao: string, valor: number | null) {
    const payload = { descricaoContraProposta: descricao, valorContraProposta: valor, idProposta: id };
    if (formContra && formContra !== "nova") {
      await atualizarContraProposta(formContra.idContraProposta, payload);
      notificar("Contraproposta atualizada.", "sucesso");
    } else {
      if (contraEmAberto) throw new ApiError(400, { message: "Já existe uma contraproposta aguardando resposta." }, "");
      await criarContraProposta(payload);
      notificar("Contraproposta enviada. O autor da proposta foi notificado.", "sucesso");
    }
    setFormContra(null);
    await carregar();
  }

  async function excluirContra(cp: ContraProposta) {
    if (!(await confirmar("Retirar esta contraproposta?", { titulo: "Retirar contraproposta", confirmarLabel: "Retirar", perigo: true }))) return;
    setProcessando(`cp-${cp.idContraProposta}`);
    try {
      await excluirContraProposta(cp.idContraProposta);
      setContras((l) => l.filter((c) => c.idContraProposta !== cp.idContraProposta));
      notificar("Contraproposta retirada.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível retirar a contraproposta."));
    } finally {
      setProcessando(null);
    }
  }

  async function decidirProposta(aceitar: boolean) {
    if (!proposta) return;
    if (aceitar && contraEmAberto) {
      notificar("Há uma contraproposta aguardando o autor. Espere a resposta ou retire a contraproposta antes de aceitar.");
      return;
    }
    const ok = await confirmar(
      aceitar
        ? `Aceitar a proposta de ${formatarMoeda(proposta.valorProposta)}? O autor passa a ser sócio do projeto e esse valor é somado ao arrecadado.`
        : "Recusar esta proposta? A negociação será encerrada.",
      { titulo: aceitar ? "Aceitar proposta" : "Recusar proposta", confirmarLabel: aceitar ? "Aceitar" : "Recusar", perigo: !aceitar }
    );
    if (!ok) return;
    setProcessando("proposta");
    try {
      const r = aceitar ? await aceitarProposta(proposta.idProposta) : await recusarProposta(proposta.idProposta);
      setProposta({ ...proposta, ...r });
      notificar(aceitar ? "Proposta aceita. O autor agora é sócio do projeto." : "Proposta recusada.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível registrar a decisão."));
    } finally {
      setProcessando(null);
    }
  }

  // -------------------------------------------------------------- autor da proposta
  async function aceitarContra(cp: ContraProposta) {
    if (!proposta) return;
    const ok = await confirmar(
      `Aceitar a contraproposta de ${formatarMoeda(cp.valorContraProposta)}? O valor da sua proposta passa a ser esse, e o criador do projeto faz o aceite final.`,
      { titulo: "Aceitar contraproposta", confirmarLabel: "Aceitar" }
    );
    if (!ok) return;
    setProcessando(`cp-${cp.idContraProposta}`);
    try {
      const r = await aceitarContraProposta(cp.idContraProposta);
      setContras((l) => l.map((c) => (c.idContraProposta === cp.idContraProposta ? { ...c, ...r } : c)));
      // O backend soma ao arrecadado o valor da PROPOSTA quando ela é aceita: alinhamos o valor
      // da proposta ao que foi acordado (só o autor pode editar, e não há mais nada pendente).
      if (cp.valorContraProposta != null && cp.valorContraProposta !== proposta.valorProposta) {
        try {
          const atualizada = await atualizarProposta(
            proposta.idProposta,
            { descricaoProposta: proposta.descricaoProposta, valorProposta: cp.valorContraProposta, projetoId: proposta.projetoId ?? null },
            proposta.autor ?? (usuario ? { id: usuario.idUsuario, nome: usuario.nomeUsuario } : null)
          );
          setProposta({ ...proposta, ...atualizada, valorProposta: cp.valorContraProposta });
        } catch (e) {
          notificar(`Contraproposta aceita, mas o valor da proposta não foi atualizado: ${mensagemErro(e, "tente editar a proposta.")}`);
        }
      }
      notificar("Contraproposta aceita. Agora falta o aceite final do criador do projeto.", "sucesso");
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
      setContras((l) => l.map((c) => (c.idContraProposta === rejeitando.idContraProposta ? { ...c, ...r } : c)));
      notificar("Contraproposta rejeitada. O criador do projeto recebeu sua justificativa.", "sucesso");
      setRejeitando(null);
    } catch (error) {
      setErroRejeicao(mensagemErro(error, "Não foi possível rejeitar a contraproposta."));
    } finally {
      setProcessando(null);
    }
  }

  async function salvarEdicaoProposta(descricao: string, valor: number | null) {
    if (!proposta) return;
    const atualizada = await atualizarProposta(
      proposta.idProposta,
      { descricaoProposta: descricao, valorProposta: valor, projetoId: proposta.projetoId ?? null },
      proposta.autor ?? (usuario ? { id: usuario.idUsuario, nome: usuario.nomeUsuario } : null)
    );
    setProposta({ ...proposta, ...atualizada, descricaoProposta: descricao, valorProposta: valor });
    setEditandoProposta(false);
    notificar("Proposta atualizada.", "sucesso");
  }

  async function cancelarProposta() {
    if (!proposta || !idUsuario) return;
    if (!(await confirmar("Cancelar esta proposta? Ela será excluída e a negociação encerrada.", { titulo: "Cancelar proposta", confirmarLabel: "Cancelar proposta", perigo: true })))
      return;
    setProcessando("proposta");
    try {
      await excluirProposta(proposta.idProposta);
      esquecerPropostaEnviada(idUsuario, proposta.idProposta);
      notificar("Proposta cancelada.", "sucesso");
      router.push("/propostas?aba=enviadas");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível cancelar a proposta."));
      setProcessando(null);
    }
  }

  return (
    <PageShell area="usuario">
      <Link href="/propostas" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para propostas
      </Link>

      {loading ? (
        <div className={`${cls.card} p-6`} aria-label="Carregando negociação">
          <div className={`${cls.skeleton} h-5 w-40 rounded-lg`} />
          <div className={`${cls.skeleton} mt-4 h-4 w-full rounded-lg`} />
          <div className={`${cls.skeleton} mt-2 h-4 w-3/4 rounded-lg`} />
          <div className={`${cls.skeleton} mt-8 h-24 w-full rounded-xl`} />
        </div>
      ) : naoEncontrada ? (
        <div className={cls.card}>
          <EmptyState icon={Reply} title="Proposta não encontrada" description="Ela pode ter sido cancelada pelo autor." />
        </div>
      ) : erro ? (
        <Alerta onTentarNovamente={carregar}>{erro}</Alerta>
      ) : proposta && situacao ? (
        <>
          {/* ------------------------------------------------------------ resumo */}
          <section className={`${cls.card} overflow-hidden`} aria-labelledby="titulo-proposta">
            <div className="bg-stage-gradient px-5 pb-6 pt-6 sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cls.chip}>Proposta #{proposta.idProposta}</span>
                <ChipSituacao situacao={situacao} />
                <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                  {papel === "dono" ? "Recebida no seu projeto" : papel === "autor" ? "Enviada por você" : "Visualização"}
                </span>
              </div>
              <h1 id="titulo-proposta" className="font-display mt-4 text-[1.5rem] font-extrabold leading-tight text-ink-900 sm:text-[1.75rem]">
                {formatarMoeda(proposta.valorProposta)}
              </h1>
              {acordado !== null && acordado !== proposta.valorProposta && (
                <p className="mt-1 text-[13.5px] font-semibold text-emerald-700">Valor acordado na contraproposta: {formatarMoeda(acordado)}</p>
              )}
              <dl className="mt-4 grid gap-3 text-[13.5px] sm:grid-cols-2">
                <div className="flex items-center gap-2 text-ink-700">
                  <Briefcase size={15} className="shrink-0 text-ink-400" aria-hidden="true" />
                  <dt className="sr-only">Projeto</dt>
                  <dd className="min-w-0 truncate">
                    {proposta.projetoId != null ? (
                      <Link href={`/projetos/${proposta.projetoId}`} className="font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                        {projeto?.nomeProjeto ?? `Projeto #${proposta.projetoId}`}
                      </Link>
                    ) : (
                      "Projeto não informado"
                    )}
                  </dd>
                </div>
                <div className="flex items-center gap-2 text-ink-700">
                  <UserRound size={15} className="shrink-0 text-ink-400" aria-hidden="true" />
                  <dt className="sr-only">Autor</dt>
                  <dd className="min-w-0 truncate">
                    {proposta.autor ? (
                      <>
                        Enviada por{" "}
                        <Link href={`/perfil/${proposta.autor.id}`} className="font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                          {proposta.autor.id === idUsuario ? "você" : proposta.autor.nome}
                        </Link>
                      </>
                    ) : autorTexto ? (
                      <>Enviada por você</>
                    ) : (
                      <span className="text-ink-500">Autor não identificado (proposta anterior à identificação de autoria)</span>
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-[13.5px] text-ink-700">{situacao.dica}</p>
            </div>

            {/* ações principais */}
            {pendente && (papel === "dono" || papel === "autor") && (
              <div className="flex flex-wrap gap-2 border-t border-ink-100 px-5 py-4 sm:px-7">
                {papel === "dono" && (
                  <>
                    <button
                      type="button"
                      onClick={() => decidirProposta(true)}
                      disabled={processando !== null || contraEmAberto}
                      title={contraEmAberto ? "Aguarde a resposta da contraproposta" : undefined}
                      className={`${cls.btnPrimario} !text-[13px]`}
                    >
                      {processando === "proposta" ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                      Aceitar proposta
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormContra("nova")}
                      disabled={processando !== null || contraEmAberto || formContra !== null}
                      title={contraEmAberto ? "Já há uma contraproposta aguardando resposta" : undefined}
                      className={`${cls.btnSecundario} !text-[13px]`}
                    >
                      <Reply size={15} aria-hidden="true" /> Fazer contraproposta
                    </button>
                    <button type="button" onClick={() => decidirProposta(false)} disabled={processando !== null} className={`${cls.btnPerigo} !text-[13px]`}>
                      <X size={15} aria-hidden="true" /> Recusar
                    </button>
                    {proposta.projetoId != null && (
                      <Link
                        href={`/contratos?projetoId=${proposta.projetoId}&propostaId=${proposta.idProposta}`}
                        className={`${cls.btnContorno} !text-[13px]`}
                      >
                        <FileSignature size={15} aria-hidden="true" /> Formalizar contrato
                      </Link>
                    )}
                  </>
                )}
                {papel === "autor" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditandoProposta((v) => !v)}
                      disabled={processando !== null || contraEmAberto}
                      title={contraEmAberto ? "Responda a contraproposta antes de editar" : undefined}
                      className={`${cls.btnSecundario} !text-[13px]`}
                    >
                      <Pencil size={15} aria-hidden="true" /> {editandoProposta ? "Fechar edição" : "Editar proposta"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarProposta}
                      disabled={processando !== null || contraEmAberto}
                      title={contraEmAberto ? "Responda a contraproposta antes de cancelar" : undefined}
                      className={`${cls.btnPerigo} !text-[13px]`}
                    >
                      <Trash2 size={15} aria-hidden="true" /> Cancelar proposta
                    </button>
                  </>
                )}
                {contraEmAberto && (
                  <p className="basis-full text-[12.5px] text-ink-500">
                    {papel === "dono"
                      ? "Enquanto a contraproposta não for respondida, a proposta não pode ser aceita e o autor não pode alterá-la."
                      : "Enquanto houver contraproposta pendente, a proposta não pode ser editada nem cancelada."}
                  </p>
                )}
              </div>
            )}

            {editandoProposta && papel === "autor" && (
              <div className="border-t border-ink-100 px-5 pb-5 sm:px-7">
                <FormValorDescricao
                  idPrefixo="editar-proposta"
                  descricaoInicial={proposta.descricaoProposta}
                  valorInicial={proposta.valorProposta}
                  placeholder="Descreva sua proposta..."
                  rotuloEnviar="Salvar alterações"
                  onEnviar={salvarEdicaoProposta}
                  onCancelar={() => setEditandoProposta(false)}
                />
              </div>
            )}
          </section>

          {formContra && papel === "dono" && (
            <section className={`${cls.composer} mt-2`} aria-labelledby="titulo-form-contra">
              <h2 id="titulo-form-contra" className={cls.h2}>
                {formContra === "nova" ? "Nova contraproposta" : "Editar contraproposta"}
              </h2>
              <p className={`${cls.textoSuave} mt-1`}>Informe o valor e as condições que você propõe. O autor poderá aceitar ou rejeitar.</p>
              <FormValorDescricao
                key={formContra === "nova" ? "nova" : formContra.idContraProposta}
                idPrefixo="contra"
                descricaoInicial={formContra === "nova" ? "" : formContra.descricaoContraProposta}
                valorInicial={formContra === "nova" ? proposta.valorProposta : formContra.valorContraProposta}
                placeholder="Ex.: aceito o aporte com participação de 10% e prazo de 24 meses..."
                rotuloEnviar={formContra === "nova" ? "Enviar contraproposta" : "Salvar alterações"}
                onEnviar={salvarContra}
                onCancelar={() => setFormContra(null)}
              />
            </section>
          )}

          {/* ------------------------------------------------------------ histórico */}
          <section className="mt-2" aria-labelledby="titulo-historico">
            <h2 id="titulo-historico" className={cls.eyebrow}>
              <HandCoins size={14} aria-hidden="true" /> Histórico da negociação
            </h2>
            {erroContras && (
              <Alerta className="mt-3" onTentarNovamente={carregar}>
                {erroContras}
              </Alerta>
            )}
            <ol className="relative mt-4 space-y-4 border-l-2 border-ink-100 pl-6">
              <EventoHistorico
                icone={Send}
                cor="bg-brand-600 text-white"
                titulo={`Proposta enviada${proposta.autor ? ` por ${proposta.autor.id === idUsuario ? "você" : proposta.autor.nome}` : ""}`}
                valor={proposta.valorProposta}
                texto={proposta.descricaoProposta}
              />
              {contras.map((cp) => {
                const st = statusContra(cp);
                const minha = cp.usuarioId != null && cp.usuarioId === idUsuario;
                const possoDecidir = papel === "autor" && idsRecebidas.has(cp.idContraProposta) && st === "PENDENTE" && pendente;
                const ocupado = processando === `cp-${cp.idContraProposta}`;
                return (
                  <EventoHistorico
                    key={cp.idContraProposta}
                    icone={Reply}
                    cor={st === "ACEITA" ? "bg-emerald-600 text-white" : st === "REJEITADA" ? "bg-red-500 text-white" : "bg-amber-400 text-white"}
                    titulo={`Contraproposta de ${minha ? "você" : cp.usuarioNome || "criador do projeto"}`}
                    status={st}
                    valor={cp.valorContraProposta}
                    texto={cp.descricaoContraProposta}
                    data={cp.dataCriacao}
                    rodape={
                      cp.dataDecisao
                        ? `${st === "ACEITA" ? "Aceita" : "Rejeitada"} em ${formatarDataHora(cp.dataDecisao)}${
                            st === "REJEITADA" ? " — a justificativa foi enviada por notificação ao criador do projeto" : ""
                          }`
                        : undefined
                    }
                  >
                    {(possoDecidir || (minha && st === "PENDENTE" && pendente)) && (
                      <div className="mt-3 flex flex-wrap gap-2">
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
                        {minha && st === "PENDENTE" && pendente && (
                          <>
                            <button type="button" onClick={() => setFormContra(cp)} disabled={processando !== null} className={`${cls.btnContorno} !px-3 !text-[13px]`}>
                              <Pencil size={14} aria-hidden="true" /> Editar
                            </button>
                            <button type="button" onClick={() => excluirContra(cp)} disabled={processando !== null} className={`${cls.btnPerigo} !px-3 !text-[13px]`}>
                              <Trash2 size={14} aria-hidden="true" /> Retirar
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </EventoHistorico>
                );
              })}
              {!pendente && (
                <EventoHistorico
                  icone={proposta.statusProposta === "ACEITA" ? CircleCheck : CircleX}
                  cor={proposta.statusProposta === "ACEITA" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}
                  titulo={proposta.statusProposta === "ACEITA" ? "Proposta aceita pelo criador do projeto" : "Proposta recusada pelo criador do projeto"}
                  texto={
                    proposta.statusProposta === "ACEITA"
                      ? "O autor foi vinculado como sócio e o valor foi somado ao arrecadado do projeto."
                      : "A negociação foi encerrada."
                  }
                />
              )}
              {pendente && contras.length === 0 && (
                <li className="text-[13px] text-ink-500">
                  {papel === "dono" ? "Ainda sem resposta: aceite, recuse ou faça uma contraproposta." : "Aguardando a primeira resposta do criador do projeto."}
                </li>
              )}
            </ol>
          </section>
        </>
      ) : null}

      <Modal
        aberto={!!rejeitando}
        titulo="Rejeitar contraproposta"
        descricao="Explique o motivo. A justificativa é enviada ao criador do projeto, que poderá fazer outra contraproposta."
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
            maxLength={JUSTIFICATIVA_MAX}
            rows={4}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Ex.: o valor está acima do que posso investir agora."
            className={`${cls.input} resize-y`}
          />
          <p className="mt-1 text-right text-[12px] text-ink-400">
            {justificativa.length}/{JUSTIFICATIVA_MAX}
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={() => setRejeitando(null)} disabled={processando !== null} className={cls.btnSecundario}>
              Voltar
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

function EventoHistorico({
  icone: Icone,
  cor,
  titulo,
  status,
  valor,
  texto,
  data,
  rodape,
  children,
}: {
  icone: typeof Send;
  cor: string;
  titulo: string;
  status?: string;
  valor?: number | null;
  texto?: string;
  data?: string | null;
  rodape?: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="relative">
      <span className={`absolute -left-[2.15rem] top-0.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${cor}`} aria-hidden="true">
        <Icone size={14} />
      </span>
      <div className={`${cls.card} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-bold text-ink-900">{titulo}</p>
          <div className="flex flex-wrap items-center gap-2">
            {valor !== undefined && <span className="text-[14px] font-extrabold text-ink-900">{formatarMoeda(valor)}</span>}
            {status && <ChipStatusNegociacao status={status} />}
          </div>
        </div>
        {data && <p className="mt-0.5 text-[12px] text-ink-400">{formatarDataHora(data)}</p>}
        {texto && <p className={`${cls.texto} mt-2 whitespace-pre-line break-words !text-[14px]`}>{texto}</p>}
        {rodape && <p className="mt-2 text-[12.5px] text-ink-500">{rodape}</p>}
        {children}
      </div>
    </li>
  );
}
