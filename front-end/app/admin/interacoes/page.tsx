"use client";

import { useMemo, useState } from "react";
import { Activity, MessageSquare, ThumbsUp, Link2, HandCoins, FileSignature, Trash2, RefreshCw, AlertTriangle } from "lucide-react";

import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { useDashboardData } from "../useDashboardData";
import { agruparPorMes, formatarNumero } from "../dashboardUtils";
import { mensagemErro } from "../../lib/api";
import { formatarData } from "../../lib/date";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { excluirComentario } from "../../services/comentario.service";

import StatCard from "../../components/admin/StatCard";
import SectionCard from "../../components/admin/SectionCard";
import BarChart from "../../components/admin/BarChart";
import InfoNote from "../../components/admin/InfoNote";
import EmptyState from "../../components/EmptyState";
import { Skeleton } from "../../components/Skeleton";
import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import Paginacao from "../../components/admin/Paginacao";
import { useListagemAdmin } from "../../hook/useListagemAdmin";

export default function AdminInteracoesPage() {
  const { pronto } = useRequireAdmin();
  const {
    carregando,
    erro,
    usuarios,
    projetos,
    postagens,
    comentarios,
    propostas,
    contratos,
    conexoes,
    curtidasPostagens,
    curtidasComentarios,
    recarregar,
  } = useDashboardData();
  const { notificar, confirmar } = useFeedback();

  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const listaComentarios = comentarios;

  const mapaUsuarios = useMemo(() => new Map(usuarios.map((u) => [u.idUsuario, u])), [usuarios]);
  const mapaPostagens = useMemo(() => new Map(postagens.map((p) => [p.idPostagem, p])), [postagens]);
  const mapaProjetos = useMemo(() => new Map(projetos.map((p) => [p.idProjeto, p])), [projetos]);


  // Todos os comentários (mais recentes primeiro), com pesquisa e paginação no cliente.
  const comentariosOrdenados = useMemo(() => [...listaComentarios].sort((a, b) => b.idComentario - a.idComentario), [listaComentarios]);
  const listaPaginada = useListagemAdmin(comentariosOrdenados, (c) => [
    c.textoComentario,
    mapaUsuarios.get(c.usuarioId)?.nomeUsuario,
    mapaPostagens.get(c.postagemId)?.tituloPostagem,
  ]);

  const conexoesPorMes = useMemo(
    () => agruparPorMes(conexoes.itens, (v) => v.dataVinculo, 6),
    [conexoes.itens]
  );

  const vinculosRecentes = useMemo(
    () => [...conexoes.itens].sort((a, b) => b.idProjetoUsuario - a.idProjetoUsuario).slice(0, 8),
    [conexoes.itens]
  );

  const contratosAtivos = useMemo(() => contratos.filter((c) => c.active).length, [contratos]);

  async function excluir(idComentario: number) {
    if (!(await confirmar("Excluir este comentário e as respostas dele?", { titulo: "Excluir comentário", perigo: true }))) return;
    setExcluindoId(idComentario);
    try {
      await excluirComentario(idComentario);
      recarregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir este comentário."));
    } finally {
      setExcluindoId(null);
    }
  }

  if (!pronto) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition-[box-shadow,border-color,transform] duration-200 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Activity size={19} />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">Interações</h1>
            <p className="mt-0.5 text-[0.8125rem] text-ink-500">Comentários, curtidas, vínculos, propostas e contratos.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={recarregar}
          disabled={carregando}
          className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] bg-ink-100 px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none text-ink-900 transition-all hover:bg-ink-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RefreshCw size={15} className={carregando ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {erro && !carregando && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Erro ao carregar as interações</p>
            <p className="mt-0.5 text-red-500">{erro}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={MessageSquare} label="Comentários" value={formatarNumero(listaComentarios.length)} loading={carregando} />
        <StatCard
          icon={ThumbsUp}
          label="Curtidas em comentários"
          value={formatarNumero(curtidasComentarios.total)}
          loading={carregando || curtidasComentarios.carregando}
          indisponivel={curtidasComentarios.indisponivel}
          accent="accent"
        />
        <StatCard
          icon={ThumbsUp}
          label="Curtidas em postagens"
          value={formatarNumero(curtidasPostagens.total)}
          loading={carregando || curtidasPostagens.carregando}
          indisponivel={curtidasPostagens.indisponivel}
          accent="accent"
        />
        <StatCard
          icon={Link2}
          label="Conexões"
          value={formatarNumero(conexoes.total)}
          sublabel="vínculos projeto-usuário"
          loading={carregando || conexoes.carregando}
          indisponivel={conexoes.indisponivel}
        />
        <StatCard icon={HandCoins} label="Propostas" value={formatarNumero(propostas.length)} loading={carregando} />
        <StatCard icon={FileSignature} label="Contratos" value={formatarNumero(contratos.length)} sublabel={`${formatarNumero(contratosAtivos)} ativos`} loading={carregando} />
      </div>

      <SectionCard icon={Link2} title="Conexões ao longo do tempo" subtitle="Últimos 6 meses, por data de vínculo entre usuário e projeto">
        {carregando || conexoes.carregando ? (
          <Skeleton className="h-[168px] w-full rounded-xl" />
        ) : conexoes.indisponivel ? (
          <EmptyState icon={Link2} title="Indisponível" description="Não foi possível carregar os vínculos a partir da API para montar este gráfico." />
        ) : conexoes.itens.length === 0 ? (
          <EmptyState icon={Link2} title="Nenhuma conexão registrada ainda" />
        ) : (
          <BarChart data={conexoesPorMes} color="#5613BE" />
        )}
      </SectionCard>

      <SectionCard icon={Link2} title="Vínculos recentes" subtitle="Últimos usuários vinculados a projetos">
        {carregando || conexoes.carregando ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ) : vinculosRecentes.length === 0 ? (
          <p className="text-[13px] text-ink-400">
            {conexoes.indisponivel ? "Não disponível na API." : "Nenhum vínculo registrado ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {vinculosRecentes.map((v) => (
              <li key={v.idProjetoUsuario} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink-900">{v.nomeUsuario}</p>
                  <p className="truncate text-[11.5px] text-ink-400">
                    {mapaProjetos.get(v.projetoId)?.nomeProjeto ?? `Projeto #${v.projetoId}`} · desde {formatarData(v.dataVinculo)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-700">
                  {v.nomeTipoVinculo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard icon={MessageSquare} title="Comentários" subtitle={`${formatarNumero(listaComentarios.length)} no total · moderação disponível`}>
        {carregando ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : comentariosOrdenados.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Nenhum comentário ainda" />
        ) : (
          <>
          <div className="mb-3">
            <BarraPesquisaAdmin
              valor={listaPaginada.termo}
              onChange={listaPaginada.setTermo}
              placeholder="Pesquisar por texto, autor ou publicação..."
              rotulo="Pesquisar comentários"
              resultado={`${listaPaginada.total} resultado${listaPaginada.total === 1 ? "" : "s"}`}
            />
          </div>
          {listaPaginada.total === 0 ? (
            <EmptyState icon={MessageSquare} title="Nenhum resultado encontrado" description={`Nada corresponde a "${listaPaginada.termo.trim()}".`} />
          ) : (
          <ul className="divide-y divide-ink-100">
            {listaPaginada.itens.map((c) => (
              <li key={c.idComentario} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-800">
                    {mapaUsuarios.get(c.usuarioId)?.nomeUsuario ?? `Usuário #${c.usuarioId}`}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-600">{c.textoComentario}</p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    em &ldquo;{mapaPostagens.get(c.postagemId)?.tituloPostagem ?? `Postagem #${c.postagemId}`}&rdquo;
                    {curtidasComentarios.porComentario.has(c.idComentario) &&
                      ` · ${curtidasComentarios.porComentario.get(c.idComentario)} curtida${curtidasComentarios.porComentario.get(c.idComentario) === 1 ? "" : "s"}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => excluir(c.idComentario)}
                  disabled={excluindoId === c.idComentario}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-55"
                  title="Excluir comentário"
                  aria-label="Excluir comentário"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          )}
          <div className="-mx-4 -mb-4 mt-3 sm:-mx-5 sm:-mb-5">
            <Paginacao {...listaPaginada} onPagina={listaPaginada.irPara} onPorPagina={listaPaginada.setPorPagina} rotuloItens="comentários" />
          </div>
          </>
        )}
      </SectionCard>

      <SectionCard icon={HandCoins} title="Propostas e contratos" subtitle="Totais reais — sem ações de edição, já que essas entidades pertencem ao fluxo de negociação dos usuários">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-ink-100 bg-ink-25 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Propostas</p>
            <p className="font-display mt-1 text-[1.375rem] font-extrabold text-ink-900">{formatarNumero(propostas.length)}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">cadastradas no total</p>
          </div>
          <div className="rounded-xl border border-ink-100 bg-ink-25 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Contratos</p>
            <p className="font-display mt-1 text-[1.375rem] font-extrabold text-ink-900">{formatarNumero(contratos.length)}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">{formatarNumero(contratosAtivos)} ativos no momento</p>
          </div>
        </div>
        <InfoNote>
          Propostas não possuem vínculo com projeto ou usuário na API, então não é possível listar &ldquo;quem propôs o quê&rdquo; aqui —
          apenas o total real cadastrado.
        </InfoNote>
      </SectionCard>
    </>
  );
}
