"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, Building2 } from "lucide-react";

import PageShell from "../components/PageShell";
import SearchBar from "../components/SearchBar";
import EmptyState from "../components/EmptyState";
import { CardGridSkeleton } from "../components/Skeleton";
import Alerta from "../components/ui/Alerta";
import Avatar from "../components/ui/Avatar";
import { cls } from "../components/ui/estilos";
import { useAuth } from "../context/AuthContext";
import { useUsuario } from "../hook/useUsuario";
import { useContadoresConexao, useMinhasConexoes } from "../hook/useConexao";
import { Empresa, listarEmpresas } from "../services/empresa.service";
import BotaoConexao from "../components/conexao/BotaoConexao";
import ImagemRemota from "../components/ImagemRemota";
import ResumoFinanceiroMini from "../components/projeto/ResumoFinanceiroMini";
import { mensagemErro } from "../lib/api";
import { PerfilUsuario } from "../types/PerfilUsuario";
import { Projeto } from "../types/Projeto";
import { TipoProjeto } from "../types/TipoProjeto";
import { listarPerfisUsuario } from "../services/perfilUsuario.service";
import { listarProjetos } from "../services/projeto.service";
import { listarTiposProjeto } from "../services/tipoProjeto.service";

type Aba = "pessoas" | "empresas" | "projetos";
const POR_PAGINA = 12;

type Conexoes = ReturnType<typeof useMinhasConexoes>;

