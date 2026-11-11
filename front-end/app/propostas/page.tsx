"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, Check, ChevronRight, HandCoins, Loader2, Pencil, Plus, Reply, Trash2, X } from "lucide-react";

import PageShell from "../components/PageShell";
import Paginacao from "../components/ui/Paginacao";
import { usePaginacao } from "../hook/usePaginacao";
import EmptyState from "../components/EmptyState";
import FormValorDescricao from "../components/FormValorDescricao";
import SearchBar from "../components/SearchBar";
import { CardGridSkeleton } from "../components/Skeleton";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { ChipStatusNegociacao } from "../components/projeto/ChipsNegociacao";
import { useAuth } from "../context/AuthContext";
import { ApiError, mensagemErro } from "../lib/api";
import { formatarDataHora } from "../lib/date";
import { formatarMoeda } from "../lib/validacao";
import { Proposta } from "../types/Proposta";
import { ContraProposta } from "../types/ContraProposta";
import { Projeto } from "../types/Projeto";
import {
  aceitarProposta,
  atualizarProposta,
  criarProposta,
  esquecerPropostaEnviada,
  excluirProposta,
  idsPropostasEnviadas,
  listarPropostas,
  recusarProposta,
  registrarPropostaEnviada,
} from "../services/proposta.service";
import { listarContraPropostasCriadas, listarContraPropostasRecebidas } from "../services/contraProposta.service";
import { listarProjetos } from "../services/projeto.service";
import { listarIdsProjetosCriados } from "../services/projetoUsuario.service";

type Aba = "recebidas" | "enviadas" | "contras-recebidas" | "contras-enviadas" | "todas";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "recebidas", rotulo: "Recebidas nos meus projetos" },
  { id: "enviadas", rotulo: "Enviadas por mim" },
  { id: "contras-recebidas", rotulo: "Contrapropostas recebidas" },
  { id: "contras-enviadas", rotulo: "Contrapropostas enviadas" },
  { id: "todas", rotulo: "Todas" },
];

export default function PropostasPage() {
  return (
    <Suspense fallback={null}>
      <PropostasConteudo />
    </Suspense>
  );
}

/**
 * Propostas de investimento/parceria enviadas a projetos.
 *  - Qualquer conta envia (POST /proposta com projetoId); o criador do projeto aceita
 *    (o autor vira SÓCIO e o valor entra no arrecadado), recusa ou faz uma contraproposta.
 *  - O autor edita/exclui enquanto não houver contraproposta pendente.
 *  - PropostaResponseDTO não traz o autor: "Enviadas por mim" usa os IDs registrados neste
 *    navegador ao enviar, e as propostas sobre as quais recebi contraproposta.
 */
