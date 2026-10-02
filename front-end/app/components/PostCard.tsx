"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, MoreHorizontal, ChevronUp, Pencil, Trash2, Loader2, Save, X, ImageOff, Flag } from "lucide-react";

import { useUsuario } from "../hook/useUsuario";
import { useAuth } from "../context/AuthContext";
import { useCurtida } from "../hook/useCurtida";
import { useComentarios } from "../hook/useComentarios";
import { useDenuncia } from "../hook/useDenuncia";
import type { ConexoesUsuario } from "../hook/useConexao";
import BotaoConexao from "./conexao/BotaoConexao";
import { atualizarPostagem, excluirPostagem, removerImagensPostagem, substituirImagensPostagem } from "../services/postagem.service";
import { mensagemErro } from "../lib/api";
import { dataPostagemHoje } from "../lib/date";
import { imagensDaGaleria } from "../lib/galeria";
import { LIMITES } from "../lib/limites";
import { Post } from "../types/Post";
import ComentarioCard from "./ComentarioCard";
import ConteudoOcultado from "./denuncia/ConteudoOcultado";
import ModalDenuncia from "./denuncia/ModalDenuncia";
import CriarComentario from "./CriarComentario";
import GaleriaImagens from "./GaleriaImagens";
import SeletorImagens from "./SeletorImagens";
import Avatar from "./ui/Avatar";
import Alerta from "./ui/Alerta";
import { cls } from "./ui/estilos";
import { useFeedback } from "./ui/FeedbackProvider";

interface Props {
  post: Post;
  /** Chamado após editar/excluir para a lista recarregar. */
  onUpdate?: () => void;
  /** Chamado após excluir (padrão: onUpdate). */
  onExcluido?: () => void;
  /** Abre os comentários já carregados (página da postagem). */
  comentariosAbertos?: boolean;
  /**
   * Conexões do usuário logado (feed/página da publicação): mostra Seguir/Seguindo do autor
   * no cabeçalho, com o mesmo estado das demais telas.
   */
  conexoes?: ConexoesUsuario | null;
}

/** Link público de uma postagem. Usa SEMPRE o ID da postagem (nunca o de um comentário). */
export function linkDaPostagem(idPostagem: number, origem = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origem}/publicacao/${idPostagem}`;
}

function plural(n: number, singular: string, pluralTexto: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? singular : pluralTexto}`;
}

