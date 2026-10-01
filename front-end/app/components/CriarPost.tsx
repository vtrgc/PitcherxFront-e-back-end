"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Loader2, ImagePlus } from "lucide-react";
import { criarPostagem, substituirImagensPostagem } from "../services/postagem.service";
import { useAuth } from "../context/AuthContext";
import { mensagemErro } from "../lib/api";
import { dataPostagemHoje } from "../lib/date";
import { LIMITES } from "../lib/limites";
import Avatar from "./ui/Avatar";
import Alerta from "./ui/Alerta";
import SeletorImagens from "./SeletorImagens";
import { useFeedback } from "./ui/FeedbackProvider";

interface Props {
  atualizarFeed: () => void;
}

// titulo_postagem é VARCHAR(80) no banco: acima disso o servidor responde 500.
const LIMITE_TITULO = LIMITES.tituloPostagem;
const LIMITE_TEXTO = 2000;

/**
 * Criação de postagem: POST /postagem (JSON) e, se houver imagens, PUT /postagem/{id}/imagens
 * (multipart) logo em seguida — o backend recebe a galeria em um endpoint separado.
 */
export default function CriarPost({ atualizarFeed }: Props) {
  const { usuario } = useAuth();
  const { notificar } = useFeedback();

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);
  const [mostrarImagens, setMostrarImagens] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function publicar() {
    if (!titulo.trim() || !texto.trim()) {
      setErro("Preencha o título e o texto da publicação.");
      return;
    }
    if (!usuario) return;

    setErro("");
    setLoading(true);

    try {
      const criada = await criarPostagem({
        tituloPostagem: titulo.trim(),
        textoPostagem: texto.trim(),
        dataPostagem: dataPostagemHoje(),
        usuarioId: usuario.idUsuario,
      });

      let falhaImagens = "";
      if (imagens.length > 0 && criada?.idPostagem) {
        try {
          await substituirImagensPostagem(criada.idPostagem, imagens);
        } catch (error) {
          falhaImagens = mensagemErro(error, "Não foi possível enviar as imagens.");
        }
      }

      setTitulo("");
      setTexto("");
      setImagens([]);
      setMostrarImagens(false);
      if (falhaImagens) notificar(`Publicação criada, mas as imagens não foram salvas: ${falhaImagens} Você pode adicioná-las editando a publicação.`, "erro");
      else notificar("Publicação criada.", "sucesso");
      atualizarFeed();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível publicar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="criar-post"
      aria-labelledby="criar-post-titulo"
      className="relative scroll-mt-6 py-6 pl-5 border-b border-ink-100 before:content-[''] before:absolute before:left-0 before:top-[0.35rem] before:bottom-[0.35rem] before:w-[2px] before:rounded-full before:bg-brand-300 before:opacity-50 max-w-2xl"
    >
      <div className="flex items-center gap-3">
        <Avatar url={usuario?.urlImagemUsuario} nome={usuario?.nomeUsuario} tamanho={44} />
        <div className="min-w-0">
          <h2 id="criar-post-titulo" className="font-display text-[15px] font-bold text-ink-900">
            {usuario?.nomeUsuario || "Compartilhe uma ideia"}
          </h2>
          <p className="text-[0.75rem] text-ink-400">O que você está construindo hoje?</p>
        </div>
      </div>

      <form
        noValidate
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) publicar();
        }}
      >
        {erro && <Alerta>{erro}</Alerta>}

        <label htmlFor="post-titulo" className="sr-only">
          Título da publicação
        </label>
        <input
          id="post-titulo"
          value={titulo}
          maxLength={LIMITE_TITULO}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da publicação"
          className="w-full border-0 border-b border-ink-200 bg-transparent px-0 pb-2 text-[17px] font-bold text-ink-900 outline-none placeholder:font-bold placeholder:text-ink-400 focus:border-brand-500"
        />

        <label htmlFor="post-texto" className="sr-only">
          Texto da publicação
        </label>
        <textarea
          id="post-texto"
          value={texto}
          maxLength={LIMITE_TEXTO}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Sobre o que você quer falar?"
          rows={3}
          className="w-full resize-y bg-transparent px-0 py-1 text-[0.9375rem] text-ink-900 outline-none placeholder:text-ink-400"
        />

        {mostrarImagens && <SeletorImagens arquivos={imagens} onChange={setImagens} desabilitado={loading} />}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMostrarImagens((v) => !v)}
              aria-expanded={mostrarImagens}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <ImagePlus size={16} aria-hidden="true" />
              Imagens{imagens.length > 0 ? ` (${imagens.length})` : ""}
            </button>
            <span className="text-[12px] text-ink-400" aria-live="polite">
              {texto.length}/{LIMITE_TEXTO}
            </span>
            <Link href="/termos" className="hidden text-[12px] text-ink-400 underline-offset-2 hover:text-brand-700 hover:underline sm:inline">
              Termos de publicação
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700 hover:shadow-[0_2px_6px_-1px_rgba(107,33,224,0.35)] min-w-[140px] text-[13px]"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                Publicando...
              </>
            ) : (
              <>
                <Send size={15} aria-hidden="true" />
                Publicar
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
