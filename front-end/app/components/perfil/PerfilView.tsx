"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Camera,
  Check,
  FileText,
  Link2,
  Mail,
  MapPin,
  PenLine,
  Share2,
  Sparkles,
  UserX,
  Circle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Plus,
  ImagePlus,
  Loader2,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import BotaoConexao from "../conexao/BotaoConexao";
import { useContadoresConexao, useRelacaoConexao } from "../../hook/useConexao";
import { ACCEPT_FOTO, validarArquivoFoto } from "../../lib/imagemPerfil";
import { atualizarBanner, removerBanner } from "../../services/perfilUsuario.service";
import EmptyState from "../EmptyState";
import PostCard from "../PostCard";
import ImagemRemota from "../ImagemRemota";
import Avatar from "../ui/Avatar";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import CapaPerfil from "./CapaPerfil";
import { useAuth } from "../../context/AuthContext";
import { useUsuario } from "../../hook/useUsuario";
import { useDadosPerfil } from "../../hook/useDadosPerfil";
import { linkExternoSeguro } from "../../lib/image";
import { mensagemErro } from "../../lib/api";
import { completudePerfil, localizacaoPublica } from "../../lib/perfil";
import { listarPostagens } from "../../services/postagem.service";
import { listarPorUsuario } from "../../services/projetoUsuario.service";
import { listarProjetos } from "../../services/projeto.service";
import { obterRolePrincipal, ROLE_LABEL } from "../../services/usuario.service";
import { Post } from "../../types/Post";
import { Projeto } from "../../types/Projeto";
import { ProjetoUsuario, rotuloVinculo } from "../../types/ProjetoUsuario";

type Aba = "publicacoes" | "projetos";
type Estado<T> = { dados: T; carregando: boolean; erro: string };
const POSTS_POR_PAGINA = 10;

interface ProjetoDoPerfil {
  projetoId: number;
  projeto: Projeto | null;
  vinculos: string[];
}

/**
 * Perfil de um usuário (próprio ou de outra pessoa) com os dados reais da API:
 * `GET /usuario/{id}`, `GET /perfil-usuario`, `GET /endereco`, `GET /postagem`,
 * `GET /projeto-usuario/usuario/{id}` e `GET /projeto`.
 */