function CartaoPessoa({ perfil, conexoes, eu }: { perfil: PerfilUsuario; conexoes: Conexoes | null; eu: number | null }) {
  // A listagem de perfis não traz a foto; ela vem do cadastro do usuário (em cache).
  const { usuario } = useUsuario(perfil.usuario.idUsuario);
  const id = perfil.usuario.idUsuario;
  const pessoa = { id, nome: perfil.usuario.nomeUsuario };
  return (
    <div className="flex flex-col">
      <Link href={`/perfil/${id}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-100 bg-ink-50 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50">
          <ImagemRemota url={perfil.urlBanner} alt="" className="opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar url={usuario?.urlImagemUsuario} nome={perfil.usuario.nomeUsuario} tamanho={72} />
          </div>
        </div>
        <h2 className="font-display mt-3 truncate text-[14.5px] font-bold text-ink-900 group-hover:text-brand-700">
          {perfil.usuario.nomeUsuario}
        </h2>
        <p className="text-[0.75rem] text-ink-400 truncate">{perfil.usuario.emailUsuario}</p>
        {perfil.especialidade && <span className={`${cls.chip} mt-2`}>{perfil.especialidade.nomeEspecialidade}</span>}
      </Link>
      {conexoes && id !== eu && !conexoes.carregando && !conexoes.erro && (
        <div className="mt-3">
          <BotaoConexao
            compacto
            relacao={conexoes.relacaoCom(id)}
            ocupado={conexoes.ocupado(id)}
            mostrarResposta={false}
            onSeguir={() => conexoes.seguir(pessoa)}
            onDeixarDeSeguir={() => conexoes.deixarDeSeguir(pessoa)}
            onCancelar={() => conexoes.cancelarSolicitacao(pessoa)}
          />
        </div>
      )}
      {id === eu && <span className="mt-3 text-[12.5px] font-semibold text-ink-400">Você</span>}
    </div>
  );
}

/** Cartão de empresa: dados reais da conta/perfil, seguidores (GET /conexao/contar-seguidores) e seguir. */
function CartaoEmpresa({ empresa, conexoes, eu }: { empresa: Empresa; conexoes: Conexoes | null; eu: number | null }) {
  const contadores = useContadoresConexao(empresa.idUsuario);
  const pessoa = { id: empresa.idUsuario, nome: empresa.nome };
  return (
    <div className={`${cls.card} flex flex-col p-4`}>
      <Link href={`/perfil/${empresa.idUsuario}`} className="group flex items-center gap-3">
        <Avatar url={empresa.urlImagem} nome={empresa.nome} tamanho={52} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-bold text-ink-900 group-hover:text-brand-700">{empresa.nome}</span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700">
            <Building2 size={12} aria-hidden="true" /> Empresa
          </span>
        </span>
      </Link>
      {empresa.perfil?.especialidade && <p className="mt-3 truncate text-[13px] text-ink-600">{empresa.perfil.especialidade.nomeEspecialidade}</p>}
      <p className="mt-1 text-[12.5px] text-ink-500">
        {contadores.seguidores === null ? (contadores.erro ? "Seguidores indisponíveis" : "Carregando seguidores...") : `${contadores.seguidores.toLocaleString("pt-BR")} seguidor${contadores.seguidores === 1 ? "" : "es"}`}
      </p>
      <div className="mt-auto pt-3">
        {conexoes && empresa.idUsuario !== eu && !conexoes.carregando && !conexoes.erro ? (
          <BotaoConexao
            compacto
            relacao={conexoes.relacaoCom(empresa.idUsuario)}
            ocupado={conexoes.ocupado(empresa.idUsuario)}
            mostrarResposta={false}
            onSeguir={() => conexoes.seguir(pessoa)}
            onDeixarDeSeguir={() => conexoes.deixarDeSeguir(pessoa)}
            onCancelar={() => conexoes.cancelarSolicitacao(pessoa)}
          />
        ) : empresa.idUsuario === eu ? (
          <span className="text-[12.5px] font-semibold text-ink-400">Sua empresa</span>
        ) : null}
      </div>
    </div>
  );
}

export default function Explorar() {
  const { isAuthenticated, isAdmin, usuario } = useAuth();
  // Administradores não participam da rede social (sem seguir), só visualizam.
  const conexoes = useMinhasConexoes({ automatico: !isAdmin });

  const [aba, setAba] = useState<Aba>("pessoas");
  const [busca, setBusca] = useState("");
  const [filtroEspecialidade, setFiltroEspecialidade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<number | "">("");
  const [limite, setLimite] = useState(POR_PAGINA);

  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tipos, setTipos] = useState<TipoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erros, setErros] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErros([]);
    // Uma fonte com erro não impede a outra de aparecer.
    const [rPerfis, rProjetos, rTipos, rEmpresas] = await Promise.allSettled([
      listarPerfisUsuario(),
      listarProjetos(),
      listarTiposProjeto(),
      listarEmpresas({ admin: isAdmin }),
    ]);
    const novosErros: string[] = [];
    if (rPerfis.status === "fulfilled") setPerfis(rPerfis.value ?? []);
    else novosErros.push(`Pessoas: ${mensagemErro(rPerfis.reason)}`);
    if (rProjetos.status === "fulfilled") setProjetos([...(rProjetos.value ?? [])].sort((a, b) => b.idProjeto - a.idProjeto));
    else novosErros.push(`Projetos: ${mensagemErro(rProjetos.reason)}`);
    if (rTipos.status === "fulfilled") setTipos(rTipos.value ?? []);
    if (rEmpresas.status === "fulfilled") setEmpresas(rEmpresas.value);
    else novosErros.push(`Empresas: ${mensagemErro(rEmpresas.reason)}`);
    setErros(novosErros);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  useEffect(() => setLimite(POR_PAGINA), [aba, busca, filtroEspecialidade, filtroTipo]);

  const especialidades = useMemo(
    () =>
      Array.from(new Set(perfis.map((p) => p.especialidade?.nomeEspecialidade).filter((n): n is string => !!n))).sort(),
    [perfis]
  );
  const tipoMap = useMemo(() => new Map(tipos.map((t) => [t.idTipoProjeto, t.nomeTipoProjeto])), [tipos]);

  const termo = busca.trim().toLowerCase();

  const perfisFiltrados = useMemo(
    () =>
      perfis.filter(
        (p) =>
          (!filtroEspecialidade || p.especialidade?.nomeEspecialidade === filtroEspecialidade) &&
          (!termo ||
            `${p.usuario.nomeUsuario} ${p.usuario.emailUsuario} ${p.especialidade?.nomeEspecialidade ?? ""}`
              .toLowerCase()
              .includes(termo))
      ),
    [perfis, termo, filtroEspecialidade]
  );

  const projetosFiltrados = useMemo(
    () =>
      projetos.filter(
        (p) =>
          (!filtroTipo || p.tipoProjetoId === filtroTipo) &&
          (!termo || `${p.nomeProjeto} ${p.descricaoProjeto}`.toLowerCase().includes(termo))
      ),
    [projetos, termo, filtroTipo]
  );

  const empresasFiltradas = useMemo(
    () =>
      empresas.filter(
        (e) =>
          !termo || `${e.nome} ${e.email} ${e.perfil?.especialidade?.nomeEspecialidade ?? ""}`.toLowerCase().includes(termo)
      ),
    [empresas, termo]
  );

  const totalFiltrado = aba === "pessoas" ? perfisFiltrados.length : aba === "empresas" ? empresasFiltradas.length : projetosFiltrados.length;

  return (
    <PageShell>
      <div className="pb-5 mb-1">
        <p className={cls.eyebrow}>Descubra</p>
        <h1 className={cls.h1}>Pessoas e projetos em destaque</h1>
      </div>

      <SearchBar
        value={busca}
        onChange={setBusca}
        onRefresh={carregar}
        loading={loading}
        placeholder={aba === "pessoas" ? "Pesquisar pessoas..." : aba === "empresas" ? "Pesquisar empresas..." : "Pesquisar projetos..."}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-100">
        <div role="tablist" aria-label="O que explorar" className="flex max-w-full items-center gap-4 overflow-x-auto sm:gap-6">
          {(
            [
              { id: "pessoas", rotulo: "Pessoas", icone: Users, total: perfis.length },
              { id: "empresas", rotulo: "Empresas", icone: Building2, total: empresas.length },
              { id: "projetos", rotulo: "Projetos", icone: Briefcase, total: projetos.length },
            ] as const
          ).map(({ id, rotulo, icone: Icone, total }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={`relative flex shrink-0 items-center gap-1.5 pb-3 text-[14px] font-bold transition-colors ${
                aba === id ? "text-ink-900" : "text-ink-400 hover:text-ink-600"
              }`}
            >
              <Icone size={15} aria-hidden="true" /> {rotulo}
              <span className="text-ink-400">({total})</span>
              {aba === id && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>

        <div className="pb-2">
          {aba === "empresas" ? null : aba === "pessoas" ? (
            <select
              aria-label="Filtrar por especialidade"
              value={filtroEspecialidade}
              onChange={(e) => setFiltroEspecialidade(e.target.value)}
              className={`${cls.input} !w-auto !py-2 !text-[13px] !bg-white`}
            >
              <option value="">Todas as especialidades</option>
              {especialidades.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="Filtrar por tipo de projeto"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value ? Number(e.target.value) : "")}
              className={`${cls.input} !w-auto !py-2 !text-[13px] !bg-white`}
            >
              <option value="">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t.idTipoProjeto} value={t.idTipoProjeto}>
                  {t.nomeTipoProjeto}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {erros.length > 0 && (
        <Alerta titulo="Alguns dados não puderam ser carregados" onTentarNovamente={carregar}>
          {erros.join(" · ")}
        </Alerta>
      )}

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : aba === "empresas" ? (
        empresasFiltradas.length === 0 ? (
          <div className={cls.card}>
            <EmptyState
              icon={Building2}
              title={busca ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada ainda"}
              description={
                busca
                  ? "Tente outro termo."
                  : "Empresas são contas com o perfil de empresa (atribuído pela administração) ou perfis cadastrados com CNPJ."
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {empresasFiltradas.slice(0, limite).map((empresa) => (
              <CartaoEmpresa key={empresa.idUsuario} empresa={empresa} conexoes={isAdmin ? null : conexoes} eu={usuario?.idUsuario ?? null} />
            ))}
          </div>
        )
      ) : aba === "pessoas" ? (
        perfisFiltrados.length === 0 ? (
          <div className={cls.card}>
            <EmptyState
              icon={Users}
              title={busca || filtroEspecialidade ? "Nenhuma pessoa encontrada" : "Nenhum perfil cadastrado ainda"}
              description={
                busca || filtroEspecialidade
                  ? "Tente outro termo ou filtro."
                  : "Assim que usuários completarem o perfil profissional, eles aparecem aqui."
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            {perfisFiltrados.slice(0, limite).map((perfil) => (
              <CartaoPessoa key={perfil.idPerfilUsuario} perfil={perfil} conexoes={isAdmin ? null : conexoes} eu={usuario?.idUsuario ?? null} />
            ))}
          </div>
        )
      ) : projetosFiltrados.length === 0 ? (
        <div className={cls.card}>
          <EmptyState
            icon={Briefcase}
            title={busca || filtroTipo ? "Nenhum projeto encontrado" : "Nenhum projeto publicado ainda"}
            description={busca || filtroTipo ? "Tente outro termo ou filtro." : "Assim que projetos forem criados, eles aparecem aqui."}
          />
        </div>
      ) : (
        <div>
          {projetosFiltrados.slice(0, limite).map((projeto) => (
            <Link
              key={projeto.idProjeto}
              href={`/projetos/${projeto.idProjeto}`}
              className={`${cls.linha} flex items-start justify-between gap-4 hover:bg-white/50`}
            >
              {projeto.urlImagemProjeto && (
                <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-brand-gradient-soft sm:block">
                  <ImagemRemota url={projeto.urlImagemProjeto} alt="" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[15.5px] font-bold leading-snug text-ink-900 break-words">{projeto.nomeProjeto}</h2>
                <p className="text-[0.9375rem] leading-[1.65] text-ink-700 mt-1.5 line-clamp-2 max-w-xl break-words">
                  {projeto.descricaoProjeto}
                </p>
                <p className="text-[0.75rem] text-ink-400 mt-2">
                  {tipoMap.get(projeto.tipoProjetoId) ?? "Projeto"} · {projeto.dataInicioProjeto} — {projeto.dataFimProjeto}
                </p>
                <ResumoFinanceiroMini ficha={projeto.ficha} className="mt-2 max-w-md" />
              </div>
              <span className={`${projeto.active ? cls.chipAtivo : cls.chipInativo} shrink-0`}>
                {projeto.active ? "Ativo" : "Inativo"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {!loading && totalFiltrado > limite && (
        <div className="flex justify-center">
          <button type="button" onClick={() => setLimite((l) => l + POR_PAGINA)} className={cls.btnSecundario}>
            Carregar mais ({totalFiltrado - limite} restantes)
          </button>
        </div>
      )}
    </PageShell>
  );
}
