"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Briefcase,
  FileText,
  MessageSquare,
  ThumbsUp,
  Link2,
  HandCoins,
  FileSignature,
  RefreshCw,
  AlertTriangle,
  Activity,
  TrendingUp,
  LayoutGrid,
  Award,
  Home,
  Tag,
  Tags,
  ArrowRight,
} from "lucide-react";

import { useRequireAdmin } from "../hook/useRequireAdmin";
import { useDashboardData } from "./useDashboardData";
import { agruparPorMes, contarPorChave, formatarNumero, parseApiDate } from "./dashboardUtils";
import Avatar from "../components/ui/Avatar";
import ImagemRemota from "../components/ImagemRemota";

import StatCard from "../components/admin/StatCard";
import SectionCard from "../components/admin/SectionCard";
import BarChart from "../components/admin/BarChart";
import InfoNote from "../components/admin/InfoNote";
import EmptyState from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administradores",
  EMPRESA: "Empresas",
  USUARIO: "Usuários",
};

const ACOES_RAPIDAS = [
  { href: "/admin/usuarios", titulo: "Usuários", descricao: "Gerenciar contas e permissões", icon: Users },
  { href: "/admin/projetos", titulo: "Projetos", descricao: "Visualizar e moderar projetos", icon: Briefcase },
  { href: "/admin/postagens", titulo: "Postagens", descricao: "Visualizar e moderar postagens", icon: FileText },
  { href: "/admin/interacoes", titulo: "Interações", descricao: "Comentários, curtidas e vínculos", icon: Activity },
  { href: "/admin/tipos-projeto", titulo: "Tipos de projeto", descricao: "Categorias de projeto", icon: Tags },
  { href: "/admin/areas", titulo: "Áreas", descricao: "Grandes áreas de atuação", icon: LayoutGrid },
  { href: "/admin/subareas", titulo: "Subáreas", descricao: "Subdivisões das áreas", icon: LayoutGrid },
  { href: "/admin/especialidades", titulo: "Especialidades", descricao: "Especialidades de usuários", icon: Award },
  { href: "/admin/enderecos", titulo: "Endereços", descricao: "Endereços cadastrados", icon: Home },
  { href: "/admin/termos", titulo: "Termos de contrato", descricao: "Cláusulas de contratos", icon: FileSignature },
  { href: "/admin/termos-postagem", titulo: "Termos de postagem", descricao: "Regras de postagens", icon: Tag },
  { href: "/admin/termos-vinculo", titulo: "Termos de vínculo", descricao: "Tipos de vínculo em projetos", icon: Link2 },
];

