"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Loader2, Calendar, FileSignature, Plus, Users, X, Heart, Images, Upload } from "lucide-react";

import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import FormProjeto from "../../components/FormProjeto";
import ImagemRemota from "../../components/ImagemRemota";
import GaleriaImagens from "../../components/GaleriaImagens";
import SeletorImagens from "../../components/SeletorImagens";
import { imagensDaGaleria } from "../../lib/galeria";
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
import { PerfilUsuario } from "../../types/PerfilUsuario";
import { ProjetoUsuario, TIPOS_VINCULO, TIPO_VINCULO_ID, rotuloVinculo } from "../../types/ProjetoUsuario";
import { buscarProjeto, atualizarProjeto, excluirProjeto, removerImagensProjeto, substituirImagensProjeto } from "../../services/projeto.service";
import { listarTiposProjeto } from "../../services/tipoProjeto.service";
import { listarContratos } from "../../services/contrato.service";
import { listarPerfisUsuario } from "../../services/perfilUsuario.service";
import { listarPorProjeto, vincularUsuario, removerVinculo } from "../../services/projetoUsuario.service";

function BotaoCurtirProjeto({ idProjeto }: { idProjeto: number }) {
  const curtida = useCurtida("PROJETO", idProjeto);
  const { carregar } = curtida;
  useEffect(() => {
    carregar();
  }, [carregar]);
  return (
    <button
      type="button"
      onClick={curtida.alternarCurtida}
      disabled={curtida.enviando || curtida.carregando}
      aria-pressed={curtida.curtido}
      aria-label={`${curtida.curtido ? "Descurtir" : "Curtir"} projeto (${curtida.totalCurtidas})`}
      className="inline-flex items-center gap-1.5 rounded-[0.625rem] border border-white/20 bg-white/10 px-3 py-[0.55rem] text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
    >
      <Heart size={15} className={curtida.curtido ? "fill-accent-400 text-accent-400" : ""} aria-hidden="true" />
      {curtida.totalCurtidas}
    </button>
  );
}

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
  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  // Falhas nas listas auxiliares: sem elas não dá para saber quem é o dono nem se há contratos.
  const [erroMembros, setErroMembros] = useState(false);
  const [erroContratos, setErroContratos] = useState(false);

  const [mostrarFormMembro, setMostrarFormMembro] = useState(false);
  const [novoMembroUsuarioId, setNovoMembroUsuarioId] = useState("");
  const [novoMembroTipoVinculoId, setNovoMembroTipoVinculoId] = useState<number | "">("");
  const [salvandoMembro, setSalvandoMembro] = useState(false);
  const [erroMembro, setErroMembro] = useState("");

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

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const tipoAtual = useMemo(() => tipos.find((t) => t.idTipoProjeto === projeto?.tipoProjetoId), [tipos, projeto]);

  // O backend não guarda o dono do projeto: usamos o vínculo CRIADOR (registrado ao criar).
  const criadores = membros.filter((m) => m.tipoVinculoId === TIPO_VINCULO_ID.CRIADOR);
  const ehCriador = !!usuario && criadores.some((m) => m.usuarioId === usuario.idUsuario);
  // Se a equipe não carregou, não sabemos se há criador: nada é liberado por engano.
  const semCriadorRegistrado = !erroMembros && criadores.length === 0;
  // PUT /projeto e POST /projeto-usuario não são permitidos a ADMIN no backend.
  const podeGerenciar = !isAdmin && (ehCriador || semCriadorRegistrado);
  const podeExcluir = isAdmin || ehCriador || semCriadorRegistrado;
  const podeCriarContrato = isAdmin || podeGerenciar;
  // PUT/DELETE /projeto/{id}/imagens: qualquer usuário vinculado ao projeto ou ADMIN.
  const podeGerenciarImagens = isAdmin || (!!usuario && !erroMembros && membros.some((m) => m.usuarioId === usuario.idUsuario));
  const imagens = imagensDaGaleria(projeto?.imagens, projeto?.urlImagemProjeto);

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
      notificar(mensagemErro(error, "Não foi possível excluir este projeto. Verifique se ele não tem contratos vinculados."));
      setExcluindo(false);
    }
  }

  async function abrirFormMembro() {
    setMostrarFormMembro((v) => !v);
    setErroMembro("");
    if (perfis.length === 0) {
      try {
        setPerfis((await listarPerfisUsuario()) ?? []);
      } catch {
        /* sem a lista, o usuário ainda pode informar o ID */
      }
    }
  }

  async function adicionarMembro() {
    if (!projeto || salvandoMembro) return;
    const usuarioId = Number(novoMembroUsuarioId);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !novoMembroTipoVinculoId) {
      setErroMembro("Selecione a pessoa (ou informe o ID do usuário) e o tipo de vínculo.");
      return;
    }
    // A checagem de duplicidade do backend compara os parâmetros na ordem errada;
    // conferimos aqui para evitar o erro 500 da restrição única do banco.
    if (membros.some((m) => m.usuarioId === usuarioId && m.tipoVinculoId === Number(novoMembroTipoVinculoId))) {
      setErroMembro("Esta pessoa já possui esse vínculo com o projeto.");
      return;
    }

    setErroMembro("");
    setSalvandoMembro(true);
    try {
      const membro = await vincularUsuario({
        projetoId: projeto.idProjeto,
        usuarioId,
        tipoVinculoId: Number(novoMembroTipoVinculoId),
      });
      setMembros((atual) => [...atual, membro]);
      setNovoMembroUsuarioId("");
      setNovoMembroTipoVinculoId("");
      setMostrarFormMembro(false);
      notificar("Membro adicionado.", "sucesso");
    } catch (error) {
      setErroMembro(
        error instanceof ApiError && error.status === 404
          ? "Usuário não encontrado. Confira o ID informado."
          : mensagemErro(error, "Não foi possível adicionar este membro.")
      );
    } finally {
      setSalvandoMembro(false);
    }
  }

  async function removerMembro(membro: ProjetoUsuario) {
    const ultimoCriador = membro.tipoVinculoId === TIPO_VINCULO_ID.CRIADOR && criadores.length === 1;
    const ok = await confirmar(
      ultimoCriador
        ? `Remover ${membro.nomeUsuario}? Ele é o único criador registrado — o projeto ficará sem dono identificado.`
        : `Remover ${membro.nomeUsuario} da equipe?`,
      { titulo: "Remover membro", perigo: true, confirmarLabel: "Remover" }
    );
    if (!ok) return;
    try {
      await removerVinculo(membro.idProjetoUsuario);
      setMembros((atual) => atual.filter((m) => m.idProjetoUsuario !== membro.idProjetoUsuario));
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível remover este membro."));
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

  const idsNaEquipe = new Set(membros.map((m) => m.usuarioId));

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
              <span className={projeto.active ? cls.chipAtivo : cls.chipInativo}>{projeto.active ? "Ativo" : "Inativo"}</span>
            </div>
            <h1 className="font-display mt-3 text-[1.5rem] sm:text-[1.9rem] font-extrabold leading-tight tracking-tight text-white drop-shadow-lg break-words">
              {projeto.nomeProjeto}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <BotaoCurtirProjeto idProjeto={projeto.idProjeto} />
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

      <div className="mt-8">
        {!editando ? (
          <>
            <p className={`${cls.texto} max-w-2xl whitespace-pre-line break-words`}>{projeto.descricaoProjeto}</p>
            <div className="text-[0.8125rem] text-ink-500 mt-5 flex items-center gap-1.5">
              <Calendar size={14} aria-hidden="true" />
              {projeto.dataInicioProjeto} até {projeto.dataFimProjeto}
            </div>
            {semCriadorRegistrado && !isAdmin && (
              <p className="mt-3 text-[12.5px] text-ink-400">
                Este projeto não tem criador registrado; por isso a edição está liberada para usuários autenticados, como no servidor.
              </p>
            )}
          </>
        ) : (
          <section aria-labelledby="titulo-editar-projeto" className="max-w-2xl">
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
        )}
      </div>

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
          {podeCriarContrato && (
            <Link href={`/contratos?projetoId=${projeto.idProjeto}`} className={`${cls.btnSecundario} !text-[13px]`}>
              <Plus size={15} aria-hidden="true" />
              Novo contrato
            </Link>
          )}
        </div>

        {erroContratos ? (
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-equipe" className={cls.eyebrow}>
            <Users size={14} aria-hidden="true" />
            Equipe do projeto
          </h2>

          {podeGerenciar && (
            <button
              type="button"
              onClick={abrirFormMembro}
              aria-expanded={mostrarFormMembro}
              className={`${cls.btnSecundario} !text-[13px]`}
            >
              {mostrarFormMembro ? <X size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
              {mostrarFormMembro ? "Cancelar" : "Adicionar membro"}
            </button>
          )}
        </div>

        {mostrarFormMembro && podeGerenciar && (
          <form
            noValidate
            className={`${cls.composer} mt-4 max-w-xl`}
            onSubmit={(e) => {
              e.preventDefault();
              adicionarMembro();
            }}
          >
            {erroMembro && <Alerta className="mb-4">{erroMembro}</Alerta>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="membro-usuario" className={cls.label}>
                  Pessoa
                </label>
                {perfis.length > 0 ? (
                  <select
                    id="membro-usuario"
                    value={novoMembroUsuarioId}
                    onChange={(e) => setNovoMembroUsuarioId(e.target.value)}
                    className={`${cls.input} !bg-white`}
                  >
                    <option value="">Selecione</option>
                    {perfis.map((p) => (
                      <option key={p.idPerfilUsuario} value={p.usuario.idUsuario}>
                        {p.usuario.nomeUsuario}
                        {idsNaEquipe.has(p.usuario.idUsuario) ? " (já na equipe)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="membro-usuario"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={novoMembroUsuarioId}
                    onChange={(e) => setNovoMembroUsuarioId(e.target.value)}
                    placeholder="ID do usuário"
                    className={cls.input}
                  />
                )}
              </div>

              <div>
                <label htmlFor="membro-vinculo" className={cls.label}>
                  Tipo de vínculo
                </label>
                <select
                  id="membro-vinculo"
                  value={novoMembroTipoVinculoId}
                  onChange={(e) => setNovoMembroTipoVinculoId(e.target.value ? Number(e.target.value) : "")}
                  className={`${cls.input} !bg-white`}
                >
                  <option value="">Selecione</option>
                  {TIPOS_VINCULO.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[0.8125rem] text-ink-500 mt-3">
              {perfis.length > 0
                ? "A lista mostra pessoas que completaram o perfil profissional."
                : "Informe o ID do usuário (aparece no endereço do perfil dele, ex.: /perfil/4)."}{" "}
              <Link href="/termos?aba=vinculo" className="font-semibold text-brand-700 hover:underline">
                Ver termos de vínculo
              </Link>
            </p>

            <button type="submit" disabled={salvandoMembro} className={`${cls.btnPrimario} mt-5 !text-[13px]`}>
              {salvandoMembro ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Adicionar à equipe
            </button>
          </form>
        )}

        {erroMembros ? (
          <Alerta className="mt-4" onTentarNovamente={carregar}>
            Não foi possível carregar a equipe deste projeto. Edição e gestão da equipe ficam indisponíveis até recarregar.
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
                  <p className="text-[0.8125rem] text-ink-500 mt-0.5">Vinculado desde {formatarData(membro.dataVinculo)}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={cls.chip}>{rotuloVinculo(membro.nomeTipoVinculo)}</span>
                  {podeGerenciar && (
                    <button
                      type="button"
                      onClick={() => removerMembro(membro)}
                      aria-label={`Remover ${membro.nomeUsuario} da equipe`}
                      className={cls.btnIconePerigo}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
