"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, Plus, Calendar, ChevronRight } from "lucide-react";

import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import FormProjeto from "../components/FormProjeto";
import ImagemRemota from "../components/ImagemRemota";
import SearchBar from "../components/SearchBar";
import { CardGridSkeleton } from "../components/Skeleton";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { useAuth } from "../context/AuthContext";
import { mensagemErro } from "../lib/api";
import { Projeto, ProjetoRequest } from "../types/Projeto";
import { TipoProjeto } from "../types/TipoProjeto";
import { TIPO_VINCULO_ID } from "../types/ProjetoUsuario";
import { listarProjetos, criarProjeto, buscarProjetos, substituirImagensProjeto } from "../services/projeto.service";
import { apiDateToInput } from "../lib/date";
import { listarTiposProjeto } from "../services/tipoProjeto.service";
import { listarIdsProjetosCriados, vincularUsuario } from "../services/projetoUsuario.service";

type Filtro = "todos" | "meus";

/** Lista e criação de projetos (usuários comuns; o administrador usa /admin/projetos). */
export default function ProjetosPage() {
  const { isAuthenticated, usuario, isAdmin } = useAuth();
  const { notificar } = useFeedback();
  const router = useRouter();
  const idUsuario = usuario?.idUsuario;

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tipos, setTipos] = useState<TipoProjeto[]>([]);
  const [meus, setMeus] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  // Resultado de GET /projeto/buscar (null = sem filtro ativo: mostra a listagem completa).
  const [resultadoBusca, setResultadoBusca] = useState<Projeto[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");

  const carregar = useCallback(async () => {
    if (!idUsuario) return;
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaProjetos, listaTipos, idsMeus] = await Promise.all([
        listarProjetos(),
        listarTiposProjeto().catch(() => [] as TipoProjeto[]),
        listarIdsProjetosCriados(idUsuario).catch(() => new Set<number>()),
      ]);
      setProjetos([...(listaProjetos ?? [])].sort((a, b) => b.idProjeto - a.idProjeto));
      setTipos(listaTipos ?? []);
      setMeus(idsMeus);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os projetos."));
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) carregar();
  }, [isAuthenticated, isAdmin, carregar]);

  // Busca no servidor (nome OU descrição + intervalo da data de início), com espera curta
  // enquanto a pessoa digita. O backend combina os filtros com E, então o termo é buscado
  // em duas chamadas (nome e descrição) e os resultados são unidos.
  const filtroAtivo = !!(busca.trim() || dataDe || dataAte);
  useEffect(() => {
    if (!filtroAtivo) return;
    let cancelado = false;
    const timer = window.setTimeout(async () => {
      setBuscando(true);
      setErroBusca("");
      const termo = busca.trim();
      const datas = { dataInicioDe: dataDe || undefined, dataInicioAte: dataDe && dataAte ? dataAte : undefined };
      try {
        const listas = termo
          ? await Promise.all([buscarProjetos({ ...datas, nome: termo }), buscarProjetos({ ...datas, descricao: termo })])
          : [await buscarProjetos(datas)];
        const unidos = new Map<number, Projeto>();
        listas.flat().forEach((p) => unidos.set(p.idProjeto, p));
        // "Até" sem "De" não é aplicado pelo backend: completamos no cliente.
        const filtrados = [...unidos.values()].filter((p) => {
          const inicio = apiDateToInput(p.dataInicioProjeto);
          return (!dataDe || inicio >= dataDe) && (!dataAte || inicio <= dataAte);
        });
        if (!cancelado) setResultadoBusca(filtrados.sort((a, b) => b.idProjeto - a.idProjeto));
      } catch (error) {
        if (!cancelado) setErroBusca(mensagemErro(error, "Não foi possível pesquisar os projetos."));
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 350);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [filtroAtivo, busca, dataDe, dataAte]);

  const tipoMap = useMemo(() => new Map(tipos.map((t) => [t.idTipoProjeto, t.nomeTipoProjeto])), [tipos]);

  const visiveis = useMemo(() => {
    const base = filtroAtivo && resultadoBusca ? resultadoBusca : projetos;
    return base.filter((p) => filtro === "todos" || meus.has(p.idProjeto));
  }, [projetos, resultadoBusca, filtroAtivo, filtro, meus]);

  function limparFiltros() {
    setBusca("");
    setDataDe("");
    setDataAte("");
    setResultadoBusca(null);
    setErroBusca("");
  }

  async function publicarProjeto(dados: ProjetoRequest, arquivos: File[]) {
    if (!usuario) return;
    const criado = await criarProjeto(dados);
    // O backend não associa o projeto ao autor automaticamente: registramos o
    // vínculo CRIADOR, que é o que identifica o dono do projeto.
    let vinculado = false;
    try {
      await vincularUsuario({
        projetoId: criado.idProjeto,
        usuarioId: usuario.idUsuario,
        tipoVinculoId: TIPO_VINCULO_ID.CRIADOR,
      });
      vinculado = true;
    } catch (error) {
      notificar(
        `Projeto criado, mas não foi possível registrar você como criador: ${mensagemErro(error)}`,
        "erro"
      );
    }
    // PUT /projeto/{id}/imagens só é aceito para quem está vinculado ao projeto.
    if (arquivos.length > 0 && vinculado) {
      try {
        await substituirImagensProjeto(criado.idProjeto, arquivos);
        notificar("Projeto publicado.", "sucesso");
      } catch (error) {
        notificar(`Projeto publicado, mas as imagens não foram salvas: ${mensagemErro(error)} Adicione-as na página do projeto.`, "erro");
      }
    } else if (vinculado) {
      notificar("Projeto publicado.", "sucesso");
    }
    setMostrarForm(false);
    router.push(`/projetos/${criado.idProjeto}`);
  }

  return (
    <PageShell area="usuario">
      <div className="pb-5 mb-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cls.eyebrow}>Construir</p>
          <h1 className={cls.h1}>Projetos</h1>
          <p className={`${cls.texto} mt-1.5 max-w-md`}>Publique projetos e encontre profissionais para colocá-los em prática.</p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          aria-expanded={mostrarForm}
          className={`${cls.btnPrimario} !text-[13px]`}
        >
          <Plus size={15} aria-hidden="true" />
          Novo projeto
        </button>
      </div>

      {mostrarForm && (
        <section className={cls.composer} aria-labelledby="titulo-novo-projeto">
          <h2 id="titulo-novo-projeto" className={cls.h2}>
            Novo projeto
          </h2>
          <p className={`${cls.textoSuave} mt-1`}>Preencha os dados abaixo para publicar um novo projeto.</p>
          <FormProjeto
            tipos={tipos}
            rotuloEnviar="Publicar projeto"
            onEnviar={publicarProjeto}
            onCancelar={() => setMostrarForm(false)}
          />
        </section>
      )}

      <SearchBar
        value={busca}
        onChange={setBusca}
        onRefresh={carregar}
        loading={loading || buscando}
        placeholder="Pesquisar projetos por nome ou descrição..."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filtro-data-de" className={cls.label}>
            Início a partir de
          </label>
          <input id="filtro-data-de" type="date" value={dataDe} max={dataAte || undefined} onChange={(e) => setDataDe(e.target.value)} className={`${cls.input} !w-auto !py-2 !text-[13px]`} />
        </div>
        <div>
          <label htmlFor="filtro-data-ate" className={cls.label}>
            Início até
          </label>
          <input id="filtro-data-ate" type="date" value={dataAte} min={dataDe || undefined} onChange={(e) => setDataAte(e.target.value)} className={`${cls.input} !w-auto !py-2 !text-[13px]`} />
        </div>
        {filtroAtivo && (
          <button type="button" onClick={limparFiltros} className={`${cls.btnContorno} !py-2 !text-[13px]`}>
            Limpar filtros
          </button>
        )}
      </div>

      {erroBusca && filtroAtivo && <Alerta>{erroBusca}</Alerta>}

      <div role="tablist" aria-label="Filtrar projetos" className="flex gap-2">
        {(
          [
            { id: "todos", rotulo: `Todos (${projetos.length})` },
            { id: "meus", rotulo: `Meus projetos (${meus.size})` },
          ] as const
        ).map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filtro === id}
            onClick={() => setFiltro(id)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              filtro === id ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {erroCarregamento && !loading && (
        <Alerta titulo="Erro ao carregar os projetos" onTentarNovamente={carregar}>
          {erroCarregamento}
        </Alerta>
      )}

      {loading || (filtroAtivo && buscando && !resultadoBusca) ? (
        <CardGridSkeleton count={4} />
      ) : erroCarregamento ? null : visiveis.length === 0 ? (
        <div className={cls.card}>
          <EmptyState
            icon={Briefcase}
            title={
              filtroAtivo ? "Nenhum projeto encontrado" : filtro === "meus" ? "Você ainda não criou projetos" : "Nenhum projeto publicado ainda"
            }
            description={filtroAtivo ? "Tente outro termo ou período." : "Use o botão “Novo projeto” para publicar o primeiro."}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visiveis.map((projeto) => (
            <Link
              key={projeto.idProjeto}
              href={`/projetos/${projeto.idProjeto}`}
              className={`${cls.card} hover:border-brand-300 hover:shadow-[0_4px_12px_-6px_rgba(21,15,40,0.14)] group flex flex-col overflow-hidden`}
            >
              <div className="relative h-32 w-full bg-brand-gradient-soft">
                <ImagemRemota url={projeto.urlImagemProjeto} alt="" />
                <span className={`${projeto.active ? cls.chipAtivo : cls.chipInativo} absolute right-3 top-3 shadow-soft`}>
                  {projeto.active ? "Ativo" : "Inativo"}
                </span>
                {meus.has(projeto.idProjeto) && (
                  <span className={`${cls.chip} absolute left-3 top-3 shadow-soft`}>Seu projeto</span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <span className={`${cls.chip} w-fit`}>{tipoMap.get(projeto.tipoProjetoId) || "Projeto"}</span>
                <h3 className="font-display mt-3 text-[15.5px] font-bold text-ink-900 group-hover:text-brand-700 break-words">
                  {projeto.nomeProjeto}
                </h3>
                <p className={`${cls.texto} mt-1.5 line-clamp-3 break-words`}>{projeto.descricaoProjeto}</p>
                <div className="text-[0.8125rem] text-ink-500 mt-4 flex items-center gap-1.5">
                  <Calendar size={13} aria-hidden="true" />
                  {projeto.dataInicioProjeto} — {projeto.dataFimProjeto}
                </div>
                <div className="border-t border-ink-100 mt-auto flex items-center justify-between pt-3.5 text-[13.5px] font-semibold text-brand-700">
                  Ver detalhes
                  <ChevronRight size={15} aria-hidden="true" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
