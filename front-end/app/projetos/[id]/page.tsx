"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  FileSignature,
  Plus,
  Users,
  X,
  Heart,
  Images,
  Upload,
  Share2,
  Flag,
  Building2,
  Info,
  Lock,
  Clock,
  Tag,
  UserRound,
  Activity,
  type LucideIcon,
} from "lucide-react";

import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import FormProjeto from "../../components/FormProjeto";
import ImagemRemota from "../../components/ImagemRemota";
import GaleriaImagens from "../../components/GaleriaImagens";
import SeletorImagens from "../../components/SeletorImagens";
import { imagensDaGaleria } from "../../lib/galeria";
import PainelFinanceiro from "../../components/projeto/PainelFinanceiro";
import PainelVotos from "../../components/projeto/PainelVotos";
import ModalDenuncia from "../../components/denuncia/ModalDenuncia";
import ConteudoOcultado from "../../components/denuncia/ConteudoOcultado";
import Avatar from "../../components/ui/Avatar";
import { useDenuncia } from "../../hook/useDenuncia";
import { ROTULO_SITUACAO, formatarDias, linhaDoTempo } from "../../lib/projeto";
import { Empresa, listarEmpresas } from "../../services/empresa.service";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useAuth } from "../../context/AuthContext";
import { useCurtida } from "../../hook/useCurtida";
import { ApiError, mensagemErro } from "../../lib/api";
import { formatarData, formatarDataHora } from "../../lib/date";
import { Projeto, ProjetoRequest } from "../../types/Projeto";
import { TipoProjeto } from "../../types/TipoProjeto";
import { Contrato } from "../../types/Contrato";
import { ProjetoUsuario, TIPO_VINCULO_ID, rotuloVinculo } from "../../types/ProjetoUsuario";
import {
  buscarProjeto,
  atualizarProjeto,
  atualizarMetaFinanceira,
  atualizarValorArrecadado,
  excluirProjeto,
  removerImagensProjeto,
  substituirImagensProjeto,
} from "../../services/projeto.service";
import { listarTiposProjeto } from "../../services/tipoProjeto.service";
import { listarContratos } from "../../services/contrato.service";
import { listarPorProjeto, ehParteDoContrato, temAcessoAoProjeto, vinculoDoUsuario } from "../../services/projetoUsuario.service";
import PortaoTermosVinculo from "../../components/projeto/PortaoTermosVinculo";
import TermosVinculoProjeto from "../../components/projeto/TermosVinculoProjeto";
import { MinhaParticipacao, SolicitacoesDoProjeto } from "../../components/projeto/SolicitacoesVinculo";

/** Botão "Votar" (curtida do projeto) com a contagem real de votos. */
function BotaoVotarProjeto({ curtida, desabilitado }: { curtida: ReturnType<typeof useCurtida>; desabilitado: boolean }) {
  return (
    <button
      type="button"
      onClick={curtida.alternarCurtida}
      disabled={desabilitado || curtida.enviando || curtida.carregando}
      aria-pressed={curtida.curtido}
      aria-label={`${curtida.curtido ? "Remover voto" : "Votar"} no projeto (${curtida.totalCurtidas} voto${curtida.totalCurtidas === 1 ? "" : "s"})`}
      className="inline-flex items-center gap-1.5 rounded-[0.625rem] border border-white/20 bg-white/10 px-3 py-[0.55rem] text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
    >
      <Heart size={15} className={curtida.curtido ? "fill-accent-400 text-accent-400" : ""} aria-hidden="true" />
      {curtida.curtido ? "Votado" : "Votar"} · {curtida.totalCurtidas.toLocaleString("pt-BR")}
    </button>
  );
}

const BOTAO_HERO =
  "inline-flex items-center gap-1.5 rounded-[0.625rem] border border-white/20 bg-white/10 px-3 py-[0.55rem] text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60";

