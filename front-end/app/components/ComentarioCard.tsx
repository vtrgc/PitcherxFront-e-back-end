"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Trash2, MessageSquare, Loader2, Send, Pencil, Save, X } from "lucide-react";
import { Comentario } from "../types/Comentario";
import { SubComentario } from "../types/SubComentario";
import { useUsuario } from "../hook/useUsuario";
import { useAuth } from "../context/AuthContext";
import { useCurtida } from "../hook/useCurtida";
import { mensagemErro } from "../lib/api";
import { atualizarComentario, excluirComentario } from "../services/comentario.service";
import { atualizarSubComentario, criarSubComentario, excluirSubComentario, listarSubComentarios } from "../services/subComentario.service";
import { autorDaResposta, esquecerRespostaPropria, idsRespostasProprias, registrarRespostaPropria } from "../lib/autoriaRespostas";
import Avatar from "./ui/Avatar";
import { cls } from "./ui/estilos";
import { useFeedback } from "./ui/FeedbackProvider";

interface Props {
  comentario: Comentario;
  /** Chamado após editar/excluir para a lista recarregar. */
  aoAlterar?: () => void;
}

function AutorDesconhecido({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar url={null} nome="" tamanho={tamanho} />
      <span className="truncate text-[13.5px] font-semibold text-ink-500" title="O servidor não informa o autor das respostas">
        Participante
      </span>
    </div>
  );
}

function AutorInfo({ usuarioId, tamanho = 36 }: { usuarioId: number; tamanho?: number }) {
  const { usuario, indisponivel } = useUsuario(usuarioId);
  const nome = usuario?.nomeUsuario || (indisponivel ? `Usuário #${usuarioId}` : "Carregando...");
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Link href={`/perfil/${usuarioId}`} aria-label={`Perfil de ${nome}`}>
        <Avatar url={usuario?.urlImagemUsuario} nome={nome} tamanho={tamanho} />
      </Link>
      <Link href={`/perfil/${usuarioId}`} className="truncate text-[13.5px] font-semibold text-ink-900 hover:underline">
        {nome}
      </Link>
    </div>
  );
}

