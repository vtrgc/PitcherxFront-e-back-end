"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { criarComentario } from "../services/comentario.service";
import { mensagemErro } from "../lib/api";
import { useFeedback } from "./ui/FeedbackProvider";

interface Props {
  postagemId: number;
  usuarioId: number;
  atualizarComentarios: () => void;
}

export default function CriarComentario({ postagemId, usuarioId, atualizarComentarios }: Props) {
  const { notificar } = useFeedback();
  const [textoComentario, setTextoComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const campoId = `novo-comentario-${postagemId}`;

  async function publicar() {
    if (!textoComentario.trim() || loading) return;

    setLoading(true);
    try {
      await criarComentario({
        textoComentario: textoComentario.trim(),
        postagemId,
        usuarioId,
      });
      setTextoComentario("");
      atualizarComentarios();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível publicar o comentário."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="relative py-4 pl-5 border-b border-ink-100 before:content-[''] before:absolute before:left-0 before:top-[0.35rem] before:bottom-[0.35rem] before:w-[2px] before:rounded-full before:bg-brand-300 before:opacity-50 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        publicar();
      }}
    >
      <label htmlFor={campoId} className="sr-only">
        Escreva um comentário
      </label>
      <textarea
        id={campoId}
        value={textoComentario}
        maxLength={1000}
        onChange={(e) => setTextoComentario(e.target.value)}
        placeholder="Escreva um comentário..."
        rows={2}
        className="w-full resize-y bg-transparent px-0 py-1 text-[0.9375rem] text-ink-900 outline-none placeholder:text-ink-400"
      />

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading || !textoComentario.trim()}
          className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700"
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          {loading ? "Publicando..." : "Comentar"}
        </button>
      </div>
    </form>
  );
}