export default function PostCard({ post, onUpdate, onExcluido, comentariosAbertos = false, conexoes }: Props) {
  const { usuario: usuarioLogado, isAdmin } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const { usuario: autor, indisponivel } = useUsuario(post.usuarioId);

  const curtida = useCurtida("POSTAGEM", post.idPostagem, {
    curtido: post.usuarioCurtiu,
    total: post.totalCurtidas,
  });
  const { carregar: carregarCurtida } = curtida;

  const [copiado, setCopiado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(post.tituloPostagem);
  const [texto, setTexto] = useState(post.textoPostagem);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [removendoImagens, setRemovendoImagens] = useState(false);
  const [mostrarComentarios, setMostrarComentarios] = useState(comentariosAbertos);
  const menuRef = useRef<HTMLDivElement>(null);

  const comentarios = useComentarios(post.idPostagem, { automatico: comentariosAbertos });
  const denuncia = useDenuncia("POSTAGEM", post.idPostagem);

  // Se o feed não trouxe o status de curtida, busca individualmente.
  useEffect(() => {
    if (post.usuarioCurtiu === undefined) carregarCurtida();
  }, [post.usuarioCurtiu, carregarCurtida]);

  useEffect(() => {
    if (!menuAberto) return;
    function fechar(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setMenuAberto(false);
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [menuAberto]);

  const ehAutor = !!usuarioLogado && usuarioLogado.idUsuario === post.usuarioId;
  // PUT /postagem só é permitido a USUARIO/EMPRESA; DELETE também a ADMIN.
  const podeEditar = ehAutor && !isAdmin;
  const podeExcluir = ehAutor || isAdmin;
  // PUT/DELETE /postagem/{id}/imagens: autor ou ADMIN (validado no servidor).
  const podeGerenciarImagens = ehAutor || isAdmin;
  // Denunciar: qualquer conta comum que não seja a autora (o admin modera direto).
  const podeDenunciar = denuncia.podeDenunciar && !ehAutor && !isAdmin;
  const imagens = imagensDaGaleria(post.imagens, post.urlImagemPostagem);

  function alternarComentarios() {
    const abrindo = !mostrarComentarios;
    setMostrarComentarios(abrindo);
    if (abrindo && !comentarios.carregado) comentarios.atualizar();
  }

  async function handleCompartilhar() {
    const url = linkDaPostagem(post.idPostagem);
    try {
      if (navigator.share) {
        await navigator.share({ title: post.tituloPostagem, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") notificar("Não foi possível copiar o link.", "erro");
    }
  }

  async function salvarEdicao() {
    if (!titulo.trim() || !texto.trim()) {
      setErroEdicao("Preencha o título e o texto.");
      return;
    }
    setErroEdicao("");
    setSalvando(true);
    try {
      await atualizarPostagem(post.idPostagem, {
        tituloPostagem: titulo.trim(),
        textoPostagem: texto.trim(),
        // O backend exige dataPostagem >= hoje também na edição.
        dataPostagem: dataPostagemHoje(),
        usuarioId: post.usuarioId,
      });
      if (novasImagens.length > 0) {
        try {
          await substituirImagensPostagem(post.idPostagem, novasImagens);
        } catch (error) {
          setErroEdicao(`Texto salvo, mas as imagens não foram enviadas: ${mensagemErro(error, "tente novamente.")}`);
          onUpdate?.();
          return;
        }
      }
      setNovasImagens([]);
      setEditando(false);
      notificar("Publicação atualizada.", "sucesso");
      onUpdate?.();
    } catch (error) {
      setErroEdicao(mensagemErro(error, "Não foi possível salvar a publicação."));
    } finally {
      setSalvando(false);
    }
  }

  async function removerImagens() {
    setMenuAberto(false);
    const ok = await confirmar(`Remover ${imagens.length === 1 ? "a imagem" : `as ${imagens.length} imagens`} desta publicação?`, {
      titulo: "Remover imagens",
      confirmarLabel: "Remover",
      perigo: true,
    });
    if (!ok) return;
    setRemovendoImagens(true);
    try {
      await removerImagensPostagem(post.idPostagem);
      notificar("Imagens removidas.", "sucesso");
      onUpdate?.();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível remover as imagens."));
    } finally {
      setRemovendoImagens(false);
    }
  }

  async function excluir() {
    setMenuAberto(false);
    const ok = await confirmar("Excluir esta publicação? Os comentários dela também serão removidos.", {
      titulo: "Excluir publicação",
      perigo: true,
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await excluirPostagem(post.idPostagem);
      notificar("Publicação excluída.", "sucesso");
      (onExcluido ?? onUpdate)?.();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a publicação."));
    } finally {
      setExcluindo(false);
    }
  }

  const nomeAutor = autor?.nomeUsuario || (indisponivel ? `Usuário #${post.usuarioId}` : "Carregando...");
  const handle = autor?.emailUsuario ? autor.emailUsuario.split("@")[0] : null;
  // Antes de abrir: contagem que veio com a lista (GET /comentario). Depois: a lista carregada.
  const qtdComentarios = comentarios.carregado ? comentarios.comentarios.length : post.totalComentarios;
  const totalComentarios = comentarios.comentarios.length;

  if (podeDenunciar && denuncia.denunciado) {
    return (
      <article className="py-6 border-b border-ink-100 first:pt-1 last:border-b-0">
        <ConteudoOcultado nome="esta publicação" onDesfazer={denuncia.desfazer} />
      </article>
    );
  }

  return (
    <article className="relative py-6 border-b border-ink-100 transition-colors first:pt-1 last:border-b-0" aria-busy={excluindo}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/perfil/${post.usuarioId}`} aria-label={`Perfil de ${nomeAutor}`}>
            <Avatar url={autor?.urlImagemUsuario} nome={nomeAutor} tamanho={44} />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <Link href={`/perfil/${post.usuarioId}`} className="truncate text-[15px] font-bold text-ink-900 hover:underline">
                {nomeAutor}
              </Link>
              {handle && <span className="text-[0.75rem] text-ink-400 truncate">@{handle}</span>}
            </div>
            <p className="text-[0.75rem] text-ink-400">
              <time>{post.dataPostagem}</time>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
        {conexoes && usuarioLogado && !ehAutor && !isAdmin && autor && !conexoes.carregando && !conexoes.erro && (
          <BotaoConexao
            compacto
            relacao={conexoes.relacaoCom(post.usuarioId)}
            ocupado={conexoes.ocupado(post.usuarioId)}
            mostrarResposta={false}
            onSeguir={() => conexoes.seguir({ id: post.usuarioId, nome: autor.nomeUsuario })}
            onDeixarDeSeguir={() => conexoes.deixarDeSeguir({ id: post.usuarioId, nome: autor.nomeUsuario })}
            onCancelar={() => conexoes.cancelarSolicitacao({ id: post.usuarioId, nome: autor.nomeUsuario })}
          />
        )}
        {(podeEditar || podeExcluir || podeDenunciar || (podeGerenciarImagens && imagens.length > 0)) && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className={`${cls.btnIcone} shrink-0`}
              aria-label="Opções da publicação"
              aria-haspopup="menu"
              aria-expanded={menuAberto}
              disabled={excluindo}
            >
              {excluindo ? <Loader2 size={18} className="animate-spin" /> : <MoreHorizontal size={18} />}
            </button>
            {menuAberto && (
              <div role="menu" className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover">
                {podeEditar && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAberto(false);
                      setTitulo(post.tituloPostagem);
                      setTexto(post.textoPostagem);
                      setEditando(true);
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] font-medium text-ink-700 hover:bg-ink-50"
                  >
                    <Pencil size={15} aria-hidden="true" /> Editar
                  </button>
                )}
                {podeGerenciarImagens && imagens.length > 0 && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={removerImagens}
                    disabled={removendoImagens}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] font-medium text-ink-700 hover:bg-ink-50"
                  >
                    <ImageOff size={15} aria-hidden="true" /> Remover imagens
                  </button>
                )}
                {podeExcluir && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={excluir}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} aria-hidden="true" /> Excluir
                  </button>
                )}
                {podeDenunciar && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAberto(false);
                      denuncia.abrir();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] font-medium text-red-600 hover:bg-red-50"
                  >
                    <Flag size={15} aria-hidden="true" /> Denunciar publicação
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </header>
      <ModalDenuncia tipo="POSTAGEM" conteudoId={post.idPostagem} aberto={denuncia.modalAberto} onFechar={denuncia.fechar} />

      {editando ? (
        <form
          className="mt-3 max-w-[640px] space-y-3 sm:pl-[3.75rem]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) salvarEdicao();
          }}
        >
          {erroEdicao && <Alerta>{erroEdicao}</Alerta>}
          <label className="sr-only" htmlFor={`editar-titulo-${post.idPostagem}`}>
            Título
          </label>
          <input
            id={`editar-titulo-${post.idPostagem}`}
            value={titulo}
            maxLength={LIMITES.tituloPostagem}
            onChange={(e) => setTitulo(e.target.value)}
            className={cls.input}
          />
          <label className="sr-only" htmlFor={`editar-texto-${post.idPostagem}`}>
            Texto
          </label>
          <textarea
            id={`editar-texto-${post.idPostagem}`}
            value={texto}
            maxLength={2000}
            rows={4}
            onChange={(e) => setTexto(e.target.value)}
            className={`${cls.input} resize-y`}
          />
          <div>
            <p className="mb-1.5 text-[12.5px] font-semibold text-ink-700">
              {imagens.length > 0 ? `Substituir as ${imagens.length} imagem(ns) atuais (opcional)` : "Adicionar imagens (opcional)"}
            </p>
            <SeletorImagens arquivos={novasImagens} onChange={setNovasImagens} desabilitado={salvando} rotulo="Escolher imagens" />
          </div>
          <p className="text-[12px] text-ink-400">Ao salvar, a data da publicação passa a ser a de hoje (regra da API).</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={salvando} className={cls.btnPrimario}>
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                setNovasImagens([]);
                setErroEdicao("");
              }}
              disabled={salvando}
              className={cls.btnSecundario}
            >
              <X size={15} /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 max-w-[640px] sm:pl-[3.75rem]">
          <h2 className="font-display text-[18px] font-bold leading-snug tracking-tight text-ink-900 break-words">
            {post.tituloPostagem}
          </h2>
          <p className="text-[0.9375rem] leading-[1.65] text-ink-700 mt-1.5 whitespace-pre-line break-words">{post.textoPostagem}</p>
          {imagens.length > 0 && (
            <div className="mt-3" aria-busy={removendoImagens}>
              <GaleriaImagens imagens={imagens} titulo={post.tituloPostagem} />
            </div>
          )}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-0.5 sm:pl-[3.75rem]">
        <button
          type="button"
          onClick={curtida.alternarCurtida}
          disabled={curtida.enviando || !usuarioLogado}
          aria-pressed={curtida.curtido}
          aria-label={`${curtida.curtido ? "Descurtir" : "Curtir"} (${plural(curtida.totalCurtidas, "curtida", "curtidas")})`}
          title={curtida.curtido ? "Remover curtida" : "Curtir"}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed ${
            curtida.curtido ? "text-red-600" : "text-ink-500 hover:bg-ink-50 disabled:opacity-60"
          }`}
        >
          <Heart size={18} className={curtida.curtido ? "fill-red-500 text-red-500" : ""} strokeWidth={1.75} aria-hidden="true" />
          {curtida.carregando ? (
            <span className={`${cls.skeleton} inline-block h-3.5 w-16 rounded`} aria-label="Carregando curtidas" />
          ) : (
            <span>{plural(curtida.totalCurtidas, "curtida", "curtidas")}</span>
          )}
        </button>

        <button
          type="button"
          onClick={alternarComentarios}
          aria-expanded={mostrarComentarios}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
            mostrarComentarios ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50"
          }`}
        >
          <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{qtdComentarios === undefined ? "Comentários" : plural(qtdComentarios, "comentário", "comentários")}</span>
        </button>

        <button
          type="button"
          onClick={handleCompartilhar}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-500 transition-colors hover:bg-ink-50"
        >
          <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline" aria-live="polite">
            {copiado ? "Link copiado!" : "Compartilhar"}
          </span>
        </button>
      </div>

      {mostrarComentarios && (
        <div className="mt-3 border-t border-ink-100 pt-4 sm:pl-[3.75rem]">
          <div className="flex items-center justify-between pr-1">
            <p className={cls.eyebrow}>Comentários</p>
            {!comentariosAbertos && (
              <button
                type="button"
                onClick={() => setMostrarComentarios(false)}
                className={`${cls.btnIcone} !h-7 !w-7`}
                aria-label="Ocultar comentários"
              >
                <ChevronUp size={15} />
              </button>
            )}
          </div>

          {/* O backend só permite comentar a contas USUARIO/EMPRESA. */}
          {usuarioLogado && !isAdmin && (
            <div className="mt-3">
              <CriarComentario
                postagemId={post.idPostagem}
                usuarioId={usuarioLogado.idUsuario}
                atualizarComentarios={comentarios.atualizar}
              />
            </div>
          )}

          <div className="mt-1">
            {comentarios.loading ? (
              <div className="space-y-2 py-4" aria-label="Carregando comentários">
                <div className={`${cls.skeleton} h-3.5 w-1/3 rounded-lg`} />
                <div className={`${cls.skeleton} h-3.5 w-2/3 rounded-lg`} />
              </div>
            ) : comentarios.erro ? (
              <Alerta className="my-3" onTentarNovamente={comentarios.atualizar}>
                {comentarios.erro}
              </Alerta>
            ) : totalComentarios === 0 ? (
              <p className="text-[0.8125rem] text-ink-500 py-4">Nenhum comentário ainda.</p>
            ) : (
              comentarios.comentarios.map((comentario) => (
                <ComentarioCard key={comentario.idComentario} comentario={comentario} aoAlterar={comentarios.atualizar} />
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