export default function ProjetoDetalhePage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { isAuthenticated, isAdmin, usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [tipos, setTipos] = useState<TipoProjeto[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [membros, setMembros] = useState<ProjetoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  // Falhas nas listas auxiliares: sem elas não dá para saber quem é o dono nem se há contratos.
  const [erroMembros, setErroMembros] = useState(false);
  const [erroContratos, setErroContratos] = useState(false);

  // Empresas cadastradas: identificam "empresas relacionadas" e o voto das empresas.
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(true);
  const [erroEmpresas, setErroEmpresas] = useState("");

  const curtida = useCurtida("PROJETO", id);
  const { carregar: carregarCurtida } = curtida;
  const denuncia = useDenuncia("PROJETO", id);

  const [gerenciandoImagens, setGerenciandoImagens] = useState(false);
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [salvandoImagens, setSalvandoImagens] = useState(false);

  const carregar = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setNaoEncontrado(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErroCarregamento("");
    setNaoEncontrado(false);
    try {
      const [dadosProjeto, listaTipos, rContratos, rMembros] = await Promise.all([
        buscarProjeto(id),
        listarTiposProjeto().catch(() => [] as TipoProjeto[]),
        listarContratos().then(
          (v) => ({ ok: true as const, v }),
          () => ({ ok: false as const, v: [] as Contrato[] })
        ),
        listarPorProjeto(id).then(
          (v) => ({ ok: true as const, v }),
          () => ({ ok: false as const, v: [] as ProjetoUsuario[] })
        ),
      ]);
      setProjeto(dadosProjeto);
      setTipos(listaTipos ?? []);
      setContratos((rContratos.v ?? []).filter((c) => c.projetoId === id));
      setErroContratos(!rContratos.ok);
      setMembros(rMembros.v ?? []);
      setErroMembros(!rMembros.ok);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNaoEncontrado(true);
      else setErroCarregamento(mensagemErro(error, "Não foi possível carregar o projeto."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const recarregarEquipe = useCallback(async () => {
    try {
      setMembros((await listarPorProjeto(id)) ?? []);
      setErroMembros(false);
    } catch {
      setErroMembros(true);
    }
  }, [id]);

  const carregarEmpresas = useCallback(async () => {
    setCarregandoEmpresas(true);
    setErroEmpresas("");
    try {
      setEmpresas(await listarEmpresas({ admin: isAdmin }));
    } catch (error) {
      setErroEmpresas(mensagemErro(error, "Não foi possível carregar as empresas para apurar os votos."));
    } finally {
      setCarregandoEmpresas(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  useEffect(() => {
    if (isAuthenticated && Number.isInteger(id) && id > 0) {
      carregarCurtida();
      carregarEmpresas();
    }
  }, [isAuthenticated, id, carregarCurtida, carregarEmpresas]);

  async function compartilhar() {
    if (!projeto) return;
    const url = `${window.location.origin}/projetos/${projeto.idProjeto}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: projeto.nomeProjeto, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notificar("Link do projeto copiado.", "sucesso");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") notificar("Não foi possível copiar o link. Copie o endereço da barra do navegador.", "erro");
    }
  }

  const tipoAtual = useMemo(() => tipos.find((t) => t.idTipoProjeto === projeto?.tipoProjetoId), [tipos, projeto]);

  // Dono do projeto = vínculo CRIADOR (o backend o registra em POST /projeto/{idUsuario}).
  const criadores = membros.filter((m) => m.tipoVinculoId === TIPO_VINCULO_ID.CRIADOR);
  const ehCriador = !!usuario && criadores.some((m) => m.usuarioId === usuario.idUsuario);
  // Projetos antigos podem não ter criador. Se a equipe não carregou, nada é liberado por engano.
  const semCriadorRegistrado = !erroMembros && criadores.length === 0;
  // PUT /projeto não é permitido a ADMIN no backend.
  const podeGerenciar = !isAdmin && (ehCriador || semCriadorRegistrado);
  const podeExcluir = isAdmin || ehCriador || semCriadorRegistrado;
  const podeCriarContrato = isAdmin || podeGerenciar;
  // Regra de acesso do backend (validarAcessoProjeto): só quem tem vínculo vê os detalhes.
  const meuVinculo = vinculoDoUsuario(membros, usuario?.idUsuario);
  const acessoLiberado = isAdmin || temAcessoAoProjeto(membros, usuario?.idUsuario);
  // Contratos = registro de autoria (antiplágio): só as partes do projeto e o admin os veem.
  const ehParte = !erroMembros && ehParteDoContrato(membros, usuario?.idUsuario);
  const podeVerContratos = isAdmin || ehParte;
  // O backend aceita PUT/DELETE de imagens de qualquer vinculado; visualizadores não alteram a galeria.
  const podeGerenciarImagens = isAdmin || ehParte || (podeGerenciar && semCriadorRegistrado);
  const imagens = imagensDaGaleria(projeto?.imagens, projeto?.urlImagemProjeto);
  const podeDenunciar = denuncia.podeDenunciar && !isAdmin && !ehParte && !erroMembros;

  async function salvarImagens() {
    if (!projeto || novasImagens.length === 0) return;
    setSalvandoImagens(true);
    try {
      const atualizado = await substituirImagensProjeto(projeto.idProjeto, novasImagens);
      setProjeto(atualizado ?? (await buscarProjeto(projeto.idProjeto)));
      setNovasImagens([]);
      setGerenciandoImagens(false);
      notificar("Galeria atualizada.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível enviar as imagens."));
    } finally {
      setSalvandoImagens(false);
    }
  }

  async function removerImagens() {
    if (!projeto) return;
    const ok = await confirmar("Remover todas as imagens deste projeto?", { titulo: "Remover imagens", confirmarLabel: "Remover", perigo: true });
    if (!ok) return;
    setSalvandoImagens(true);
    try {
      await removerImagensProjeto(projeto.idProjeto);
      setProjeto({ ...projeto, imagens: [], urlImagemProjeto: null });
      notificar("Imagens removidas.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível remover as imagens."));
    } finally {
      setSalvandoImagens(false);
    }
  }

  async function salvar(dados: ProjetoRequest) {
    if (!projeto) return;
    const atualizado = await atualizarProjeto(projeto.idProjeto, dados);
    setProjeto(atualizado);
    setEditando(false);
    notificar("Projeto atualizado.", "sucesso");
  }

  async function atualizarValores({ meta, captado }: { meta?: number; captado?: number }) {
    if (!projeto) return;
    const metaSalva = meta !== undefined ? await atualizarMetaFinanceira(projeto.idProjeto, meta) : undefined;
    const captadoSalvo = captado !== undefined ? await atualizarValorArrecadado(projeto.idProjeto, captado) : undefined;
    const ficha = { ...(projeto.ficha ?? {}) };
    if (typeof metaSalva === "number") ficha.meta = metaSalva;
    if (typeof captadoSalvo === "number") ficha.captado = captadoSalvo;
    setProjeto({
      ...projeto,
      metaFinanceira: typeof metaSalva === "number" ? metaSalva : projeto.metaFinanceira,
      valorArrecadado: typeof captadoSalvo === "number" ? captadoSalvo : projeto.valorArrecadado,
      ficha,
    });
    notificar("Valores atualizados.", "sucesso");
  }

  async function excluir() {
    if (!projeto) return;
    // contrato.id_projeto não tem cascade: com contratos vinculados o servidor recusa (erro 500).
    if (erroContratos) {
      notificar("Não foi possível verificar os contratos deste projeto. Recarregue a página e tente novamente.");
      return;
    }
    if (contratos.length > 0) {
      notificar(
        `Este projeto tem ${contratos.length} contrato${contratos.length === 1 ? "" : "s"} vinculado${contratos.length === 1 ? "" : "s"}. Exclua os contratos antes de excluir o projeto.`
      );
      return;
    }
    const ok = await confirmar(`Excluir o projeto "${projeto.nomeProjeto}"? Essa ação não pode ser desfeita.`, {
      titulo: "Excluir projeto",
      perigo: true,
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await excluirProjeto(projeto.idProjeto);
      notificar("Projeto excluído.", "sucesso");
      router.push(isAdmin ? "/admin/projetos" : "/projetos");
    } catch (error) {
      notificar(
        mensagemErro(error, "Não foi possível excluir este projeto. Verifique se ele não tem contratos ou solicitações de participação registradas.")
      );
      setExcluindo(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className={`${cls.card} p-6`} aria-label="Carregando projeto">
          <div className={`${cls.skeleton} h-40 w-full rounded-xl`} />
          <div className={`${cls.skeleton} mt-6 h-6 w-56 rounded-lg`} />
          <div className={`${cls.skeleton} mt-3 h-4 w-full rounded-lg`} />
        </div>
      </PageShell>
    );
  }

  const voltar = isAdmin ? { href: "/admin/projetos", rotulo: "Voltar para projetos (admin)" } : { href: "/projetos", rotulo: "Voltar para projetos" };

  if (erroCarregamento || naoEncontrado || !projeto) {
    return (
      <PageShell>
        <Link href={voltar.href} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> {voltar.rotulo}
        </Link>
        {erroCarregamento ? (
          <Alerta titulo="Erro ao carregar o projeto" onTentarNovamente={carregar}>
            {erroCarregamento}
          </Alerta>
        ) : (
          <div className={cls.card}>
            <EmptyState icon={FileSignature} title="Projeto não encontrado" description="Ele pode ter sido excluído." />
          </div>
        )}
      </PageShell>
    );
  }

  // Equipe = criador, sócios e investidores; visualizadores apenas acompanham o projeto.
  const idsNaEquipe = new Set(membros.filter((m) => m.tipoVinculoId !== TIPO_VINCULO_ID.VISUALIZADOR).map((m) => m.usuarioId));
  const tempo = linhaDoTempo(projeto);
  const empresasPorId = new Map(empresas.map((e) => [e.idUsuario, e]));
  // Autor(es): vínculo CRIADOR. Empresas relacionadas: membros da equipe que são empresas.
  const autores = criadores.filter((m, i, l) => l.findIndex((x) => x.usuarioId === m.usuarioId) === i);
  const empresasRelacionadas = [...new Set(membros.map((m) => m.usuarioId))]
    .map((uid) => ({ empresa: empresasPorId.get(uid), vinculos: membros.filter((m) => m.usuarioId === uid).map((m) => rotuloVinculo(m.nomeTipoVinculo)) }))
    .filter((x): x is { empresa: Empresa; vinculos: string[] } => !!x.empresa);
  const contagemVinculo = (tipo: number) => new Set(membros.filter((m) => m.tipoVinculoId === tipo).map((m) => m.usuarioId)).size;

  if (!acessoLiberado) {
    return (
      <PageShell>
        <Link href={voltar.href} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> {voltar.rotulo}
        </Link>
        <div className="relative -mx-4 mt-4 overflow-hidden rounded-[1.25rem] sm:-mx-8 lg:-mx-10">
          <div className="relative h-48 w-full bg-brand-gradient sm:h-56">
            <ImagemRemota url={projeto.urlImagemProjeto} alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
          </div>
          <div className="absolute inset-x-5 bottom-5 sm:inset-x-10 sm:bottom-6">
            <div className="flex flex-wrap gap-2">
              <span className={`${cls.chip} !bg-accent-500 !text-white !border-transparent`}>{tipoAtual?.nomeTipoProjeto || "Projeto"}</span>
              <span className={tempo.situacao === "em_andamento" ? cls.chipAtivo : cls.chipInativo}>{ROTULO_SITUACAO[tempo.situacao]}</span>
            </div>
            <h1 className="font-display mt-3 text-[1.5rem] sm:text-[1.9rem] font-extrabold leading-tight tracking-tight text-white drop-shadow-lg break-words">
              {projeto.nomeProjeto}
            </h1>
          </div>
        </div>
        {erroMembros ? (
          <Alerta className="mt-8" titulo="Não foi possível verificar seu acesso" onTentarNovamente={carregar}>
            A equipe do projeto não carregou, então não dá para saber se você já aceitou os termos de vínculo.
          </Alerta>
        ) : (
          <PortaoTermosVinculo
            projetoId={projeto.idProjeto}
            onAceito={async () => {
              await recarregarEquipe();
              notificar("Termos aceitos. Agora você acompanha este projeto.", "sucesso");
            }}
          />
        )}
      </PageShell>
    );
  }

  if (podeDenunciar && denuncia.denunciado) {
    return (
      <PageShell>
        <Link href={voltar.href} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> {voltar.rotulo}
        </Link>
        <ConteudoOcultado nome="este projeto" onDesfazer={denuncia.desfazer} className="mt-4" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link href={voltar.href} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} aria-hidden="true" />
        {voltar.rotulo}
      </Link>

      <div className="relative -mx-4 mt-4 overflow-hidden rounded-[1.25rem] sm:-mx-8 lg:-mx-10">
        <div className="relative h-60 w-full bg-brand-gradient sm:h-64">
          <ImagemRemota url={projeto.urlImagemProjeto} alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
        </div>

        <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-4 sm:inset-x-10 sm:bottom-6">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`${cls.chip} !bg-accent-500 !text-white !border-transparent`}>{tipoAtual?.nomeTipoProjeto || "Projeto"}</span>
              <span className={tempo.situacao === "em_andamento" ? cls.chipAtivo : cls.chipInativo}>{ROTULO_SITUACAO[tempo.situacao]}</span>
            </div>
            <h1 className="font-display mt-3 text-[1.5rem] sm:text-[1.9rem] font-extrabold leading-tight tracking-tight text-white drop-shadow-lg break-words">
              {projeto.nomeProjeto}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <BotaoVotarProjeto curtida={curtida} desabilitado={!usuario} />
            <button type="button" onClick={compartilhar} className={BOTAO_HERO} aria-label="Compartilhar projeto">
              <Share2 size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
            {podeDenunciar && !denuncia.denunciado && (
              <button type="button" onClick={denuncia.abrir} className={BOTAO_HERO} aria-label="Denunciar projeto" title="Denunciar projeto">
                <Flag size={15} aria-hidden="true" />
              </button>
            )}
            {podeGerenciar && !editando && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex items-center gap-1.5 rounded-[0.625rem] border border-white/20 bg-white/10 px-3 py-[0.55rem] text-sm font-semibold text-white hover:bg-white/20"
              >
                <Pencil size={15} aria-hidden="true" />
                Editar
              </button>
            )}
            {podeExcluir && (
              <button
                type="button"
                onClick={excluir}
                disabled={excluindo}
                aria-label="Excluir projeto"
                className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-red-500/30 disabled:opacity-60"
              >
                {excluindo ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <ModalDenuncia tipo="PROJETO" conteudoId={projeto.idProjeto} aberto={denuncia.modalAberto} onFechar={denuncia.fechar} />

      {editando ? (
        <section aria-labelledby="titulo-editar-projeto" className="mt-8 max-w-2xl">
          <h2 id="titulo-editar-projeto" className={cls.eyebrow}>
            Editar projeto
          </h2>
          <FormProjeto
            projeto={projeto}
            tipos={tipos}
            rotuloEnviar="Salvar alterações"
            onEnviar={salvar}
            onCancelar={() => setEditando(false)}
          />
        </section>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="min-w-0 space-y-6">
            <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-sobre-projeto">
              <h2 id="titulo-sobre-projeto" className={cls.eyebrow}>
                <Info size={14} aria-hidden="true" /> Sobre o projeto
              </h2>
              <p className={`${cls.texto} mt-3 whitespace-pre-line break-words`}>{projeto.descricaoProjeto || "Sem descrição."}</p>
              {semCriadorRegistrado && !isAdmin && (
                <p className="mt-3 text-[12.5px] text-ink-400">
                  Este projeto não tem criador registrado; por isso a edição está liberada para usuários autenticados, como no servidor.
                </p>
              )}
            </section>

            <aside className="grid gap-6 md:grid-cols-2" aria-label="Informações do projeto">
            <section className={`${cls.card} p-5`} aria-labelledby="titulo-info-projeto">
              <h2 id="titulo-info-projeto" className="font-display text-[16px] font-bold text-ink-900">
                Informações principais
              </h2>
              <dl className="mt-4 space-y-3.5 text-[14px]">
                <InfoLinha icone={Tag} rotulo="Categoria">
                  {tipoAtual ? (
                    <Link href="/tipos-projeto" className="font-semibold text-brand-700 hover:underline">
                      {tipoAtual.nomeTipoProjeto}
                    </Link>
                  ) : (
                    "—"
                  )}
                </InfoLinha>
                <InfoLinha icone={Activity} rotulo="Status">
                  {ROTULO_SITUACAO[tempo.situacao]}
                  {tempo.diasRestantes !== null && <span className="text-ink-500"> · faltam {formatarDias(tempo.diasRestantes)}</span>}
                  {tempo.diasParaComecar !== null && <span className="text-ink-500"> · começa em {formatarDias(tempo.diasParaComecar)}</span>}
                </InfoLinha>
                <InfoLinha icone={Calendar} rotulo="Período">
                  {projeto.dataInicioProjeto} até {projeto.dataFimProjeto}
                </InfoLinha>
                <InfoLinha icone={Clock} rotulo="Duração">
                  {formatarDias(tempo.duracaoDias)}
                </InfoLinha>
                {tempo.prazoDecorrido !== null && tempo.situacao !== "inativo" && (
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${tempo.prazoDecorrido}%` }} />
                    </div>
                    <p className="mt-1 text-[12px] text-ink-500">{Math.round(tempo.prazoDecorrido)}% do prazo decorrido</p>
                  </div>
                )}
                <InfoLinha icone={Users} rotulo="Equipe">
                  {erroMembros ? (
                    "Indisponível"
                  ) : (
                    <>
                      {idsNaEquipe.size} pessoa{idsNaEquipe.size === 1 ? "" : "s"}
                      <span className="block text-[12.5px] text-ink-500">
                        {contagemVinculo(TIPO_VINCULO_ID.SOCIO)} sócio(s) · {contagemVinculo(TIPO_VINCULO_ID.INVESTIDOR)} investidor(es) ·{" "}
                        {contagemVinculo(TIPO_VINCULO_ID.VISUALIZADOR)} acompanhando
                      </span>
                    </>
                  )}
                </InfoLinha>
                <InfoLinha icone={Images} rotulo="Imagens">
                  {imagens.length}
                </InfoLinha>
              </dl>
            </section>

            <section className={`${cls.card} p-5`} aria-labelledby="titulo-autor">
              <h2 id="titulo-autor" className="font-display text-[16px] font-bold text-ink-900">
                Autor{autores.length > 1 ? "es" : ""}
              </h2>
              {erroMembros ? (
                <p className="mt-3 text-[13px] text-ink-500">Não foi possível carregar a equipe.</p>
              ) : autores.length === 0 ? (
                <p className="mt-3 text-[13px] text-ink-500">Nenhum criador registrado.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {autores.map((a) => (
                    <PessoaDoProjeto key={a.usuarioId} id={a.usuarioId} nome={a.nomeUsuario} detalhe={`Criador desde ${formatarData(a.dataVinculo)}`} empresa={empresasPorId.get(a.usuarioId)} />
                  ))}
                </ul>
              )}

              <h3 className="mt-5 flex items-center gap-1.5 border-t border-ink-100 pt-4 text-[13px] font-semibold text-ink-800">
                <Building2 size={14} aria-hidden="true" /> Empresas relacionadas
              </h3>
              {carregandoEmpresas ? (
                <div className={`${cls.skeleton} mt-3 h-8 w-full rounded-lg`} aria-label="Carregando empresas" />
              ) : erroEmpresas ? (
                <p className="mt-2 text-[12.5px] text-ink-500">Indisponível no momento.</p>
              ) : empresasRelacionadas.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-500">Nenhuma empresa na equipe deste projeto.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {empresasRelacionadas.map(({ empresa, vinculos }) => (
                    <PessoaDoProjeto key={empresa.idUsuario} id={empresa.idUsuario} nome={empresa.nome} detalhe={vinculos.join(", ")} empresa={empresa} url={empresa.urlImagem} />
                  ))}
                </ul>
              )}
            </section>
          </aside>

            {!isAdmin && !ehCriador && meuVinculo && <MinhaParticipacao projetoId={projeto.idProjeto} meuVinculo={meuVinculo} />}

            <PainelFinanceiro
              ficha={projeto.ficha}
              riscos={projeto.riscos}
              podeEditar={podeGerenciar}
              onEditar={() => setEditando(true)}
              onAtualizarValores={podeGerenciar ? atualizarValores : undefined}
            />

            <PainelVotos
              projetoId={projeto.idProjeto}
              totalVotos={curtida.totalCurtidas}
              carregandoTotal={curtida.carregando}
              empresas={empresas}
              carregandoEmpresas={carregandoEmpresas}
              erroEmpresas={erroEmpresas}
              versao={String(curtida.curtido)}
              onTentarNovamente={carregarEmpresas}
            />
          </div>

        </div>
      )}

      {(imagens.length > 0 || podeGerenciarImagens) && (
        <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-galeria">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titulo-galeria" className={cls.eyebrow}>
              <Images size={14} aria-hidden="true" />
              Galeria {imagens.length > 0 && `(${imagens.length})`}
            </h2>
            {podeGerenciarImagens && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGerenciandoImagens((v) => !v);
                    setNovasImagens([]);
                  }}
                  aria-expanded={gerenciandoImagens}
                  className={`${cls.btnSecundario} !text-[13px]`}
                >
                  {gerenciandoImagens ? <X size={15} aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
                  {gerenciandoImagens ? "Cancelar" : imagens.length > 0 ? "Substituir imagens" : "Adicionar imagens"}
                </button>
                {imagens.length > 0 && !gerenciandoImagens && (
                  <button type="button" onClick={removerImagens} disabled={salvandoImagens} className={`${cls.btnPerigo} !text-[13px]`}>
                    {salvandoImagens ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} aria-hidden="true" />}
                    Remover todas
                  </button>
                )}
              </div>
            )}
          </div>

          {gerenciandoImagens && podeGerenciarImagens && (
            <div className={`${cls.composer} mt-4`}>
              <p className={`${cls.textoSuave} mb-3`}>
                As imagens escolhidas substituem toda a galeria atual. A primeira vira a capa do projeto.
              </p>
              <SeletorImagens arquivos={novasImagens} onChange={setNovasImagens} desabilitado={salvandoImagens} rotulo="Escolher imagens" />
              <button
                type="button"
                onClick={salvarImagens}
                disabled={salvandoImagens || novasImagens.length === 0}
                className={`${cls.btnPrimario} mt-4 !text-[13px]`}
              >
                {salvandoImagens ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} aria-hidden="true" />}
                Salvar galeria
              </button>
            </div>
          )}

          {imagens.length > 0 ? (
            <div className="mt-4 max-w-3xl">
              <GaleriaImagens imagens={imagens} titulo={projeto.nomeProjeto} />
            </div>
          ) : (
            !gerenciandoImagens && <p className="text-[0.8125rem] text-ink-500 mt-5">Nenhuma imagem adicionada ainda.</p>
          )}
        </section>
      )}

      <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-contratos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-contratos" className={cls.eyebrow}>
            <FileSignature size={14} aria-hidden="true" />
            Contratos deste projeto
          </h2>
          {podeCriarContrato && podeVerContratos && (
            <Link href={`/contratos?projetoId=${projeto.idProjeto}`} className={`${cls.btnSecundario} !text-[13px]`}>
              <Plus size={15} aria-hidden="true" />
              Novo contrato
            </Link>
          )}
        </div>

        {!podeVerContratos ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-ink-25 px-4 py-3 text-[13px] text-ink-500">
            <Lock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            Os contratos registram a autoria do projeto (verificador antiplágio) e ficam visíveis apenas para o criador, os sócios,
            os investidores e a administração.
          </p>
        ) : erroContratos ? (
          <Alerta className="mt-4" onTentarNovamente={carregar}>
            Não foi possível carregar os contratos deste projeto.
          </Alerta>
        ) : contratos.length === 0 ? (
          <p className="text-[0.8125rem] text-ink-500 mt-5">Nenhum contrato vinculado a este projeto ainda.</p>
        ) : (
          <ul className="mt-3">
            {contratos.map((contrato) => (
              <li key={contrato.idContrato}>
                <Link
                  href={`/contratos/${contrato.idContrato}`}
                  className="flex items-center justify-between gap-3 border-b border-ink-100 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{contrato.tituloContrato}</h3>
                    <p className="text-[0.8125rem] text-ink-500 mt-0.5">
                      {formatarDataHora(contrato.dataInicioContrato)} — {formatarDataHora(contrato.dataFimContrato)}
                    </p>
                  </div>
                  <span className={`${contrato.active ? cls.chipAtivo : cls.chipInativo} shrink-0`}>
                    {contrato.active ? "Ativo" : "Inativo"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-equipe">
        <h2 id="titulo-equipe" className={cls.eyebrow}>
          <Users size={14} aria-hidden="true" />
          Equipe do projeto
        </h2>
        <p className="mt-2 text-[13px] text-ink-500">
          Visitantes entram aceitando os termos de vínculo; sócios e investidores entram por solicitações aprovadas pelo criador.
        </p>

        {erroMembros ? (
          <Alerta className="mt-4" onTentarNovamente={carregar}>
            Não foi possível carregar a equipe deste projeto. Edição e gestão ficam indisponíveis até recarregar.
          </Alerta>
        ) : membros.length === 0 ? (
          <p className="text-[0.8125rem] text-ink-500 mt-5">Nenhum membro vinculado a este projeto ainda.</p>
        ) : (
          <ul className="mt-3">
            {membros.map((membro) => (
              <li key={membro.idProjetoUsuario} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 py-4 last:border-b-0">
                <div className="min-w-0">
                  <Link href={`/perfil/${membro.usuarioId}`} className="font-display text-[14.5px] font-semibold text-ink-900 hover:underline">
                    {membro.nomeUsuario}
                  </Link>
                  <p className="text-[0.8125rem] text-ink-500 mt-0.5">
                    Vinculado desde {formatarData(membro.dataVinculo)}
                    {membro.aceitouTermos && membro.dataAceite && ` · termos aceitos em ${formatarData(membro.dataAceite)}`}
                  </p>
                </div>
                <span className={membro.tipoVinculoId === TIPO_VINCULO_ID.VISUALIZADOR ? cls.chipInativo : cls.chip}>
                  {rotuloVinculo(membro.nomeTipoVinculo)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!erroMembros && (ehCriador || isAdmin || ehParte) && (
        <TermosVinculoProjeto projetoId={projeto.idProjeto} podeEditar={ehCriador && !isAdmin} podeExcluir={ehCriador || isAdmin} />
      )}

      {ehCriador && usuario && !isAdmin && (
        <SolicitacoesDoProjeto projetoId={projeto.idProjeto} idCriador={usuario.idUsuario} onMudancaEquipe={recarregarEquipe} />
      )}
    </PageShell>
  );
}

function InfoLinha({ icone: Icone, rotulo, children }: { icone: LucideIcon; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icone size={16} className="mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-400">{rotulo}</dt>
        <dd className="mt-0.5 break-words text-ink-800">{children}</dd>
      </div>
    </div>
  );
}

function PessoaDoProjeto({
  id,
  nome,
  detalhe,
  empresa,
  url,
}: {
  id: number;
  nome: string;
  detalhe?: string;
  empresa?: Empresa;
  url?: string | null;
}) {
  return (
    <li>
      <Link href={`/perfil/${id}`} className="group flex items-center gap-2.5">
        <Avatar url={url ?? empresa?.urlImagem} nome={nome} tamanho={36} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-ink-900 group-hover:underline">
            {nome}
            {empresa ? <Building2 size={13} className="shrink-0 text-brand-600" aria-label="Empresa" /> : <UserRound size={13} className="shrink-0 text-ink-400" aria-hidden="true" />}
          </span>
          {detalhe && <span className="block truncate text-[12px] text-ink-500">{detalhe}</span>}
        </span>
      </Link>
    </li>
  );
}
