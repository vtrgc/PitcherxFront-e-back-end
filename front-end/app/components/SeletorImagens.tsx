"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { ACCEPT_FOTO } from "../lib/imagemPerfil";
import { validarArquivosGaleria } from "../lib/galeria";
import { LIMITES } from "../lib/limites";

/**
 * Seleção de até 10 imagens (JPG/PNG/WEBP, 10 MB cada) com prévia local.
 * Nada é enviado aqui: a tela decide quando chamar PUT .../imagens.
 */
export default function SeletorImagens({
  arquivos,
  onChange,
  rotulo = "Adicionar imagens",
  desabilitado = false,
}: {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  rotulo?: string;
  desabilitado?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");
  const previas = useMemo(() => arquivos.map((a) => ({ arquivo: a, url: URL.createObjectURL(a) })), [arquivos]);

  useEffect(() => () => previas.forEach((p) => URL.revokeObjectURL(p.url)), [previas]);

  function adicionar(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    const novos = [...arquivos, ...Array.from(lista)];
    const mensagem = validarArquivosGaleria(novos);
    if (mensagem) {
      setErro(mensagem);
    } else {
      setErro("");
      onChange(novos);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  const cheio = arquivos.length >= LIMITES.imagensGaleria;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {previas.map((p, i) => (
          <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Prévia ${i + 1}: ${p.arquivo.name}`} className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={desabilitado}
              onClick={() => {
                setErro("");
                onChange(arquivos.filter((_, j) => j !== i));
              }}
              aria-label={`Remover ${p.arquivo.name}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-void/70 text-white hover:bg-void"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        ))}
        {!cheio && (
          <label
            htmlFor={id}
            className={`flex h-20 min-w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-ink-200 px-3 text-center text-[11.5px] font-semibold text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-700 ${
              desabilitado ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <ImagePlus size={18} aria-hidden="true" />
            {arquivos.length === 0 ? rotulo : "Mais"}
          </label>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT_FOTO}
          multiple
          disabled={desabilitado}
          onChange={(e) => adicionar(e.target.files)}
          className="sr-only"
        />
      </div>
      <p className="mt-1.5 text-[12px] text-ink-400">
        {arquivos.length}/{LIMITES.imagensGaleria} · JPG, PNG ou WEBP de até 10 MB cada.
      </p>
      {erro && (
        <p role="alert" className="mt-1 text-[12.5px] font-medium text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
