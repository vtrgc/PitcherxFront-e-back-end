"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileSignature, Plus, Pencil, Trash2, Briefcase, ChevronRight } from "lucide-react";

import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import FormContrato from "../components/FormContrato";
import SearchBar from "../components/SearchBar";
import { CardGridSkeleton } from "../components/Skeleton";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { useAuth } from "../context/AuthContext";
import { ApiError, mensagemErro } from "../lib/api";
import { formatarDataHora } from "../lib/date";
import { Contrato, ContratoRequest } from "../types/Contrato";
import { Projeto } from "../types/Projeto";
import { listarContratos, criarContrato, atualizarContrato, excluirContrato } from "../services/contrato.service";
import { listarProjetos } from "../services/projeto.service";
import { listarIdsProjetosCriados } from "../services/projetoUsuario.service";
import { listarTermos } from "../services/termo.service";

export default function ContratosPage() {
  return (
    <Suspense fallback={null}>
      <ContratosPageContent />
    </Suspense>
  );
}

/**
 * Contratos. O backend permite criar/editar/excluir a ADMIN e USUARIO (a regra cita
 * "EMPRESARIO", role que não existe — contas só EMPRESA recebem 403). Na interface,
 * usuários gerenciam apenas contratos de projetos em que são CRIADOR; o admin, todos.
 */
