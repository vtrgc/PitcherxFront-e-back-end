"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { resolverUrlImagem } from "../lib/image";

/** Uma imagem da galeria; se falhar ao carregar, mostra um aviso discreto (sem 404 quebrado). */
function Miniatura({ url, alt, className = "" }: { url: string; alt: string; className?: string }) {
  const src = resolverUrlImagem(url);
  const [falhou, setFalhou] = useState(false);
  if (!src || falhou) {
    return (
      <span className={`flex h-full w-full items-center justify-center bg-ink-50 text-ink-300 ${className}`}>
        <ImageOff size={22} aria-hidden="true" />
        <span className="sr-only">Imagem indisponível</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/**
 * Galeria de imagens de postagem/projeto (até 10), no estilo de rede social:
 * 1 imagem ocupa a largura; 2–4 em grade; acima de 4, "+N" na última. Clique abre a visualização.
 */
export default function GaleriaImagens({ imagens, titulo }: { imagens: string[]; titulo: string }) {
  const [aberta, setAberta] = useState<number | null>(null);
  if (imagens.length === 0) return null;

  const visiveis = imagens.slice(0, 4);
  const restantes = imagens.length - visiveis.length;
  const grade =
    visiveis.length === 1 ? "grid-cols-1" : visiveis.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2";

  return (
    <>
      <div className={`grid ${grade} gap-1 overflow-hidden rounded-xl border border-ink-100 bg-ink-50`}>
        {visiveis.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setAberta(i)}
            aria-label={`Abrir imagem ${i + 1} de ${imagens.length}`}
            className={`relative block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
              visiveis.length === 1 ? "aspect-[16/10] max-h-[460px]" : visiveis.length === 3 && i === 0 ? "row-span-2 aspect-auto" : "aspect-square"
            }`}
          >
            <Miniatura url={url} alt={`${titulo} — imagem ${i + 1}`} className="transition-transform duration-300 hover:scale-[1.02]" />
            {i === visiveis.length - 1 && restantes > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-void/55 font-display text-2xl font-bold text-white">
                +{restantes}
              </span>
            )}
          </button>
        ))}
      </div>
      {aberta !== null && <Visualizador imagens={imagens} inicial={aberta} titulo={titulo} onFechar={() => setAberta(null)} />}
    </>
  );
}

function Visualizador({ imagens, inicial, titulo, onFechar }: { imagens: string[]; inicial: number; titulo: string; onFechar: () => void }) {
  const [indice, setIndice] = useState(inicial);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const total = imagens.length;
  const ir = useCallback((passo: number) => setIndice((i) => (i + passo + total) % total), [total]);

  useEffect(() => {
    fecharRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function teclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    }
    document.addEventListener("keydown", teclar);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", teclar);
    };
  }, [ir, onFechar]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Imagens de ${titulo}`} className="fixed inset-0 z-[80] flex items-center justify-center bg-void/90 p-4" onClick={onFechar}>
      <button
        ref={fecharRef}
        type="button"
        onClick={onFechar}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} aria-hidden="true" />
      </button>
      <div className="relative flex max-h-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="max-h-[85vh] overflow-hidden rounded-lg">
          <Miniatura url={imagens[indice]} alt={`${titulo} — imagem ${indice + 1} de ${total}`} className="!h-auto max-h-[85vh] !w-auto max-w-full !object-contain" />
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              ir(-1);
            }}
            aria-label="Imagem anterior"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              ir(1);
            }}
            aria-label="Próxima imagem"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold text-white" aria-live="polite">
            {indice + 1} / {total}
          </p>
        </>
      )}
    </div>
  );
}