function PropostasConteudo() {
  const { isAuthenticated, usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const searchParams = useSearchParams();
  const projetoParam = Number(searchParams.get("projetoId")) || null;
  const idUsuario = usuario?.idUsuario ?? null;

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [meusProjetos, setMeusProjetos] = useState<Set<number>>(new Set());
  const [contrasRecebidas, setContrasRecebidas] = useState<ContraProposta[]>([]);
  const [contrasEnviadas, setContrasEnviadas] = useState<ContraProposta[]>([]);
  const [enviadasLocais, setEnviadasLocais] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const abaParam = searchParams.get("aba") as Aba | null;
  const [aba, setAba] = useState<Aba>(
    abaParam && ABAS.some((a) => a.id === abaParam) ? abaParam : projetoParam ? "enviadas" : "recebidas"
  );
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Proposta | null>(null);
  const [projetoForm, setProjetoForm] = useState<number | "">(projetoParam ?? "");
  const [busca, setBusca] = useState("");
  const [processando, setProcessando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!idUsuario) return;
    setLoading(true);
    setErroCarregamento("");
    try {
      const [lista, listaProjetos, meus, cRecebidas, cEnviadas] = await Promise.all([
        listarPropostas({ forcar: true }),
        listarProjetos().catch(() => [] as Projeto[]),
        listarIdsProjetosCriados(idUsuario).catch(() => new Set<number>()),
        listarContraPropostasRecebidas().catch(() => [] as ContraProposta[]),
        listarContraPropostasCriadas().catch(() => [] as ContraProposta[]),
      ]);
      setPropostas([...(lista ?? [])].sort((a, b) => b.idProposta - a.idProposta));
      setProjetos(listaProjetos ?? []);
      setMeusProjetos(meus);
      setContrasRecebidas([...(cRecebidas ?? [])].sort((a, b) => b.idContraProposta - a.idContraProposta));
      setContrasEnviadas([...(cEnviadas ?? [])].sort((a, b) => b.idContraProposta - a.idContraProposta));
      setEnviadasLocais(idsPropostasEnviadas(idUsuario));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as propostas."));
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  // Chegando de "Enviar proposta" na página do projeto: abre o formulário uma vez.
  const abriuPeloParametro = useRef(false);
  useEffect(() => {
    if (!loading && projetoParam && !abriuPeloParametro.current) {
      abriuPeloParametro.current = true;
      setEditando(null);
      setProjetoForm(projetoParam);
      setMostrarForm(true);
    }
  }, [loading, projetoParam]);

  const nomeProjeto = useMemo(() => new Map(projetos.map((p) => [p.idProjeto, p.nomeProjeto])), [projetos]);
  // Projetos que podem receber proposta minha: todos, menos os que eu criei.
  const projetosDestino = useMemo(() => projetos.filter((p) => !meusProjetos.has(p.idProjeto)), [projetos, meusProjetos]);
  const minhasEnviadas = useMemo(() => {
    const ids = new Set(enviadasLocais);
    contrasRecebidas.forEach((c) => ids.add(c.propostaId));
    return ids;
  }, [enviadasLocais, contrasRecebidas]);

  const propostasDaAba = useMemo(() => {
    if (aba === "recebidas") return propostas.filter((p) => p.projetoId != null && meusProjetos.has(p.projetoId));
    if (aba === "enviadas") return propostas.filter((p) => minhasEnviadas.has(p.idProposta));
    return propostas;
  }, [aba, propostas, meusProjetos, minhasEnviadas]);

  const termo = busca.trim().toLowerCase();
  const propostasVisiveis = useMemo(
    () =>
      termo
        ? propostasDaAba.filter((p) =>
            `${p.idProposta} ${p.descricaoProposta} ${p.projetoId ? nomeProjeto.get(p.projetoId) ?? "" : ""}`.toLowerCase().includes(termo)
          )
        : propostasDaAba,
    [propostasDaAba, termo, nomeProjeto]
  );
  const contrasDaAba = aba === "contras-recebidas" ? contrasRecebidas : contrasEnviadas;
  const contrasVisiveis = useMemo(
    () =>
      termo
        ? contrasDaAba.filter((c) => `${c.propostaId} ${c.descricaoContraProposta} ${c.usuarioNome ?? ""}`.toLowerCase().includes(termo))
        : contrasDaAba,
    [contrasDaAba, termo]
  );
  const ehAbaContra = aba === "contras-recebidas" || aba === "contras-enviadas";
  const paginacao = usePaginacao<Proposta>(propostasVisiveis, { tamanhoInicial: 10, chaveReinicio: `${aba}|${busca}` });
  const paginacaoContras = usePaginacao<ContraProposta>(contrasVisiveis, { tamanhoInicial: 10, chaveReinicio: `${aba}|${busca}` });

  async function salvar(descricao: string, valor: number | null) {
    if (!idUsuario) return;
    const projetoId = editando ? editando.projetoId ?? (projetoForm || null) : projetoForm || null;
    if (!projetoId) throw new ApiError(400, { message: "Selecione o projeto que vai receber a proposta." }, "");
    const payload = { descricaoProposta: descricao, valorProposta: valor, projetoId: Number(projetoId) };
    if (editando) {
      await atualizarProposta(editando.idProposta, payload);
      notificar("Proposta atualizada.", "sucesso");
    } else {
      const criada = await criarProposta(payload);
      if (criada?.idProposta) registrarPropostaEnviada(idUsuario, criada.idProposta);
      notificar("Proposta enviada. O criador do projeto vai analisá-la.", "sucesso");
      setAba("enviadas");
    }
    setMostrarForm(false);
    setEditando(null);
    await carregar();
  }

  async function excluir(proposta: Proposta) {
    const ok = await confirmar(`Excluir a proposta #${proposta.idProposta}?`, { titulo: "Excluir proposta", perigo: true });
    if (!ok || !idUsuario) return;
    try {
      await excluirProposta(proposta.idProposta);
      esquecerPropostaEnviada(idUsuario, proposta.idProposta);
      notificar("Proposta excluída.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a proposta."));
    }
  }

  async function decidir(p: Proposta, aceitar: boolean) {
    const ok = await confirmar(
      aceitar
        ? `Aceitar a proposta #${p.idProposta} (${formatarMoeda(p.valorProposta)})? O autor passa a ser sócio do projeto e o valor é somado ao arrecadado.`
        : `Recusar a proposta #${p.idProposta}?`,
      { titulo: aceitar ? "Aceitar proposta" : "Recusar proposta", confirmarLabel: aceitar ? "Aceitar" : "Recusar", perigo: !aceitar }
    );
    if (!ok) return;
    setProcessando(p.idProposta);
    try {
      const atualizada = aceitar ? await aceitarProposta(p.idProposta) : await recusarProposta(p.idProposta);
      setPropostas((l) => l.map((x) => (x.idProposta === p.idProposta ? { ...x, ...atualizada } : x)));
      notificar(aceitar ? "Proposta aceita." : "Proposta recusada.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível registrar a decisão."));
    } finally {
      setProcessando(null);
    }
  }

  const vazioPorAba: Record<Aba, { t: string; d: string }> = {
    recebidas: {
      t: "Nenhuma proposta recebida",
      d: meusProjetos.size === 0 ? "Crie um projeto para receber propostas de investidores e parceiros." : "Seus projetos ainda não receberam propostas.",
    },
    enviadas: { t: "Nenhuma proposta enviada", d: "Abra um projeto e use “Enviar proposta”, ou clique em “Nova proposta”." },
    "contras-recebidas": { t: "Nenhuma contraproposta recebida", d: "Quando um criador responder sua proposta com outra oferta, ela aparece aqui." },
    "contras-enviadas": { t: "Nenhuma contraproposta enviada", d: "Abra uma proposta recebida em seus projetos para contrapropor." },
    todas: { t: "Nenhuma proposta cadastrada", d: "Ainda não há propostas na plataforma." },
  };

  return (
    <PageShell area="usuario">
      <div className="pb-5 mb-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cls.eyebrow}>Negocie</p>
          <h1 className={cls.h1}>Propostas</h1>
          <p className={`${cls.texto} mt-1.5 max-w-md`}>Envie propostas a projetos, responda as que seus projetos recebem e acompanhe as contrapropostas.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setMostrarForm((v) => !v);
          }}
          aria-expanded={mostrarForm && !editando}
          className={`${cls.btnPrimario} !text-[13px]`}
        >
          <Plus size={15} aria-hidden="true" />
          Nova proposta
        </button>
      </div>

      {mostrarForm && (
        <section className={cls.composer} aria-labelledby="titulo-form-proposta">
          <h2 id="titulo-form-proposta" className={cls.h2}>
            {editando ? `Editar proposta #${editando.idProposta}` : "Nova proposta"}
          </h2>
          {!editando && (
            <div className="mt-4">
              <label htmlFor="proposta-projeto" className={cls.label}>
                Projeto *
              </label>
              <select
                id="proposta-projeto"
                value={projetoForm}
                onChange={(e) => setProjetoForm(e.target.value ? Number(e.target.value) : "")}
                className={`${cls.input} !bg-white`}
              >
                <option value="">{projetosDestino.length === 0 ? "Nenhum projeto disponível" : "Selecione o projeto"}</option>
                {projetosDestino.map((p) => (
                  <option key={p.idProjeto} value={p.idProjeto}>
                    {p.nomeProjeto}
                  </option>
                ))}
              </select>
            </div>
          )}
          <FormValorDescricao
            key={editando?.idProposta ?? "nova"}
            idPrefixo="proposta"
            descricaoInicial={editando?.descricaoProposta}
            valorInicial={editando?.valorProposta}
            placeholder="Descreva sua proposta: valor, contrapartida esperada, prazos..."
            rotuloEnviar={editando ? "Salvar alterações" : "Enviar proposta"}
            onEnviar={salvar}
            onCancelar={() => {
              setMostrarForm(false);
              setEditando(null);
            }}
          />
        </section>
      )}

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Tipo de proposta">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              aba === a.id ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <SearchBar value={busca} onChange={setBusca} onRefresh={carregar} loading={loading} placeholder="Pesquisar propostas..." />

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : erroCarregamento ? null : ehAbaContra ? (
        contrasVisiveis.length === 0 ? (
          <div className={cls.card}>
            <EmptyState icon={Reply} title={busca ? "Nada encontrado" : vazioPorAba[aba].t} description={busca ? "Tente outro termo." : vazioPorAba[aba].d} />
          </div>
        ) : (
          <>
            <ul>
              {paginacaoContras.itens.map((c) => (
                <li key={c.idContraProposta} className={cls.linha}>
                  <Link href={`/propostas/${c.propostaId}`} className="group block">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cls.chip}>Proposta #{c.propostaId}</span>
                      <span className="text-[14px] font-bold text-ink-900">{formatarMoeda(c.valorContraProposta)}</span>
                      <ChipStatusNegociacao status={c.status} />
                    </div>
                    <p className={`${cls.texto} mt-2 line-clamp-3 break-words`}>{c.descricaoContraProposta}</p>
                    <p className="mt-1 text-[12.5px] text-ink-500">
                      {c.usuarioNome ? `Por ${c.usuarioNome}` : "Contraproposta"}
                      {c.dataCriacao && ` · ${formatarDataHora(c.dataCriacao)}`}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 group-hover:underline">
                      {aba === "contras-recebidas" && (c.status ?? "PENDENTE") === "PENDENTE" ? "Responder" : "Ver negociação"}
                      <ChevronRight size={14} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className={`${cls.card} overflow-hidden`}>
              <Paginacao
                pagina={paginacaoContras.pagina}
                totalPaginas={paginacaoContras.totalPaginas}
                total={paginacaoContras.total}
                inicio={paginacaoContras.inicio}
                fim={paginacaoContras.fim}
                tamanho={paginacaoContras.tamanho}
                onPagina={paginacaoContras.irPara}
                onTamanho={paginacaoContras.setTamanho}
                rotulo="contrapropostas"
              />
            </div>
          </>
        )
      ) : propostasVisiveis.length === 0 ? (
        <div className={cls.card}>
          <EmptyState icon={HandCoins} title={busca ? "Nenhuma proposta encontrada" : vazioPorAba[aba].t} description={busca ? "Tente outro termo." : vazioPorAba[aba].d} />
        </div>
      ) : (
        <>
          <ul>
            {paginacao.itens.map((proposta) => {
              const pendente = (proposta.statusProposta ?? "PENDENTE") === "PENDENTE";
              const souDonoDoProjeto = proposta.projetoId != null && meusProjetos.has(proposta.projetoId);
              const souAutor = minhasEnviadas.has(proposta.idProposta);
              return (
                <li key={proposta.idProposta} className={`${cls.linha} flex flex-wrap items-start justify-between gap-3`}>
                  <Link href={`/propostas/${proposta.idProposta}`} className="group min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cls.chip}>#{proposta.idProposta}</span>
                      <span className="text-[14px] font-bold text-ink-900">{formatarMoeda(proposta.valorProposta)}</span>
                      <ChipStatusNegociacao status={proposta.statusProposta} />
                    </div>
                    {proposta.projetoId != null && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-700">
                        <Briefcase size={14} aria-hidden="true" /> {nomeProjeto.get(proposta.projetoId) ?? `Projeto #${proposta.projetoId}`}
                      </p>
                    )}
                    <p className={`${cls.texto} mt-1.5 line-clamp-3 break-words`}>{proposta.descricaoProposta}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 group-hover:underline">
                      Ver negociação
                      <ChevronRight size={14} aria-hidden="true" />
                    </span>
                  </Link>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {souDonoDoProjeto && pendente && (
                      <>
                        <button
                          type="button"
                          onClick={() => decidir(proposta, true)}
                          disabled={processando !== null}
                          className={`${cls.btnPrimario} !px-3 !text-[13px]`}
                        >
                          {processando === proposta.idProposta ? (
                            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Check size={15} aria-hidden="true" />
                          )}
                          Aceitar
                        </button>
                        <button
                          type="button"
                          onClick={() => decidir(proposta, false)}
                          disabled={processando !== null}
                          className={`${cls.btnPerigo} !px-3 !text-[13px]`}
                        >
                          <X size={15} aria-hidden="true" /> Recusar
                        </button>
                      </>
                    )}
                    {souAutor && pendente && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(proposta);
                            setMostrarForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={cls.btnIcone}
                          aria-label={`Editar proposta ${proposta.idProposta}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => excluir(proposta)} className={cls.btnIconePerigo} aria-label={`Excluir proposta ${proposta.idProposta}`}>
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={`${cls.card} overflow-hidden`}>
            <Paginacao
              pagina={paginacao.pagina}
              totalPaginas={paginacao.totalPaginas}
              total={paginacao.total}
              inicio={paginacao.inicio}
              fim={paginacao.fim}
              tamanho={paginacao.tamanho}
              onPagina={(p) => {
                paginacao.irPara(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onTamanho={paginacao.setTamanho}
              rotulo="propostas"
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