function ContratosPageContent() {
  const { isAuthenticated, isAdmin, usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const searchParams = useSearchParams();
  const projetoIdParam = Number(searchParams.get("projetoId")) || undefined;
  const idUsuario = usuario?.idUsuario;

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [meusProjetos, setMeusProjetos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Contrato | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    if (!idUsuario) return;
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaContratos, listaProjetos, meus] = await Promise.all([
        listarContratos(),
        listarProjetos().catch(() => [] as Projeto[]),
        isAdmin ? Promise.resolve(new Set<number>()) : listarIdsProjetosCriados(idUsuario).catch(() => new Set<number>()),
      ]);
      setContratos([...(listaContratos ?? [])].sort((a, b) => b.idContrato - a.idContrato));
      setProjetos(listaProjetos ?? []);
      setMeusProjetos(meus);
    } catch (error) {
      setErroCarregamento(
        error instanceof ApiError && error.status === 403
          ? "Sua conta não tem permissão para acessar contratos."
          : mensagemErro(error, "Não foi possível carregar os contratos.")
      );
    } finally {
      setLoading(false);
    }
  }, [idUsuario, isAdmin]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const podeGerenciar = useCallback(
    (projetoId: number) => isAdmin || meusProjetos.has(projetoId),
    [isAdmin, meusProjetos]
  );
  const projetosDisponiveis = useMemo(
    () => (isAdmin ? projetos : projetos.filter((p) => meusProjetos.has(p.idProjeto))),
    [isAdmin, projetos, meusProjetos]
  );
  const podeCriar = isAdmin || projetosDisponiveis.length > 0;

  // Chegando de "Novo contrato" na página do projeto: abre o formulário uma única vez.
  const abriuPeloParametro = useRef(false);
  useEffect(() => {
    if (!loading && !abriuPeloParametro.current && projetoIdParam && podeGerenciar(projetoIdParam)) {
      abriuPeloParametro.current = true;
      setEditando(null);
      setMostrarForm(true);
    }
  }, [loading, projetoIdParam, podeGerenciar]);

  const projetoMap = useMemo(() => new Map(projetos.map((p) => [p.idProjeto, p.nomeProjeto])), [projetos]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return contratos;
    return contratos.filter((c) =>
      `${c.tituloContrato} ${c.descricaoContrato} ${projetoMap.get(c.projetoId) ?? ""}`.toLowerCase().includes(termo)
    );
  }, [contratos, busca, projetoMap]);

  async function salvar(dados: ContratoRequest) {
    if (editando) {
      await atualizarContrato(editando.idContrato, dados);
      notificar("Contrato atualizado.", "sucesso");
    } else {
      await criarContrato(dados);
      notificar("Contrato criado.", "sucesso");
    }
    setMostrarForm(false);
    setEditando(null);
    await carregar();
  }

  async function excluir(contrato: Contrato) {
    // termo.id_contrato não tem cascade: com termos vinculados o servidor recusa (erro 500).
    let termosDoContrato = 0;
    try {
      termosDoContrato = ((await listarTermos()) ?? []).filter((t) => t.contratoId === contrato.idContrato).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar os termos deste contrato. Tente novamente."));
      return;
    }
    if (termosDoContrato > 0) {
      notificar(
        `Este contrato tem ${termosDoContrato} termo${termosDoContrato === 1 ? "" : "s"} vinculado${termosDoContrato === 1 ? "" : "s"}. ${
          isAdmin ? "Exclua os termos (Admin → Termos) antes de excluir o contrato." : "Peça a um administrador para remover os termos antes de excluir o contrato."
        }`
      );
      return;
    }
    const ok = await confirmar(`Excluir o contrato "${contrato.tituloContrato}"? Essa ação não pode ser desfeita.`, {
      titulo: "Excluir contrato",
      perigo: true,
    });
    if (!ok) return;
    try {
      await excluirContrato(contrato.idContrato);
      notificar("Contrato excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(
        mensagemErro(error, "Não foi possível excluir o contrato. Verifique se ele não tem termos vinculados.")
      );
    }
  }

  return (
    <PageShell>
      <div className="pb-5 mb-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cls.eyebrow}>Formalize</p>
          <h1 className={cls.h1}>Contratos</h1>
          <p className={`${cls.texto} mt-1.5 max-w-md`}>
            {isAdmin ? "Todos os contratos da plataforma." : "Formalize contratos a partir dos projetos que você criou."}
          </p>
        </div>

        {podeCriar && !loading && (
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
            Novo contrato
          </button>
        )}
      </div>

      {mostrarForm && (
        <section className={cls.composer} aria-labelledby="titulo-form-contrato">
          <h2 id="titulo-form-contrato" className={cls.h2}>
            {editando ? "Editar contrato" : "Novo contrato"}
          </h2>
          <FormContrato
            key={editando?.idContrato ?? "novo"}
            contrato={editando}
            projetos={projetosDisponiveis}
            projetoInicial={projetoIdParam && podeGerenciar(projetoIdParam) ? projetoIdParam : ""}
            onEnviar={salvar}
            onCancelar={() => {
              setMostrarForm(false);
              setEditando(null);
            }}
          />
        </section>
      )}

      <SearchBar value={busca} onChange={setBusca} onRefresh={carregar} loading={loading} placeholder="Pesquisar contratos..." />

      {erroCarregamento && !loading && (
        <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>
      )}

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : erroCarregamento ? null : visiveis.length === 0 ? (
        <div className={cls.card}>
          <EmptyState
            icon={FileSignature}
            title={busca ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}
            description={
              busca
                ? "Tente outro termo."
                : isAdmin
                ? "Ainda não há contratos na plataforma."
                : "Crie um projeto e, a partir dele, formalize um contrato."
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visiveis.map((contrato) => {
            const gerenciavel = podeGerenciar(contrato.projetoId);
            return (
              <article key={contrato.idContrato} className={`${cls.card} flex flex-col p-5`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={contrato.active ? cls.chipAtivo : cls.chipInativo}>{contrato.active ? "Ativo" : "Inativo"}</span>
                  {gerenciavel && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(contrato);
                          setMostrarForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cls.btnIcone}
                        aria-label={`Editar contrato ${contrato.tituloContrato}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(contrato)}
                        className={cls.btnIconePerigo}
                        aria-label={`Excluir contrato ${contrato.tituloContrato}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-display mt-3 text-[15.5px] font-bold text-ink-900 break-words">{contrato.tituloContrato}</h3>
                <p className={`${cls.texto} mt-1.5 line-clamp-3 break-words`}>{contrato.descricaoContrato}</p>
                <p className="text-[0.8125rem] text-ink-500 mt-3">
                  {formatarDataHora(contrato.dataInicioContrato)} — {formatarDataHora(contrato.dataFimContrato)}
                </p>

                <Link
                  href={`/projetos/${contrato.projetoId}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-700 hover:text-brand-700"
                >
                  <Briefcase size={15} aria-hidden="true" />
                  {projetoMap.get(contrato.projetoId) || `Projeto #${contrato.projetoId}`}
                </Link>

                <div className="mt-auto pt-4">
                  <Link
                    href={`/contratos/${contrato.idContrato}`}
                    className="flex items-center justify-between border-t border-ink-100 pt-3.5 text-[13.5px] font-semibold text-brand-700"
                  >
                    Ver detalhes do contrato
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
