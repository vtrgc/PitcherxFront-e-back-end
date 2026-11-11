"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileSignature, Plus, Pencil, Trash2, Briefcase, ChevronRight, Check, Loader2 } from "lucide-react";

import PageShell from "../components/PageShell";
import Paginacao from "../components/ui/Paginacao";
import { usePaginacao } from "../hook/usePaginacao";
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
import { listarContratos, criarContrato, atualizarContrato, excluirContrato, aceitarContrato } from "../services/contrato.service";
import { idsPropostasEnviadas, listarPropostas } from "../services/proposta.service";
import { Proposta } from "../types/Proposta";
import { ChipStatusNegociacao } from "../components/projeto/ChipsNegociacao";
import { listarProjetos } from "../services/projeto.service";
import { listarIdsProjetosCriados, listarIdsProjetosParte } from "../services/projetoUsuario.service";
import { listarTermosDoContrato } from "../services/termo.service";

export default function ContratosPage() {
  return (
    <Suspense fallback={null}>
      <ContratosPageContent />
    </Suspense>
  );
}

/**
 * Contratos — registro formal de autoria dos projetos (base do verificador antiplágio).
 *
 * O `GET /contrato` do backend devolve TODOS os contratos para qualquer conta autenticada.
 * A interface restringe a exibição: o administrador vê todos; os demais usuários veem apenas
 * contratos de projetos em que são PARTE (criador, sócio ou investidor — ver
 * `VINCULOS_PARTE_CONTRATO`). Se não for possível confirmar os vínculos, nada é exibido.
 * Criar/editar/excluir continua restrito ao CRIADOR do projeto (ou ao admin).
 */
function ContratosPageContent() {
  const { isAuthenticated, isAdmin, usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const searchParams = useSearchParams();
  const projetoIdParam = Number(searchParams.get("projetoId")) || undefined;
  const propostaIdParam = Number(searchParams.get("propostaId")) || undefined;
  const idUsuario = usuario?.idUsuario;

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [meusProjetos, setMeusProjetos] = useState<Set<number>>(new Set());
  // Projetos em que sou parte (criador, sócio ou investidor): define o que posso VER.
  const [projetosParte, setProjetosParte] = useState<Set<number>>(new Set());
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [aceitando, setAceitando] = useState<number | null>(null);
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
      // Sem a lista de vínculos não há como saber o que o usuário pode ver: a falha
      // interrompe a carga (nada de "mostrar tudo" por engano).
      const [listaContratos, listaProjetos, meus, parte, listaPropostas] = await Promise.all([
        listarContratos(),
        listarProjetos().catch(() => [] as Projeto[]),
        isAdmin ? Promise.resolve(new Set<number>()) : listarIdsProjetosCriados(idUsuario),
        isAdmin ? Promise.resolve(new Set<number>()) : listarIdsProjetosParte(idUsuario),
        listarPropostas().catch(() => [] as Proposta[]),
      ]);
      // Projetos para os quais enviei proposta: o contrato que a formaliza também é meu para aceitar.
      const enviadas = idsPropostasEnviadas(idUsuario);
      const comMinhaProposta = new Set(
        (listaPropostas ?? []).filter((p) => enviadas.has(p.idProposta) && p.projetoId != null).map((p) => p.projetoId as number)
      );
      const visiveisParaMim = (listaContratos ?? []).filter((c) => isAdmin || parte.has(c.projetoId) || comMinhaProposta.has(c.projetoId));
      setPropostas(listaPropostas ?? []);

      setContratos(visiveisParaMim.sort((a, b) => b.idContrato - a.idContrato));
      setProjetos(listaProjetos ?? []);
      setMeusProjetos(meus);
      setProjetosParte(parte);
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
    (projetoId: number) => isAdmin || (!!usuario?.roles?.includes("USUARIO") && meusProjetos.has(projetoId)),
    [isAdmin, meusProjetos, usuario?.roles]
  );
  const projetosDisponiveis = useMemo(
    () => (isAdmin ? projetos : projetos.filter((p) => meusProjetos.has(p.idProjeto))),
    [isAdmin, projetos, meusProjetos]
  );
  // POST/PUT/DELETE /contrato aceitam ADMIN e USUARIO (o backend cita "EMPRESARIO", role
  // inexistente): uma conta somente EMPRESA receberia 403, então não oferecemos a ação.
  const contaPodeGerenciar = isAdmin || !!usuario?.roles?.includes("USUARIO");
  const podeCriar = contaPodeGerenciar && (isAdmin || projetosDisponiveis.length > 0);

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
  const paginacao = usePaginacao(visiveis, { tamanhoInicial: 10, chaveReinicio: busca });

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

  // PUT /contrato/{id}/aceitar aceita ADMIN e USUARIO. Quem aceita é a outra parte (não o criador).
  const podeAceitar = (c: Contrato) =>
    c.statusContrato === "PENDENTE" && (isAdmin || (!!usuario?.roles?.includes("USUARIO") && !meusProjetos.has(c.projetoId)));

  async function aceitar(contrato: Contrato) {
    const ok = await confirmar(
      `Aceitar o contrato "${contrato.tituloContrato}"? O valor da proposta vinculada será somado ao arrecadado do projeto.`,
      { titulo: "Aceitar contrato", confirmarLabel: "Aceitar" }
    );
    if (!ok) return;
    setAceitando(contrato.idContrato);
    try {
      const atualizado = await aceitarContrato(contrato.idContrato);
      setContratos((l) => l.map((c) => (c.idContrato === contrato.idContrato ? { ...c, ...atualizado } : c)));
      notificar("Contrato aceito.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível aceitar o contrato."));
    } finally {
      setAceitando(null);
    }
  }

  async function excluir(contrato: Contrato) {
    // termo.id_contrato não tem cascade: com termos vinculados o servidor recusa (erro 500).
    let termosDoContrato = 0;
    try {
      termosDoContrato = ((await listarTermosDoContrato(contrato.idContrato)) ?? []).length;
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
            {isAdmin
              ? "Todos os contratos da plataforma."
              : "Contratos que formalizam propostas e registram a autoria dos projetos. Você vê os contratos dos projetos em que é parte e daqueles para os quais enviou proposta."}
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
            propostas={propostas}
            propostaInicial={propostaIdParam ?? ""}
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
                : projetosParte.size === 0
                ? "Você ainda não é parte de nenhum projeto. Crie um projeto e, a partir dele, formalize um contrato."
                : "Nenhum contrato registrado nos projetos dos quais você participa."
            }
          />
        </div>
      ) : (
        <>
        <div className="grid gap-5 md:grid-cols-2">
          {paginacao.itens.map((contrato) => {
            const gerenciavel = podeGerenciar(contrato.projetoId);
            return (
              <article key={contrato.idContrato} className={`${cls.card} flex flex-col p-5`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex flex-wrap gap-1.5">
                    {contrato.statusContrato && <ChipStatusNegociacao status={contrato.statusContrato} />}
                    <span className={contrato.active ? cls.chipAtivo : cls.chipInativo}>{contrato.active ? "Ativo" : "Inativo"}</span>
                  </span>
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

                {podeAceitar(contrato) && (
                  <button
                    type="button"
                    onClick={() => aceitar(contrato)}
                    disabled={aceitando !== null}
                    className={`${cls.btnPrimario} mt-4 self-start !text-[13px]`}
                  >
                    {aceitando === contrato.idContrato ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                    Aceitar contrato
                  </button>
                )}

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
            rotulo="contratos"
          />
        </div>
        </>
      )}
    </PageShell>
  );
}
