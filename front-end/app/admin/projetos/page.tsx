"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Trash2, ChevronDown, ExternalLink, Users2 } from "lucide-react";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { ListaAdmin } from "../../components/admin/ListaAdmin";
import Paginacao from "../../components/admin/Paginacao";
import { cls } from "../../components/ui/estilos";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { formatarData } from "../../lib/date";
import ImagemRemota from "../../components/ImagemRemota";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { Projeto } from "../../types/Projeto";
import { TipoProjeto } from "../../types/TipoProjeto";
import { ProjetoUsuario } from "../../types/ProjetoUsuario";
import { listarProjetos, excluirProjeto } from "../../services/projeto.service";
import { listarContratos } from "../../services/contrato.service";
import { listarTiposProjeto } from "../../services/tipoProjeto.service";
import { listarPorProjeto } from "../../services/projetoUsuario.service";

export default function AdminProjetosPage() {
  const { pronto } = useRequireAdmin();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tipos, setTipos] = useState<TipoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [filtroTipo, setFiltroTipo] = useState<number | "todos">("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");

  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const { notificar, confirmar } = useFeedback();
  const [vinculos, setVinculos] = useState<Record<number, ProjetoUsuario[] | "carregando" | "erro">>({});

  async function carregar() {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaProjetos, listaTipos] = await Promise.all([listarProjetos(), listarTiposProjeto().catch(() => [])]);
      setProjetos(listaProjetos);
      setTipos(listaTipos);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os projetos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pronto) carregar();

  }, [pronto]);

  const mapaTipos = useMemo(() => new Map(tipos.map((t) => [t.idTipoProjeto, t.nomeTipoProjeto])), [tipos]);

  const filtrados = useMemo(
    () =>
      projetos
        .filter((p) => (filtroTipo === "todos" ? true : p.tipoProjetoId === filtroTipo))
        .filter((p) => (filtroStatus === "todos" ? true : filtroStatus === "ativos" ? p.active : !p.active))
        .sort((a, b) => b.idProjeto - a.idProjeto),
    [projetos, filtroTipo, filtroStatus]
  );
  const lista = useListagemAdmin(filtrados, (p) => [p.nomeProjeto, p.descricaoProjeto, mapaTipos.get(p.tipoProjetoId)]);

  async function excluir(id: number, nome: string) {
    // contrato.id_projeto não tem cascade: com contratos vinculados o servidor recusa (erro 500).
    let contratosDoProjeto = 0;
    try {
      contratosDoProjeto = ((await listarContratos()) ?? []).filter((c) => c.projetoId === id).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar os contratos deste projeto. Tente novamente."));
      return;
    }
    if (contratosDoProjeto > 0) {
      notificar(
        `O projeto "${nome}" tem ${contratosDoProjeto} contrato${contratosDoProjeto === 1 ? "" : "s"} vinculado${contratosDoProjeto === 1 ? "" : "s"}. Exclua os contratos (em Contratos) antes de excluir o projeto.`
      );
      return;
    }
    if (!(await confirmar(`Excluir permanentemente o projeto "${nome}"? Essa ação não pode ser desfeita.`, { titulo: "Excluir projeto", perigo: true }))) return;
    setProcessandoId(id);
    try {
      await excluirProjeto(id);
      setProjetos((atual) => atual.filter((p) => p.idProjeto !== id));
      notificar("Projeto excluído.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir este projeto. Verifique se ele não tem contratos vinculados."));
    } finally {
      setProcessandoId(null);
    }
  }

  async function alternarVinculos(id: number) {
    if (expandidoId === id) {
      setExpandidoId(null);
      return;
    }
    setExpandidoId(id);
    if (vinculos[id] && vinculos[id] !== "erro") return;

    setVinculos((atual) => ({ ...atual, [id]: "carregando" }));
    try {
      const dados = await listarPorProjeto(id);
      setVinculos((atual) => ({ ...atual, [id]: dados }));
    } catch {
      setVinculos((atual) => ({ ...atual, [id]: "erro" }));
    }
  }

  if (!pronto) {
    return <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-ink-100 after:absolute after:inset-0 after:animate-skeleton-sweep after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:content-['']" />;
  }

  return (
    <>
      <CabecalhoAdmin
        icone={Briefcase}
        titulo="Projetos"
        descricao="Visualização e moderação. Projetos são criados e editados pelos próprios usuários: a API não permite que a conta de administrador cadastre ou edite projetos."
        total={loading ? null : projetos.length}
        rotuloTotal={["projeto", "projetos"]}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome, descrição ou tipo..."
        rotulo="Pesquisar projetos"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <>
            <select
              aria-label="Filtrar por tipo"
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value === "todos" ? "todos" : Number(e.target.value));
                lista.irPara(1);
              }}
              className={`${cls.input} !py-2.5 !bg-white sm:!w-48`}
            >
              <option value="todos">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t.idTipoProjeto} value={t.idTipoProjeto}>
                  {t.nomeTipoProjeto}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por status"
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value as typeof filtroStatus);
                lista.irPara(1);
              }}
              className={`${cls.input} !py-2.5 !bg-white sm:!w-44`}
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Somente ativos</option>
              <option value="inativos">Somente inativos</option>
            </select>
          </>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={projetos.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroTipo("todos");
          setFiltroStatus("todos");
        }}
        icone={Briefcase}
        tituloVazio="Nenhum projeto publicado ainda"
        descricaoVazio="Assim que usuários publicarem projetos, eles aparecem aqui."
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="projetos" />}
      >
            {lista.itens.map((p) => {
              const vinculo = vinculos[p.idProjeto];
              return (
                <li key={p.idProjeto}>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-brand-50/50 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-gradient-soft">
                        <ImagemRemota url={p.urlImagemProjeto} alt="" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display truncate text-[14px] font-bold text-ink-900">{p.nomeProjeto}</h3>
                        <p className="truncate text-[0.75rem] text-ink-400">
                          {mapaTipos.get(p.tipoProjetoId) ?? "Tipo não informado"} · {p.dataInicioProjeto} até {p.dataFimProjeto || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          p.active
                            ? "inline-flex items-center rounded-full bg-[#ECFDF3] px-[0.8rem] py-[0.3rem] text-xs font-bold leading-[1.5] text-[#05603A]"
                            : "inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-[0.8rem] py-[0.3rem] text-xs font-bold leading-[1.5] text-ink-500"
                        }
                      >
                        {p.active ? "Ativo" : "Inativo"}
                      </span>

                      <Link
                        href={`/projetos/${p.idProjeto}`}
                        target="_blank"
                        className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full text-ink-500 transition-colors hover:-translate-y-px hover:bg-brand-50 hover:text-brand-700 active:scale-[0.92]"
                        title="Abrir página do projeto"
                      >
                        <ExternalLink size={16} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => alternarVinculos(p.idProjeto)}
                        aria-expanded={expandidoId === p.idProjeto}
                        className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full text-ink-500 transition-colors hover:-translate-y-px hover:bg-brand-50 hover:text-brand-700 active:scale-[0.92]"
                        title="Ver vínculos"
                        aria-label={`Ver vínculos do projeto ${p.nomeProjeto}`}
                      >
                        <ChevronDown size={16} className={`transition-transform ${expandidoId === p.idProjeto ? "rotate-180" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => excluir(p.idProjeto, p.nomeProjeto)}
                        disabled={processandoId === p.idProjeto}
                        className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full text-ink-500 transition-colors hover:-translate-y-px hover:bg-[#FEF2F2] hover:text-[#DC2626] active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-55"
                        title="Excluir"
                        aria-label={`Excluir projeto ${p.nomeProjeto}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandidoId === p.idProjeto && (
                    <div className="border-t border-ink-100 bg-ink-25 px-5 py-4">
                      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                        <Users2 size={13} />
                        Vínculos do projeto
                      </p>
                      {vinculo === "carregando" ? (
                        <p className="text-[12.5px] text-ink-400">Carregando vínculos…</p>
                      ) : vinculo === "erro" ? (
                        <p className="text-[12.5px] text-ink-400">Não foi possível carregar os vínculos deste projeto.</p>
                      ) : !vinculo || vinculo.length === 0 ? (
                        <p className="text-[12.5px] text-ink-400">Nenhum vínculo registrado para este projeto.</p>
                      ) : (
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {vinculo.map((v) => (
                            <li key={v.idProjetoUsuario} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-[12.5px] font-semibold text-ink-800">{v.nomeUsuario}</p>
                                <p className="text-[10.5px] text-ink-400">desde {formatarData(v.dataVinculo)}</p>
                              </div>
                              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                                {v.nomeTipoVinculo}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
      </ListaAdmin>
    </>
  );
}