export default function ComentarioCard({ comentario, aoAlterar }: Props) {
  const { usuario: usuarioLogado, isAdmin } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const curtida = useCurtida("COMENTARIO", comentario.idComentario);
  const { carregar: carregarCurtida } = curtida;

  const [respostas, setRespostas] = useState<SubComentario[]>([]);
  const [respostasCarregadas, setRespostasCarregadas] = useState(false);
  const [carregandoRespostas, setCarregandoRespostas] = useState(false);
  const [erroRespostas, setErroRespostas] = useState("");
  const [mostrarRespostas, setMostrarRespostas] = useState(false);
  const [textoResposta, setTextoResposta] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState(comentario.textoComentario);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarCurtida();
  }, [carregarCurtida]);

  const ehAutor = !!usuarioLogado && usuarioLogado.idUsuario === comentario.usuarioId;
  const podeExcluir = ehAutor || isAdmin;
  // PUT/POST de comentários e respostas: somente USUARIO/EMPRESA no backend.
  const podeEditar = ehAutor && !isAdmin;
  const podeResponder = !!usuarioLogado && !isAdmin;

  async function carregarRespostas() {
    setCarregandoRespostas(true);
    setErroRespostas("");
    try {
      const todas = (await listarSubComentarios()) ?? [];
      setRespostas(
        todas.filter((r) => r.comentarioId === comentario.idComentario).sort((a, b) => a.idSubComentario - b.idSubComentario)
      );
      setRespostasCarregadas(true);
    } catch (error) {
      setErroRespostas(mensagemErro(error, "Não foi possível carregar as respostas."));
    } finally {
      setCarregandoRespostas(false);
    }
  }

  function alternarRespostas() {
    const abrindo = !mostrarRespostas;
    setMostrarRespostas(abrindo);
    if (abrindo && !respostasCarregadas) carregarRespostas();
  }

  async function enviarResposta() {
    if (!usuarioLogado || !textoResposta.trim() || enviandoResposta) return;
    setEnviandoResposta(true);
    try {
      const criada = await criarSubComentario({
        textoSubComentario: textoResposta.trim(),
        comentarioId: comentario.idComentario,
        usuarioId: usuarioLogado.idUsuario,
      });
      if (criada?.idSubComentario) registrarRespostaPropria(usuarioLogado.idUsuario, criada.idSubComentario);
      setTextoResposta("");
      await carregarRespostas();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível enviar a resposta."));
    } finally {
      setEnviandoResposta(false);
    }
  }

  async function excluirResposta(id: number) {
    if (!(await confirmar("Excluir esta resposta?", { titulo: "Excluir resposta", perigo: true }))) return;
    try {
      await excluirSubComentario(id);
      if (usuarioLogado) esquecerRespostaPropria(usuarioLogado.idUsuario, id);
      setRespostas((prev) => prev.filter((r) => r.idSubComentario !== id));
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a resposta."));
    }
  }

  async function excluirEsteComentario() {
    if (!(await confirmar("Excluir este comentário e as respostas dele?", { titulo: "Excluir comentário", perigo: true }))) return;
    setExcluindo(true);
    try {
      await excluirComentario(comentario.idComentario);
      aoAlterar?.();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o comentário."));
    } finally {
      setExcluindo(false);
    }
  }

  async function salvarEdicao() {
    if (!textoEdicao.trim()) return;
    setSalvando(true);
    try {
      await atualizarComentario(comentario.idComentario, {
        textoComentario: textoEdicao.trim(),
        postagemId: comentario.postagemId,
        usuarioId: comentario.usuarioId,
      });
      setEditando(false);
      aoAlterar?.();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível salvar o comentário."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className="relative py-5 border-b border-ink-100 transition-colors first:pt-1 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <AutorInfo usuarioId={comentario.usuarioId} />
        <div className="flex shrink-0 items-center">
          {podeEditar && !editando && (
            <button
              type="button"
              onClick={() => {
                setTextoEdicao(comentario.textoComentario);
                setEditando(true);
              }}
              className={cls.btnIcone}
              aria-label="Editar comentário"
            >
              <Pencil size={15} />
            </button>
          )}
          {podeExcluir && (
            <button
              type="button"
              onClick={excluirEsteComentario}
              disabled={excluindo}
              className={cls.btnIconePerigo}
              aria-label="Excluir comentário"
            >
              {excluindo ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            </button>
          )}
        </div>
      </div>

      {editando ? (
        <form
          className="mt-3 space-y-2 sm:pl-[2.85rem]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) salvarEdicao();
          }}
        >
          <label className="sr-only" htmlFor={`editar-comentario-${comentario.idComentario}`}>
            Editar comentário
          </label>
          <textarea
            id={`editar-comentario-${comentario.idComentario}`}
            value={textoEdicao}
            maxLength={1000}
            rows={2}
            onChange={(e) => setTextoEdicao(e.target.value)}
            className={`${cls.input} resize-y`}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={salvando || !textoEdicao.trim()} className={`${cls.btnPrimario} !text-[13px]`}>
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </button>
            <button type="button" onClick={() => setEditando(false)} className={`${cls.btnSecundario} !text-[13px]`}>
              <X size={14} /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="text-[0.9375rem] leading-[1.65] text-ink-700 mt-2 max-w-[600px] whitespace-pre-line break-words sm:pl-[2.85rem]">
          {comentario.textoComentario}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1 sm:pl-[2.85rem]">
        <button
          type="button"
          onClick={curtida.alternarCurtida}
          disabled={curtida.enviando || curtida.carregando || !usuarioLogado}
          aria-pressed={curtida.curtido}
          aria-label={`${curtida.curtido ? "Descurtir" : "Curtir"} comentário (${curtida.totalCurtidas})`}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed ${
            curtida.curtido ? "text-red-600" : "text-ink-500 hover:bg-ink-50 disabled:opacity-60"
          }`}
        >
          <Heart size={16} className={curtida.curtido ? "fill-red-500 text-red-500" : ""} strokeWidth={1.75} aria-hidden="true" />
          {curtida.totalCurtidas > 0 && <span>{curtida.totalCurtidas}</span>}
        </button>

        <button
          type="button"
          onClick={alternarRespostas}
          aria-expanded={mostrarRespostas}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-50"
        >
          <MessageSquare size={16} strokeWidth={1.75} aria-hidden="true" />
          {mostrarRespostas ? "Ocultar respostas" : podeResponder ? "Responder" : "Ver respostas"}
        </button>
      </div>

      {mostrarRespostas && (
        <div className="mt-3 space-y-3 sm:pl-[2.85rem]">
          {podeResponder && (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                enviarResposta();
              }}
            >
              <label className="sr-only" htmlFor={`resposta-${comentario.idComentario}`}>
                Escreva uma resposta
              </label>
              <input
                id={`resposta-${comentario.idComentario}`}
                value={textoResposta}
                maxLength={1000}
                onChange={(e) => setTextoResposta(e.target.value)}
                placeholder="Escreva uma resposta..."
                className={`${cls.input} h-10 flex-1 text-[13px]`}
              />
              <button
                type="submit"
                disabled={enviandoResposta || !textoResposta.trim()}
                className={`${cls.btnIcone} border border-ink-200`}
                aria-label="Enviar resposta"
              >
                {enviandoResposta ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          )}

          {carregandoRespostas ? (
            <div className="flex items-center gap-2 text-[0.8125rem] text-ink-500">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Carregando respostas...
            </div>
          ) : erroRespostas ? (
            <p className="text-[0.8125rem] text-red-600">
              {erroRespostas}{" "}
              <button type="button" onClick={carregarRespostas} className="font-semibold underline">
                Tentar novamente
              </button>
            </p>
          ) : respostas.length === 0 ? (
            <p className="text-[0.8125rem] text-ink-500">Nenhuma resposta ainda.</p>
          ) : (
            respostas.map((resposta) => (
              <RespostaItem
                key={resposta.idSubComentario}
                resposta={resposta}
                onExcluir={() => excluirResposta(resposta.idSubComentario)}
                onEditada={(texto) =>
                  setRespostas((prev) => prev.map((r) => (r.idSubComentario === resposta.idSubComentario ? { ...r, textoSubComentario: texto } : r)))
                }
              />
            ))
          )}
        </div>
      )}
    </article>
  );
}

/** Uma resposta (subcomentário): autor, curtidas (tipo SUBCOMENTARIO), edição e exclusão. */
function RespostaItem({
  resposta,
  onExcluir,
  onEditada,
}: {
  resposta: SubComentario;
  onExcluir: () => void;
  onEditada: (texto: string) => void;
}) {
  const { usuario: usuarioLogado, isAdmin } = useAuth();
  const { notificar } = useFeedback();
  const curtida = useCurtida("SUBCOMENTARIO", resposta.idSubComentario);
  const { carregar: carregarCurtida } = curtida;
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(resposta.textoSubComentario);
  const [salvando, setSalvando] = useState(false);
  const [proprias] = useState(() => idsRespostasProprias(usuarioLogado?.idUsuario));

  useEffect(() => {
    carregarCurtida();
  }, [carregarCurtida]);

  const autorId = autorDaResposta(resposta, usuarioLogado?.idUsuario, proprias);
  const ehAutor = !!usuarioLogado && autorId === usuarioLogado.idUsuario;
  // PUT /sub-comentario: USUARIO/EMPRESA; DELETE: também ADMIN.
  const podeEditar = ehAutor && !isAdmin;
  const podeExcluir = ehAutor || isAdmin;

  async function salvar() {
    if (!usuarioLogado || !texto.trim()) return;
    setSalvando(true);
    try {
      await atualizarSubComentario(resposta.idSubComentario, {
        textoSubComentario: texto.trim(),
        comentarioId: resposta.comentarioId,
        usuarioId: usuarioLogado.idUsuario,
      });
      onEditada(texto.trim());
      setEditando(false);
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível salvar a resposta."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="border-l-2 border-brand-100 pl-3">
      <div className="flex items-start justify-between gap-2">
        {autorId ? <AutorInfo usuarioId={autorId} tamanho={28} /> : <AutorDesconhecido />}
        <div className="flex shrink-0 items-center">
          {podeEditar && !editando && (
            <button
              type="button"
              onClick={() => {
                setTexto(resposta.textoSubComentario);
                setEditando(true);
              }}
              className={`${cls.btnIcone} !h-7 !w-7`}
              aria-label="Editar resposta"
            >
              <Pencil size={13} />
            </button>
          )}
          {podeExcluir && (
            <button type="button" onClick={onExcluir} className={`${cls.btnIconePerigo} !h-7 !w-7`} aria-label="Excluir resposta">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {editando ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) salvar();
          }}
        >
          <label className="sr-only" htmlFor={`editar-resposta-${resposta.idSubComentario}`}>
            Editar resposta
          </label>
          <textarea
            id={`editar-resposta-${resposta.idSubComentario}`}
            value={texto}
            maxLength={1000}
            rows={2}
            onChange={(e) => setTexto(e.target.value)}
            className={`${cls.input} resize-y text-[13.5px]`}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={salvando || !texto.trim()} className={`${cls.btnPrimario} !px-3 !py-[0.45rem] !text-[12.5px]`}>
              {salvando ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Salvar
            </button>
            <button type="button" onClick={() => setEditando(false)} className={`${cls.btnSecundario} !px-3 !py-[0.45rem] !text-[12.5px]`}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="text-[0.9375rem] leading-[1.65] text-ink-700 mt-2 whitespace-pre-line break-words">{resposta.textoSubComentario}</p>
      )}

      <button
        type="button"
        onClick={curtida.alternarCurtida}
        disabled={curtida.enviando || curtida.carregando || !usuarioLogado}
        aria-pressed={curtida.curtido}
        aria-label={`${curtida.curtido ? "Descurtir" : "Curtir"} resposta (${curtida.totalCurtidas})`}
        className={`mt-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed ${
          curtida.curtido ? "text-red-600" : "text-ink-500 hover:bg-ink-50 disabled:opacity-60"
        }`}
      >
        <Heart size={14} className={curtida.curtido ? "fill-red-500 text-red-500" : ""} strokeWidth={1.75} aria-hidden="true" />
        {curtida.totalCurtidas > 0 && <span>{curtida.totalCurtidas}</span>}
      </button>
    </div>
  );
}