export default function AdminDashboard() {
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
    tiposProjeto,
    conexoes,
    curtidasPostagens,
    curtidasComentarios,
    recarregar,
  } = useDashboardData();



  const usuariosAtivos = useMemo(() => usuarios.filter((u) => u.active).length, [usuarios]);
  const usuariosInativos = usuarios.length - usuariosAtivos;
  const projetosAtivos = useMemo(() => projetos.filter((p) => p.active).length, [projetos]);


  const mapaTipoProjeto = useMemo(
    () => new Map(tiposProjeto.map((t) => [t.idTipoProjeto, t.nomeTipoProjeto])),
    [tiposProjeto]
  );
  const mapaUsuarios = useMemo(() => new Map(usuarios.map((u) => [u.idUsuario, u])), [usuarios]);

  const usuariosRecentes = useMemo(
    () => [...usuarios].sort((a, b) => b.idUsuario - a.idUsuario).slice(0, 5),
    [usuarios]
  );
  const usuariosAtencao = useMemo(
    () =>
      usuarios
        .filter((u) => !u.active)
        .sort((a, b) => b.idUsuario - a.idUsuario)
        .slice(0, 5),
    [usuarios]
  );

  const projetosRecentes = useMemo(
    () => [...projetos].sort((a, b) => b.idProjeto - a.idProjeto).slice(0, 5),
    [projetos]
  );

  const postagensRecentes = useMemo(() => {
    return [...postagens]
      .sort((a, b) => {
        const da = parseApiDate(a.dataPostagem)?.getTime() ?? 0;
        const db = parseApiDate(b.dataPostagem)?.getTime() ?? 0;
        if (db !== da) return db - da;
        return b.idPostagem - a.idPostagem;
      })
      .slice(0, 5);
  }, [postagens]);

  const comentariosPorPostagem = useMemo(() => contarPorChave(comentarios, (c) => c.postagemId), [comentarios]);

  const postagensMaisComentadas = useMemo(() => {
    return postagens
      .map((p) => ({ post: p, total: comentariosPorPostagem.get(p.idPostagem) ?? 0 }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [postagens, comentariosPorPostagem]);

  const comentariosRecentes = useMemo(
    () => [...comentarios].sort((a, b) => b.idComentario - a.idComentario).slice(0, 5),
    [comentarios]
  );

  const postagensPorMes = useMemo(() => agruparPorMes(postagens, (p) => p.dataPostagem, 6), [postagens]);
  const projetosPorMesInicio = useMemo(() => agruparPorMes(projetos, (p) => p.dataInicioProjeto, 6), [projetos]);

  const usuariosPorRoleChart = useMemo(() => {
    const papeis = usuarios.flatMap((u) => (u.roles && u.roles.length > 0 ? u.roles : ["USUARIO"]));
    const mapa = contarPorChave(papeis, (r) => r);
    return Array.from(mapa.entries()).map(([role, total]) => ({
      label: ROLE_LABELS[String(role)] ?? String(role),
      value: total,
    }));
  }, [usuarios]);

  const postagensComentadasChart = useMemo(
    () =>
      postagensMaisComentadas.map((x) => ({
        label: x.post.tituloPostagem.length > 12 ? `${x.post.tituloPostagem.slice(0, 12)}…` : x.post.tituloPostagem,
        value: x.total,
      })),
    [postagensMaisComentadas]
  );

  if (!pronto) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition-[box-shadow,border-color,transform] duration-200 sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-500">
            Bastidores
          </p>
          <h1 className="font-display mt-2 text-[1.75rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink-900">
            Dashboard
          </h1>
          <p className="mt-1.5 max-w-md text-[0.9375rem] leading-[1.65] text-ink-700">
            Visão geral, em tempo real, do que está acontecendo no PitcherX.
          </p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erro ao carregar a Dashboard</p>
              <p className="mt-0.5 text-red-500">{erro}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={recarregar}
            className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] border border-red-200 px-[1.15rem] py-[0.625rem] text-[13px] font-semibold leading-none text-red-600 transition-all hover:bg-red-100 active:scale-[0.97]"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      )}

      <div>
        <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-400">Visão geral</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={Users} label="Usuários" value={formatarNumero(usuarios.length)} sublabel="cadastrados no total" loading={carregando} />
          <StatCard
            icon={UserCheck}
            label="Usuários ativos"
            value={formatarNumero(usuariosAtivos)}
            sublabel={`${formatarNumero(usuariosInativos)} inativos`}
            loading={carregando}
            accent="success"
          />
          <StatCard icon={Briefcase} label="Projetos" value={formatarNumero(projetos.length)} sublabel={`${formatarNumero(projetosAtivos)} ativos`} loading={carregando} />
          <StatCard icon={FileText} label="Postagens" value={formatarNumero(postagens.length)} sublabel="publicadas por usuários" loading={carregando} />
          <StatCard icon={MessageSquare} label="Comentários" value={formatarNumero(comentarios.length)} sublabel="em postagens" loading={carregando} />
          <StatCard
            icon={ThumbsUp}
            label="Curtidas em comentários"
            value={formatarNumero(curtidasComentarios.total)}
            sublabel="somatório por comentário"
            loading={carregando || curtidasComentarios.carregando}
            indisponivel={curtidasComentarios.indisponivel}
            accent="accent"
          />
          <StatCard
            icon={ThumbsUp}
            label="Curtidas em postagens"
            value={formatarNumero(curtidasPostagens.total)}
            sublabel="somatório por postagem"
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
          <StatCard icon={HandCoins} label="Propostas" value={formatarNumero(propostas.length)} sublabel="cadastradas no total" loading={carregando} />
          <StatCard icon={FileSignature} label="Contratos" value={formatarNumero(contratos.length)} sublabel="cadastrados no total" loading={carregando} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-400">Gráficos</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard icon={TrendingUp} title="Postagens ao longo do tempo" subtitle="Últimos 6 meses, por data de publicação">
            {carregando ? (
              <Skeleton className="h-[168px] w-full rounded-xl" />
            ) : postagens.length === 0 ? (
              <EmptyState icon={FileText} title="Sem postagens para exibir" />
            ) : (
              <BarChart data={postagensPorMes} color="#7C3CF5" />
            )}
          </SectionCard>

          <SectionCard icon={Briefcase} title="Novos projetos por período" subtitle="Últimos 6 meses, por data de início do projeto">
            {carregando ? (
              <Skeleton className="h-[168px] w-full rounded-xl" />
            ) : projetos.length === 0 ? (
              <EmptyState icon={Briefcase} title="Sem projetos para exibir" />
            ) : (
              <BarChart data={projetosPorMesInicio} color="#F5127D" />
            )}
            <InfoNote>
              O backend não registra a data de criação do projeto — este gráfico usa a data de início que cada
              projeto já informa.
            </InfoNote>
          </SectionCard>

          <SectionCard icon={Users} title="Usuários por perfil" subtitle="Distribuição atual de roles cadastradas">
            {carregando ? (
              <Skeleton className="h-[168px] w-full rounded-xl" />
            ) : usuarios.length === 0 ? (
              <EmptyState icon={Users} title="Sem usuários para exibir" />
            ) : (
              <BarChart data={usuariosPorRoleChart} color="#6B21E0" />
            )}
            <InfoNote>
              O backend não expõe a data de cadastro do usuário, então não é possível montar um gráfico de
              crescimento ao longo do tempo. Aqui mostramos a distribuição atual por perfil.
            </InfoNote>
          </SectionCard>

          <SectionCard icon={MessageSquare} title="Postagens com mais comentários" subtitle="Top 5, por interação real">
            {carregando ? (
              <Skeleton className="h-[168px] w-full rounded-xl" />
            ) : postagensComentadasChart.length === 0 ? (
              <EmptyState icon={MessageSquare} title="Ainda não há comentários suficientes" />
            ) : (
              <BarChart data={postagensComentadasChart} color="#9D6FFF" />
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard
        icon={Users}
        title="Usuários"
        subtitle={`${formatarNumero(usuarios.length)} cadastrados · ${formatarNumero(usuariosAtivos)} ativos · ${formatarNumero(usuariosInativos)} inativos`}
        actionHref="/admin/usuarios"
        actionLabel="Gerenciar usuários"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">Últimos cadastrados</p>
            {carregando ? (
              <ListaSkeleton />
            ) : usuariosRecentes.length === 0 ? (
              <p className="text-[13px] text-ink-400">Nenhum usuário cadastrado ainda.</p>
            ) : (
              <ul className="space-y-1">
                {usuariosRecentes.map((u) => (
                  <li key={u.idUsuario} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-ink-25">
                    <Avatar url={u.urlImagemUsuario} nome={u.nomeUsuario} tamanho={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{u.nomeUsuario}</p>
                      <p className="truncate text-[11px] text-ink-400">{u.emailUsuario}</p>
                    </div>
                    <span
                      className={
                        u.active
                          ? "shrink-0 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-bold text-[#05603A]"
                          : "shrink-0 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[10px] font-bold text-ink-500"
                      }
                    >
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              Requer atenção · usuários inativos
            </p>
            {carregando ? (
              <ListaSkeleton />
            ) : usuariosAtencao.length === 0 ? (
              <p className="text-[13px] text-ink-400">Nenhum usuário inativo — tudo certo por aqui.</p>
            ) : (
              <ul className="space-y-1">
                {usuariosAtencao.map((u) => (
                  <li key={u.idUsuario} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-ink-25">
                    <span className="inline-flex shrink-0 rounded-full bg-ink-100 p-[1.5px] opacity-70">
                      <Avatar url={u.urlImagemUsuario} nome={u.nomeUsuario} tamanho={28} moldura={false} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{u.nomeUsuario}</p>
                      <p className="truncate text-[11px] text-ink-400">{u.emailUsuario}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Briefcase}
        title="Projetos"
        subtitle={`${formatarNumero(projetos.length)} no total · ${formatarNumero(projetosAtivos)} ativos`}
        actionHref="/admin/projetos"
        actionLabel="Ver e administrar projetos"
      >
        {carregando ? (
          <ListaSkeleton />
        ) : projetosRecentes.length === 0 ? (
          <EmptyState icon={Briefcase} title="Nenhum projeto cadastrado ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {projetosRecentes.map((p) => (
              <li key={p.idProjeto} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-brand-gradient-soft">
                  <ImagemRemota url={p.urlImagemProjeto} alt="" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink-900">{p.nomeProjeto}</p>
                  <p className="truncate text-[11.5px] text-ink-400">
                    {mapaTipoProjeto.get(p.tipoProjetoId) ?? "Tipo não informado"} · início em {p.dataInicioProjeto}
                  </p>
                </div>
                <span
                  className={
                    p.active
                      ? "shrink-0 rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[10.5px] font-bold text-[#05603A]"
                      : "shrink-0 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[10.5px] font-bold text-ink-500"
                  }
                >
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        icon={FileText}
        title="Postagens"
        subtitle={`${formatarNumero(postagens.length)} publicadas por usuários`}
        actionHref="/admin/postagens"
        actionLabel="Gerenciar postagens"
      >
        {carregando ? (
          <ListaSkeleton />
        ) : postagensRecentes.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhuma postagem publicada ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {postagensRecentes.map((p) => {
              const autor = mapaUsuarios.get(p.usuarioId);
              const totalComentarios = comentariosPorPostagem.get(p.idPostagem) ?? 0;
              return (
                <li key={p.idPostagem} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13.5px] font-semibold text-ink-900">{p.tituloPostagem}</p>
                    <span className="shrink-0 text-[11px] text-ink-400">{p.dataPostagem}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-500">{p.textoPostagem}</p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    {autor?.nomeUsuario ?? `Usuário #${p.usuarioId}`} · {formatarNumero(totalComentarios)} comentário
                    {totalComentarios === 1 ? "" : "s"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        icon={Activity}
        title="Interações"
        subtitle="Comentários, curtidas, propostas, contratos e conexões"
        actionHref="/admin/interacoes"
        actionLabel="Ver interações"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <IndicadorMini label="Comentários" valor={formatarNumero(comentarios.length)} loading={carregando} />
          <IndicadorMini
            label="Curtidas"
            valor={formatarNumero(curtidasComentarios.total + curtidasPostagens.total)}
            loading={carregando || curtidasComentarios.carregando || curtidasPostagens.carregando}
            indisponivel={curtidasComentarios.indisponivel && curtidasPostagens.indisponivel}
          />
          <IndicadorMini
            label="Conexões"
            valor={formatarNumero(conexoes.total)}
            loading={carregando || conexoes.carregando}
            indisponivel={conexoes.indisponivel}
          />
          <IndicadorMini label="Propostas" valor={formatarNumero(propostas.length)} loading={carregando} />
        </div>
      </SectionCard>

      <SectionCard icon={Activity} title="Atividades recentes" subtitle="Últimos registros reais da plataforma, por seção">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <AtividadeColuna titulo="Novos usuários" icone={Users} vazio="Nenhum usuário ainda">
            {usuariosRecentes.slice(0, 4).map((u) => (
              <AtividadeItem key={u.idUsuario} titulo={u.nomeUsuario} legenda={u.emailUsuario} />
            ))}
          </AtividadeColuna>

          <AtividadeColuna titulo="Novas postagens" icone={FileText} vazio="Nenhuma postagem ainda">
            {postagensRecentes.slice(0, 4).map((p) => (
              <AtividadeItem key={p.idPostagem} titulo={p.tituloPostagem} legenda={p.dataPostagem} />
            ))}
          </AtividadeColuna>

          <AtividadeColuna titulo="Novos comentários" icone={MessageSquare} vazio="Nenhum comentário ainda">
            {comentariosRecentes.slice(0, 4).map((c) => (
              <AtividadeItem
                key={c.idComentario}
                titulo={c.textoComentario}
                legenda={mapaUsuarios.get(c.usuarioId)?.nomeUsuario ?? `Usuário #${c.usuarioId}`}
              />
            ))}
          </AtividadeColuna>

          <AtividadeColuna titulo="Novos projetos" icone={Briefcase} vazio="Nenhum projeto ainda">
            {projetosRecentes.slice(0, 4).map((p) => (
              <AtividadeItem key={p.idProjeto} titulo={p.nomeProjeto} legenda={mapaTipoProjeto.get(p.tipoProjetoId) ?? ""} />
            ))}
          </AtividadeColuna>
        </div>
      </SectionCard>

      <div>
        <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-400">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {ACOES_RAPIDAS.map(({ href, titulo, descricao, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-w-0 items-start gap-2.5 rounded-2xl border border-ink-100 bg-white p-3 transition-all sm:gap-3 sm:p-4 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[13px] font-bold text-ink-900">
                  <span className="min-w-0 break-words">{titulo}</span>
                  <ArrowRight size={12} className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </span>
                <span className="mt-0.5 block truncate text-[11.5px] text-ink-400">{descricao}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}



function ListaSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-5/6 rounded-lg" />
    </div>
  );
}

function IndicadorMini({
  label,
  valor,
  loading,
  indisponivel,
}: {
  label: string;
  valor: string;
  loading?: boolean;
  indisponivel?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-25 px-3.5 py-3">
      <p className="text-[11px] font-semibold text-ink-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-5 w-12 rounded" />
      ) : (
        <p className="font-display mt-0.5 text-[17px] font-extrabold text-ink-900">
          {indisponivel ? "—" : valor}
        </p>
      )}
    </div>
  );
}

function AtividadeColuna({
  titulo,
  icone: Icon,
  vazio,
  children,
}: {
  titulo: string;
  icone: typeof Users;
  vazio: string;
  children: React.ReactNode;
}) {
  const temConteudo = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
        <Icon size={13} />
        {titulo}
      </p>
      {temConteudo ? <ul className="space-y-2.5">{children}</ul> : <p className="text-[12.5px] text-ink-400">{vazio}</p>}
    </div>
  );
}

function AtividadeItem({ titulo, legenda }: { titulo: string; legenda?: string }) {
  return (
    <li className="border-l-2 border-brand-200 pl-2.5">
      <p className="line-clamp-1 text-[12.5px] font-semibold leading-snug text-ink-800">{titulo}</p>
      {legenda && <p className="truncate text-[10.5px] text-ink-400">{legenda}</p>}
    </li>
  );
}
