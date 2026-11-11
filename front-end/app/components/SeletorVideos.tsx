"use client";

import { useId, useRef, useState } from "react";
import { Film, X } from "lucide-react";
import { ACCEPT_VIDEO, QUANTIDADE_MAXIMA_VIDEOS, validarArquivosVideo } from "../lib/video";
import { cls } from "./ui/estilos";

function tamanho(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

/** Seleção de vídeos (MP4/WEBM/MOV/MKV, 256 MB cada). Nada é enviado aqui. */
export default function SeletorVideos({
  arquivos,
  onChange,
  maximo = QUANTIDADE_MAXIMA_VIDEOS,
  rotulo = "Escolher vídeos",
  desabilitado = false,
}: {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  maximo?: number;
  rotulo?: string;
  desabilitado?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");

  function adicionar(lista: FileList | null) {
    if (!lista) return;
    const novos = maximo === 1 ? [lista[0]] : [...arquivos, ...Array.from(lista)];
    const invalido = validarArquivosVideo(novos, maximo);
    if (invalido) {
      setErro(invalido);
    } else {
      setErro("");
      onChange(novos);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_VIDEO}
        multiple={maximo > 1}
        className="sr-only"
        disabled={desabilitado}
        onChange={(e) => adicionar(e.target.files)}
      />
      <label htmlFor={id} className={`${cls.btnContorno} !text-[13px] ${desabilitado ? "pointer-events-none opacity-55" : ""}`}>
        <Film size={15} aria-hidden="true" /> {rotulo}
      </label>
      <p className="mt-1.5 text-[12px] text-ink-400">
        MP4, WEBM, MOV ou MKV · até 256 MB cada{maximo > 1 ? ` · até ${maximo} vídeos` : ""}
      </p>
      {erro && (
        <p role="alert" className="mt-1.5 text-[13px] text-red-600">
          {erro}
        </p>
      )}
      {arquivos.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {arquivos.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-ink-25 px-3 py-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 text-ink-700">
                <Film size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                <span className="truncate">{a.name}</span>
                <span className="shrink-0 text-ink-400">{tamanho(a.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(arquivos.filter((_, j) => j !== i))}
                disabled={desabilitado}
                className={`${cls.btnIcone} !h-7 !w-7`}
                aria-label={`Remover ${a.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
