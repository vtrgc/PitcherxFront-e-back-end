"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Trash2, ChevronDown, MessageSquare, ThumbsUp, ImageOff, ExternalLink, Images } from "lucide-react";
import GaleriaImagens from "../../components/GaleriaImagens";
import { imagensDaGaleria } from "../../lib/galeria";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { ListaAdmin } from "../../components/admin/ListaAdmin";
import Paginacao from "../../components/admin/Paginacao";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import Avatar from "../../components/ui/Avatar";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { buscarContagemCurtidas, TIPO_CONTEUDO } from "../../services/curtida.service";
import { Post } from "../../types/Post";
import { Usuario } from "../../types/Usuario";
import { Comentario } from "../../types/Comentario";
import { listarPostagens, excluirPostagem, removerImagensPostagem } from "../../services/postagem.service";
import { listarUsuarios } from "../../services/usuario.service";
import { listarComentarios, excluirComentario } from "../../services/comentario.service";

export default function AdminPostagensPage() {
  const { pronto } = useRequireAdmin();

  const [postagens, setPostagens] = useState<Post[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [curtidas, setCurtidas] = useState<Record<number, number | "carregando" | "erro">>({});
  const { notificar, confirmar } = useFeedback();

  async function carregar() {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaPostagens, listaUsuarios, listaComentarios] = await Promise.all([
        listarPostagens(),
        listarUsuarios().catch(() => []),
        listarComentarios().catch(() => []),
      ]);
      setPostagens(listaPostagens);
      setUsuarios(listaUsuarios);
      setComentarios(listaComentarios);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as postagens."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pronto) carregar();

  }, [pronto]);

  const mapaUsuarios = useMemo(() => new Map(usuarios.map((u) => [u.idUsuario, u])), [usuarios]);

  const comentariosPorPostagem = useMemo(() => {
    const mapa = new Map<number, Comentario[]>();
    comentarios.forEach((c) => {
      const lista = mapa.get(c.postagemId) ?? [];
      lista.push(c);
      mapa.set(c.postagemId, lista);
    });
    return mapa;
  }, [comentarios]);

  const ordenadas = useMemo(() => [...postagens].sort((a, b) => b.idPostagem - a.idPostagem), [postagens]);
  const lista = useListagemAdmin(ordenadas, (p) => [p.tituloPostagem, p.textoPostagem, p.dataPostagem, mapaUsuarios.get(p.usuarioId)?.nomeUsuario]);

  async function excluir(id: number, titulo: string) {
    if (!(await confirmar(`Excluir permanentemente a postagem "${titulo}"? Os comentários dela também serão removidos.`, { titulo: "Excluir postagem", perigo: true }))) return;
    setProcessandoId(id);
    try {
      await excluirPostagem(id);
      setPostagens((atual) => atual.filter((p) => p.idPostagem !== id));
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir esta postagem."));
    } finally {
      setProcessandoId(null);
    }
  }

  /** DELETE /postagem/{id}/imagens — permitido a ADMIN (moderação de imagens). */
  async function removerImagens(post: Post) {
    if (!(await confirmar(`Remover as imagens da postagem "${post.tituloPostagem}"?`, { titulo: "Remover imagens", confirmarLabel: "Remover", perigo: true }))) return;
    setProcessandoId(post.idPostagem);
    try {
      await removerImagensPostagem(post.idPostagem);
      setPostagens((atual) => atual.map((p) => (p.idPostagem === post.idPostagem ? { ...p, imagens: [], urlImagemPostagem: null } : p)));
      notificar("Imagens removidas.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível remover as imagens."));
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirComentarioModeracao(idComentario: number) {
    if (!(await confirmar("Excluir este comentário e as respostas dele?", { titulo: "Excluir comentário", perigo: true }))) return;
    try {
      await excluirComentario(idComentario);
      setComentarios((atual) => atual.filter((c) => c.idComentario !== idComentario));
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir este comentário."));
    }
  }

  async function alternarExpandido(idPostagem: number) {
    const abrindo = expandidoId !== idPostagem;
    setExpandidoId(abrindo ? idPostagem : null);
    if (!abrindo || typeof curtidas[idPostagem] === "number") return;
    setCurtidas((c) => ({ ...c, [idPostagem]: "carregando" }));
    try {
      const total = await buscarContagemCurtidas(TIPO_CONTEUDO.POSTAGEM, idPostagem);
      setCurtidas((c) => ({ ...c, [idPostagem]: total }));
    } catch {
      setCurtidas((c) => ({ ...c, [idPostagem]: "erro" }));
    }
  }

  if (!pronto) {
    return <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-ink-100 after:absolute after:inset-0 after:animate-skeleton-sweep after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:content-['']" />;
  }

  return (
    <>
      <CabecalhoAdmin
        icone={FileText}
        titulo="Postagens"
        descricao="Visualização e moderação. Publicações são criadas e editadas pelos autores no Feed: a API não permite que a conta de administrador publique ou edite postagens."
        total={loading ? null : postagens.length}
        rotuloTotal={["postagem", "postagens"]}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por título, texto, data ou autor..."
        rotulo="Pesquisar postagens"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={postagens.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => lista.setTermo("")}
        icone={FileText}
        tituloVazio="Nenhuma postagem publicada ainda"
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="postagens" />}
      >
            {lista.itens.map((p) => {
              const autor = mapaUsuarios.get(p.usuarioId);
              const comentariosPost = comentariosPorPostagem.get(p.idPostagem) ?? [];
              const curtidasPost = curtidas[p.idPostagem];
              const imagensPost = imagensDaGaleria(p.imagens, p.urlImagemPostagem);

              return (
                <li key={p.idPostagem}>
                  <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-brand-50/50 sm:px-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar url={autor?.urlImagemUsuario} nome={autor?.nomeUsuario ?? "Usuário"} tamanho={34} />
                      <div className="min-w-0">
                        <h3 className="font-display truncate text-[14px] font-bold text-ink-900">{p.tituloPostagem}</h3>
                        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-500">{p.textoPostagem}</p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {autor?.nomeUsuario ?? `Usuário #${p.usuarioId}`} · {p.dataPostagem} · {comentariosPost.length} comentário
                          {comentariosPost.length === 1 ? "" : "s"}
                          {imagensPost.length > 0 && (
                            <span className="ml-1 inline-flex items-center gap-1">
                              · <Images size={11} aria-hidden="true" /> {imagensPost.length}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/publicacao/${p.idPostagem}`}
                        className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                        title="Abrir publicação"
                        aria-label={`Abrir a postagem ${p.tituloPostagem}`}
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => alternarExpandido(p.idPostagem)}
                        aria-expanded={expandidoId === p.idPostagem}
                        className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full text-ink-500 transition-colors hover:-translate-y-px hover:bg-brand-50 hover:text-brand-700 active:scale-[0.92]"
                        title="Ver comentários"
                        aria-label={`Ver comentários da postagem ${p.tituloPostagem}`}
                      >
                        <ChevronDown size={16} className={`transition-transform ${expandidoId === p.idPostagem ? "rotate-180" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => excluir(p.idPostagem, p.tituloPostagem)}
                        disabled={processandoId === p.idPostagem}
                        className="inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-full text-ink-500 transition-colors hover:-translate-y-px hover:bg-[#FEF2F2] hover:text-[#DC2626] active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-55"
                        title="Excluir postagem"
                        aria-label={`Excluir postagem ${p.tituloPostagem}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandidoId === p.idPostagem && (
                    <div className="border-t border-ink-100 bg-ink-25 px-5 py-4">
                      {imagensPost.length > 0 && (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                              <Images size={13} /> Imagens ({imagensPost.length})
                            </p>
                            <button
                              type="button"
                              onClick={() => removerImagens(p)}
                              disabled={processandoId === p.idPostagem}
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <ImageOff size={13} aria-hidden="true" /> Remover imagens
                            </button>
                          </div>
                          <div className="max-w-md">
                            <GaleriaImagens imagens={imagensPost} titulo={p.tituloPostagem} />
                          </div>
                        </div>
                      )}
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                          <MessageSquare size={13} />
                          Comentários ({comentariosPost.length})
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                          <ThumbsUp size={12} />
                          {curtidasPost === "carregando" || curtidasPost === undefined
                            ? "…"
                            : curtidasPost === "erro"
                            ? "Curtidas indisponíveis"
                            : `${curtidasPost} curtida${curtidasPost === 1 ? "" : "s"} na postagem`}
                        </p>
                      </div>

                      {comentariosPost.length === 0 ? (
                        <p className="text-[12.5px] text-ink-400">Nenhum comentário nesta postagem.</p>
                      ) : (
                        <ul className="space-y-2">
                          {comentariosPost.map((c) => (
                            <li key={c.idComentario} className="flex items-start justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-[11.5px] font-semibold text-ink-700">
                                  {mapaUsuarios.get(c.usuarioId)?.nomeUsuario ?? `Usuário #${c.usuarioId}`}
                                </p>
                                <p className="mt-0.5 text-[12.5px] text-ink-600">{c.textoComentario}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => excluirComentarioModeracao(c.idComentario)}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                                title="Excluir comentário"
                              >
                                <Trash2 size={13} />
                              </button>
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