export default function PerfilView({ id, mostrarVoltar = false }: { id: number; mostrarVoltar?: boolean }) {
  const router = useRouter();
  const { usuario: logado, isAdmin: logadoAdmin } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const proprio = logado?.idUsuario === id;

  const { usuario, loading, indisponivel, recarregar: recarregarUsuario } = useUsuario(id);
  const dados = useDadosPerfil(id);

  // Conexões: contadores públicos e, no perfil de outra pessoa, a relação comigo.
  const contadores = useContadoresConexao(id);
  const nomeUsuario = usuario?.nomeUsuario;
  const outro = useMemo(
    () => (!proprio && !logadoAdmin && nomeUsuario ? { id, nome: nomeUsuario } : null),
    [proprio, logadoAdmin, nomeUsuario, id]
  );
  const conexao = useRelacaoConexao(outro);
  const { recarregar: recarregarContadores } = contadores;
  const acaoConexao = useCallback(
    async (fn: () => Promise<boolean>) => {
      await fn();
      recarregarContadores();
    },
    [recarregarContadores]
  );

  // Capa (banner): pertence ao perfil profissional (PerfilUsuario).
  const inputCapaRef = useRef<HTMLInputElement>(null);
  const [salvandoCapa, setSalvandoCapa] = useState(false);

  async function trocarCapa(arquivo: File | undefined) {
    if (inputCapaRef.current) inputCapaRef.current.value = "";
    const perfilAtual = dados.perfil;
    if (!arquivo || !perfilAtual) return;
    const erro = validarArquivoFoto(arquivo);
    if (erro) {
      notificar(erro);
      return;
    }
    setSalvandoCapa(true);
    try {
      const atualizado = await atualizarBanner(perfilAtual.idPerfilUsuario, arquivo);
      dados.setPerfil(atualizado ?? { ...perfilAtual });
      notificar("Capa atualizada.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível enviar a capa."));
    } finally {
      setSalvandoCapa(false);
    }
  }

  async function excluirCapa() {
    const perfilAtual = dados.perfil;
    if (!perfilAtual) return;
    if (!(await confirmar("Remover a imagem de capa do seu perfil?", { titulo: "Remover capa", confirmarLabel: "Remover", perigo: true }))) return;
    setSalvandoCapa(true);
    try {
      await removerBanner(perfilAtual.idPerfilUsuario);
      dados.setPerfil({ ...perfilAtual, urlBanner: null });
      notificar("Capa removida.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível remover a capa."));
    } finally {
      setSalvandoCapa(false);
    }
  }

  const [posts, setPosts] = useState<Estado<Post[]>>({ dados: [], carregando: true, erro: "" });
  const [projetos, setProjetos] = useState<Estado<ProjetoDoPerfil[]>>({ dados: [], carregando: true, erro: "" });
  const [aba, setAba] = useState<Aba>("publicacoes");
  const [limitePosts, setLimitePosts] = useState(POSTS_POR_PAGINA);

  const carregarPosts = useCallback(async () => {
    setPosts((p) => ({ ...p, carregando: true, erro: "" }));
    try {
      const todos = await listarPostagens();
      setPosts({
        dados: (todos ?? []).filter((p) => p.usuarioId === id).sort((a, b) => b.idPostagem - a.idPostagem),
        carregando: false,
        erro: "",
      });
    } catch (error) {
      setPosts({ dados: [], carregando: false, erro: mensagemErro(error, "Não foi possível carregar as publicações.") });
    }
  }, [id]);

  const carregarProjetos = useCallback(async () => {
    setProjetos((p) => ({ ...p, carregando: true, erro: "" }));
    try {
      const [vinculos, lista] = await Promise.all([
        listarPorUsuario(id),
        listarProjetos().catch(() => [] as Projeto[]),
      ]);
      const porId = new Map((lista ?? []).map((p) => [p.idProjeto, p]));
      const agrupados = new Map<number, ProjetoDoPerfil>();
      for (const v of (vinculos ?? []) as ProjetoUsuario[]) {
        const item = agrupados.get(v.projetoId) ?? { projetoId: v.projetoId, projeto: porId.get(v.projetoId) ?? null, vinculos: [] };
        const rotulo = rotuloVinculo(v.nomeTipoVinculo);
        if (!item.vinculos.includes(rotulo)) item.vinculos.push(rotulo);
        agrupados.set(v.projetoId, item);
      }
      setProjetos({ dados: [...agrupados.values()].sort((a, b) => b.projetoId - a.projetoId), carregando: false, erro: "" });
    } catch (error) {
      setProjetos({ dados: [], carregando: false, erro: mensagemErro(error, "Não foi possível carregar os projetos.") });
    }
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    carregarPosts();
    carregarProjetos();
  }, [id, carregarPosts, carregarProjetos]);

  const perfil = dados.perfil;
  const linkedin = linkExternoSeguro(perfil?.linkedin);
  const localizacao = localizacaoPublica(dados.endereco);
  const rolePrincipal = obterRolePrincipal(usuario?.roles?.length ? usuario.roles : proprio ? logado?.roles : []);
  const ehAdminPerfil = rolePrincipal === "ADMIN";
  const titulo = perfil?.especialidade?.nomeEspecialidade ?? null;

  const completude = useMemo(
    () =>
      completudePerfil({
        temFoto: !!usuario?.urlImagemUsuario,
        temPerfilProfissional: !!perfil,
        temEndereco: !!dados.endereco,
      }),
    [usuario?.urlImagemUsuario, perfil, dados.endereco]
  );

  async function compartilhar() {
    const url = `${window.location.origin}/perfil/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${usuario?.nomeUsuario ?? "Perfil"} no PitcherX`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notificar("Link do perfil copiado.", "sucesso");
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      notificar("Não foi possível copiar o link. Copie o endereço da barra do navegador.", "erro");
    }
  }

  // ------------------------------------------------------------------ estados
  if (loading) return <PerfilSkeleton />;

  if (indisponivel || !usuario) {
    return (
      <div className={cls.card}>
        <EmptyState
          icon={UserX}
          title="Perfil indisponível"
          description="Não foi possível carregar este perfil. Ele pode não existir, ter sido removido ou o servidor pode estar indisponível."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={recarregarUsuario} className={cls.btnPrimario}>
                Tentar novamente
              </button>
              <button type="button" onClick={() => router.back()} className={cls.btnSecundario}>
                <ArrowLeft size={15} aria-hidden="true" /> Voltar
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const totalProjetos = projetos.dados.length;
  const acoes = (
    <>
      {proprio && !logadoAdmin && (
        <Link href="/perfil/editar" className={cls.btnPrimario}>
          <PenLine size={16} aria-hidden="true" /> Editar perfil
        </Link>
      )}
      {proprio && logadoAdmin && (
        <Link href="/perfil/editar" className={cls.btnPrimario}>
          <Camera size={16} aria-hidden="true" /> Alterar foto
        </Link>
      )}
      {outro && !conexao.carregando && !conexao.erro && (
        <BotaoConexao
          relacao={conexao.relacao}
          ocupado={conexao.enviando}
          mostrarResposta={false}
          onSeguir={() => acaoConexao(conexao.seguir)}
          onDeixarDeSeguir={() => acaoConexao(conexao.deixarDeSeguir)}
          onCancelar={() => acaoConexao(conexao.cancelarSolicitacao)}
        />
      )}
      {!proprio && linkedin && (
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className={outro ? cls.btnContorno : cls.btnPrimario}>
          <Link2 size={16} aria-hidden="true" /> LinkedIn
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      )}
      <button type="button" onClick={compartilhar} className={cls.btnContorno}>
        <Share2 size={16} aria-hidden="true" /> Compartilhar
      </button>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      {mostrarVoltar && (
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/explorar"))}
          className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Voltar
        </button>
      )}

      {/* ------------------------------------------------------------ cabeçalho */}
      <section className={`${cls.card} overflow-hidden`} aria-labelledby="perfil-nome">
        <div className="relative">
          <CapaPerfil semente={id} url={dados.perfil?.urlBanner} className="h-[120px] sm:h-[176px] lg:h-[200px]" />
          {proprio && !dados.carregando && (
            <div className="absolute right-3 top-3 flex gap-2">
              {dados.perfil ? (
                <>
                  <input
                    ref={inputCapaRef}
                    type="file"
                    accept={ACCEPT_FOTO}
                    className="sr-only"
                    id="input-capa"
                    onChange={(e) => trocarCapa(e.target.files?.[0])}
                    disabled={salvandoCapa}
                  />
                  <label
                    htmlFor="input-capa"
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-void/55 px-3 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur hover:bg-void/75 ${
                      salvandoCapa ? "pointer-events-none opacity-70" : ""
                    }`}
                  >
                    {salvandoCapa ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />}
                    {dados.perfil.urlBanner ? "Trocar capa" : "Adicionar capa"}
                  </label>
                  {dados.perfil.urlBanner && (
                    <button
                      type="button"
                      onClick={excluirCapa}
                      disabled={salvandoCapa}
                      aria-label="Remover capa"
                      title="Remover capa"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-void/55 text-white backdrop-blur hover:bg-red-600/80"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </>
              ) : (
                !logadoAdmin && (
                  <Link
                    href="/perfil/editar#profissional"
                    title="A capa fica no perfil profissional: complete-o para adicionar uma imagem"
                    className="inline-flex items-center gap-1.5 rounded-full bg-void/55 px-3 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur hover:bg-void/75"
                  >
                    <ImagePlus size={14} aria-hidden="true" /> Adicionar capa
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="relative -mt-14 shrink-0 sm:-mt-[4.5rem]">
              <span className="block rounded-full bg-white p-1 shadow-card">
                <Avatar
                  url={usuario.urlImagemUsuario}
                  nome={usuario.nomeUsuario}
                  tamanho={128}
                  moldura={false}
                  className="!h-[104px] !w-[104px] rounded-full object-cover sm:!h-32 sm:!w-32"
                />
              </span>
              {proprio && (
                <Link
                  href="/perfil/editar#foto"
                  aria-label="Alterar foto de perfil"
                  title="Alterar foto"
                  className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-glow transition-colors hover:bg-brand-700"
                >
                  <Camera size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="hidden flex-wrap justify-end gap-2 pt-4 sm:flex">{acoes}</div>
          </div>

          <div className="mt-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="perfil-nome" className="font-display text-[1.55rem] font-extrabold leading-tight tracking-[-0.02em] text-ink-900 break-words sm:text-[1.85rem]">
                {usuario.nomeUsuario}
              </h1>
              {rolePrincipal !== "USUARIO" && (
                <span className={cls.chip}>
                  <ShieldCheck size={12} aria-hidden="true" /> {ROLE_LABEL[rolePrincipal] ?? rolePrincipal}
                </span>
              )}
              {usuario.active === false && <span className={cls.chipInativo}>Conta desativada</span>}
              {outro && conexao.relacao.meSegue && <span className={cls.chipInativo}>Segue você</span>}
            </div>

            {dados.carregando ? (
              <div className={`${cls.skeleton} mt-2 h-4 w-56 rounded-md`} />
            ) : titulo ? (
              <p className="mt-1 text-[15px] font-medium text-ink-700">{titulo}</p>
            ) : (
              <p className="mt-1 text-[14px] text-ink-400">
                {proprio && !ehAdminPerfil ? "Adicione sua área de atuação para se apresentar melhor." : "Membro do PitcherX"}
              </p>
            )}

            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-500">
              {localizacao && (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-ink-400" aria-hidden="true" />
                  {localizacao}
                </li>
              )}
              <li className="inline-flex min-w-0 items-center gap-1.5">
                <Mail size={15} className="shrink-0 text-ink-400" aria-hidden="true" />
                <a href={`mailto:${usuario.emailUsuario}`} className="truncate hover:text-brand-700 hover:underline">
                  {usuario.emailUsuario}
                </a>
              </li>
              {linkedin && (
                <li className="inline-flex items-center gap-1.5">
                  <Link2 size={15} className="text-ink-400" aria-hidden="true" />
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                    LinkedIn<span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {outro && conexao.relacao.solicitacaoRecebida && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
              <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink-800">
                <UserPlus size={16} className="text-brand-700" aria-hidden="true" />
                {usuario.nomeUsuario} quer se conectar com você.
              </p>
              <BotaoConexao
                compacto
                somenteResposta
                relacao={conexao.relacao}
                ocupado={conexao.enviando}
                onAceitar={() => acaoConexao(conexao.aceitar)}
                onRecusar={() => acaoConexao(conexao.recusar)}
              />
            </div>
          )}
          {outro && conexao.erro && (
            <Alerta className="mt-4" onTentarNovamente={conexao.recarregar}>
              {conexao.erro}
            </Alerta>
          )}

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink-100 pt-4">
            <Contador
              rotulo={["Seguidor", "Seguidores"]}
              valor={contadores.seguidores ?? (contadores.erro ? "—" : null)}
              href={`/conexoes?${proprio ? "" : `usuario=${id}&`}aba=seguidores`}
              desabilitarLink={logadoAdmin}
            />
            <Contador
              rotulo={["Seguindo", "Seguindo"]}
              valor={contadores.seguindo ?? (contadores.erro ? "—" : null)}
              href={`/conexoes?${proprio ? "" : `usuario=${id}&`}aba=seguindo`}
              desabilitarLink={logadoAdmin}
            />
            <Contador rotulo={["Publicação", "Publicações"]} valor={posts.carregando ? null : posts.erro ? "—" : posts.dados.length} />
            <Contador rotulo={["Projeto", "Projetos"]} valor={projetos.carregando ? null : projetos.erro ? "—" : totalProjetos} />
            <Contador
              rotulo={["Projeto criado", "Projetos criados"]}
              valor={
                projetos.carregando ? null : projetos.erro ? "—" : projetos.dados.filter((p) => p.vinculos.includes("Criador")).length
              }
            />
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:hidden [&>*]:w-full [&>*:only-child]:col-span-2">{acoes}</div>
        </div>
      </section>

      {/* ------------------------------------------- conclusão do perfil (dono) */}
      {proprio && !logadoAdmin && !dados.carregando && !dados.erro && completude.percentual < 100 && (
        <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="completar-titulo">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={cls.eyebrow}>
                <Sparkles size={14} aria-hidden="true" /> Seu perfil está {completude.percentual}% completo
              </p>
              <h2 id="completar-titulo" className={`${cls.h2} mt-1`}>
                Deixe seu perfil pronto para conexões
              </h2>
            </div>
            <Link href="/perfil/editar" className={cls.btnContorno}>
              Completar perfil
            </Link>
          </div>
          <div
            className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completude.percentual}
            aria-label="Progresso do perfil"
          >
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${completude.percentual}%` }} />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {completude.itens.map((item) => (
              <li key={item.chave} className="flex items-center gap-2 text-[13.5px]">
                {item.feito ? (
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Circle size={17} className="shrink-0 text-ink-300" aria-hidden="true" />
                )}
                {item.feito ? (
                  <span className="text-ink-500 line-through decoration-ink-300">{item.rotulo}</span>
                ) : (
                  <Link
                    href={`/perfil/editar#${item.chave === "localizacao" ? "localizacao" : item.chave}`}
                    className="font-medium text-ink-800 underline-offset-2 hover:text-brand-700 hover:underline"
                  >
                    {item.rotulo}
                  </Link>
                )}
                <span className="sr-only">{item.feito ? "(concluído)" : "(pendente)"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------- corpo em 2 colunas */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <aside className="space-y-6 lg:order-2" aria-label="Sobre">
          <section className={`${cls.card} p-5`} aria-labelledby="sobre-titulo">
            <h2 id="sobre-titulo" className="font-display text-[16px] font-bold text-ink-900">
              Sobre
            </h2>

            {dados.carregando ? (
              <div className="mt-4 space-y-3">
                <div className={`${cls.skeleton} h-4 w-3/4 rounded-md`} />
                <div className={`${cls.skeleton} h-4 w-1/2 rounded-md`} />
              </div>
            ) : dados.erro ? (
              <Alerta className="mt-4" onTentarNovamente={dados.recarregar}>
                {dados.erro}
              </Alerta>
            ) : (
              <dl className="mt-4 space-y-4 text-[14px]">
                <ItemSobre icone={Briefcase} rotulo="Área de atuação">
                  {titulo ?? <Vazio proprio={proprio && !logadoAdmin} texto="Não informada" />}
                </ItemSobre>
                <ItemSobre icone={MapPin} rotulo="Localização">
                  {localizacao ?? (
                    dados.erroEndereco ? <span className="text-ink-400">Indisponível no momento</span> : <Vazio proprio={proprio && !logadoAdmin} texto="Não informada" />
                  )}
                </ItemSobre>
                <ItemSobre icone={Link2} rotulo="LinkedIn">
                  {linkedin ? (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-brand-700 hover:underline">
                      {linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  ) : (
                    <Vazio proprio={proprio && !logadoAdmin} texto="Não informado" />
                  )}
                </ItemSobre>
                <ItemSobre icone={Mail} rotulo="E-mail">
                  <span className="break-all">{usuario.emailUsuario}</span>
                </ItemSobre>
                {proprio && (
                  <ItemSobre icone={Phone} rotulo="Telefone (visível só para você)">
                    {usuario.telefoneUsuario || logado?.telefoneUsuario || <span className="text-ink-400">Não informado</span>}
                  </ItemSobre>
                )}
              </dl>
            )}

            {!dados.carregando && !dados.erro && !perfil && !proprio && (
              <p className="mt-4 rounded-xl bg-ink-25 px-3 py-2.5 text-[13px] text-ink-500">
                Esta pessoa ainda não completou as informações profissionais.
              </p>
            )}
          </section>
        </aside>

        <section className="min-w-0 lg:order-1" aria-label="Atividade">
          <div role="tablist" aria-label="Conteúdo do perfil" className="flex gap-1 border-b border-ink-100">
            {(
              [
                { chave: "publicacoes", rotulo: "Publicações", icone: FileText, total: posts.carregando || posts.erro ? null : posts.dados.length },
                { chave: "projetos", rotulo: "Projetos", icone: Briefcase, total: projetos.carregando || projetos.erro ? null : totalProjetos },
              ] as const
            ).map(({ chave, rotulo, icone: Icone, total }) => {
              const ativa = aba === chave;
              return (
                <button
                  key={chave}
                  type="button"
                  role="tab"
                  id={`aba-${chave}`}
                  aria-selected={ativa}
                  aria-controls={`painel-${chave}`}
                  onClick={() => setAba(chave)}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[14px] font-semibold transition-colors ${
                    ativa ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-900"
                  }`}
                >
                  <Icone size={16} aria-hidden="true" />
                  {rotulo}
                  {total !== null && (
                    <span className={`rounded-full px-1.5 text-[11.5px] ${ativa ? "bg-brand-50 text-brand-700" : "bg-ink-50 text-ink-500"}`}>
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {aba === "publicacoes" ? (
            <div role="tabpanel" id="painel-publicacoes" aria-labelledby="aba-publicacoes" className="pt-5">
              {posts.carregando ? (
                <div className="space-y-3" aria-label="Carregando publicações">
                  {[0, 1].map((i) => (
                    <div key={i} className={`${cls.card} p-5`}>
                      <div className={`${cls.skeleton} h-4 w-1/3 rounded-md`} />
                      <div className={`${cls.skeleton} mt-3 h-3 w-full rounded-md`} />
                      <div className={`${cls.skeleton} mt-2 h-3 w-2/3 rounded-md`} />
                    </div>
                  ))}
                </div>
              ) : posts.erro ? (
                <Alerta onTentarNovamente={carregarPosts}>{posts.erro}</Alerta>
              ) : posts.dados.length === 0 ? (
                <div className={cls.card}>
                  <EmptyState
                    icon={FileText}
                    title={proprio ? "Você ainda não publicou" : "Nenhuma publicação ainda"}
                    description={
                      proprio
                        ? "Compartilhe uma ideia com a comunidade. Suas publicações aparecem aqui."
                        : "Quando esta pessoa publicar, as publicações aparecem aqui."
                    }
                    action={
                      proprio && !logadoAdmin ? (
                        <Link href="/feed#criar-post" className={cls.btnPrimario}>
                          <Plus size={16} aria-hidden="true" /> Criar publicação
                        </Link>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className={`${cls.card} px-5 sm:px-6`}>
                  {posts.dados.slice(0, limitePosts).map((post) => (
                    <PostCard key={post.idPostagem} post={post} onUpdate={carregarPosts} />
                  ))}
                  {posts.dados.length > limitePosts && (
                    <div className="flex justify-center py-5">
                      <button type="button" onClick={() => setLimitePosts((l) => l + POSTS_POR_PAGINA)} className={cls.btnSecundario}>
                        Carregar mais
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div role="tabpanel" id="painel-projetos" aria-labelledby="aba-projetos" className="pt-5">
              {projetos.carregando ? (
                <div className="grid gap-4 sm:grid-cols-2" aria-label="Carregando projetos">
                  {[0, 1].map((i) => (
                    <div key={i} className={`${cls.card} overflow-hidden`}>
                      <div className={`${cls.skeleton} aspect-[16/9] w-full`} />
                      <div className="p-4">
                        <div className={`${cls.skeleton} h-4 w-2/3 rounded-md`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : projetos.erro ? (
                <Alerta onTentarNovamente={carregarProjetos}>{projetos.erro}</Alerta>
              ) : projetos.dados.length === 0 ? (
                <div className={cls.card}>
                  <EmptyState
                    icon={Briefcase}
                    title="Nenhum projeto vinculado"
                    description={
                      proprio
                        ? "Crie um projeto ou participe de um para ele aparecer no seu perfil."
                        : "Esta pessoa ainda não participa de projetos."
                    }
                    action={
                      proprio && !logadoAdmin ? (
                        <Link href="/projetos" className={cls.btnPrimario}>
                          <Plus size={16} aria-hidden="true" /> Ver projetos
                        </Link>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {projetos.dados.map((item) => (
                    <li key={item.projetoId}>
                      <Link
                        href={`/projetos/${item.projetoId}`}
                        className={`${cls.card} group block h-full overflow-hidden hover:border-brand-200 hover:shadow-card`}
                      >
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-gradient-soft">
                          <div className="absolute inset-0 flex items-center justify-center text-brand-300">
                            <Briefcase size={30} strokeWidth={1.4} aria-hidden="true" />
                          </div>
                          <ImagemRemota url={item.projeto?.urlImagemProjeto} alt="" className="transition-transform duration-300 group-hover:scale-[1.02]" />
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {item.vinculos.map((v) => (
                              <span key={v} className={cls.chip}>
                                {v === "Criador" && <Check size={12} aria-hidden="true" />} {v}
                              </span>
                            ))}
                          </div>
                          <h3 className="font-display mt-2 truncate text-[15px] font-bold text-ink-900 group-hover:text-brand-700">
                            {item.projeto?.nomeProjeto ?? `Projeto #${item.projetoId}`}
                          </h3>
                          {item.projeto?.descricaoProjeto && (
                            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-ink-500">{item.projeto.descricaoProjeto}</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Contador({
  rotulo,
  valor,
  href,
  desabilitarLink = false,
}: {
  rotulo: [singular: string, plural: string];
  valor: number | string | null;
  /** Torna o contador um link (ex.: lista de seguidores). */
  href?: string;
  desabilitarLink?: boolean;
}) {
  const texto = valor === 1 ? rotulo[0] : rotulo[1];
  const numero =
    valor === null ? <span className="inline-block h-4 w-5 animate-pulse rounded bg-ink-100 align-middle" aria-label="carregando" /> : valor;
  if (href && !desabilitarLink) {
    return (
      <div>
        <dt className="sr-only">{texto}</dt>
        <dd>
          <Link href={href} aria-label={valor === null ? texto : `${valor} ${texto}`} className="group flex items-baseline gap-1.5">
            <span className="font-display text-[1.15rem] font-extrabold leading-none text-ink-900">{numero}</span>
            <span aria-hidden="true" className="text-[13px] text-ink-500 group-hover:text-brand-700 group-hover:underline">{texto}</span>
          </Link>
        </dd>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="order-2 text-[13px] text-ink-500">{texto}</dt>
      <dd className="order-1 font-display text-[1.15rem] font-extrabold leading-none text-ink-900">{numero}</dd>
    </div>
  );
}

function ItemSobre({
  icone: Icone,
  rotulo,
  children,
}: {
  icone: LucideIcon;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icone size={17} className="mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">{rotulo}</dt>
        <dd className="mt-0.5 text-ink-800">{children}</dd>
      </div>
    </div>
  );
}

function Vazio({ proprio, texto }: { proprio: boolean; texto: string }) {
  return proprio ? (
    <Link href="/perfil/editar" className="font-medium text-brand-700 hover:underline">
      Adicionar
    </Link>
  ) : (
    <span className="text-ink-400">{texto}</span>
  );
}

export function PerfilSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6" aria-busy="true" aria-label="Carregando perfil">
      <div className={`${cls.card} overflow-hidden`}>
        <div className={`${cls.skeleton} h-[120px] w-full sm:h-[176px] lg:h-[200px]`} />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 h-[112px] w-[112px] rounded-full border-4 border-white bg-ink-100 sm:-mt-[4.5rem] sm:h-[136px] sm:w-[136px]" />
          <div className={`${cls.skeleton} mt-4 h-7 w-56 rounded-lg`} />
          <div className={`${cls.skeleton} mt-3 h-4 w-40 rounded-md`} />
          <div className={`${cls.skeleton} mt-4 h-4 w-72 max-w-full rounded-md`} />
          <div className="mt-5 border-t border-ink-100 pt-4">
            <div className={`${cls.skeleton} h-5 w-64 max-w-full rounded-md`} />
          </div>
        </div>
      </div>
    </div>
  );
}
