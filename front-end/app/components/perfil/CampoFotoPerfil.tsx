"use client";

import { useId, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw, Trash2, ImageUp } from "lucide-react";
import Avatar from "../ui/Avatar";
import { cls } from "../ui/estilos";
import { ACCEPT_FOTO, FotoPendente, liberarFoto, prepararFoto } from "../../lib/imagemPerfil";

/**
 * Seleção da foto de perfil com prévia. Não envia nada: devolve a alteração pendente
 * (`nova` ou `remover`) para a página, que envia ao clicar em "Salvar".
 */
export default function CampoFotoPerfil({
  urlAtual,
  nome,
  pendente,
  onChange,
  desabilitado = false,
  permitirRemover = true,
}: {
  urlAtual: string | null | undefined;
  nome?: string;
  pendente: FotoPendente;
  onChange: (foto: FotoPendente) => void;
  desabilitado?: boolean;
  permitirRemover?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const idAjuda = useId();
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState("");
  const [arrastando, setArrastando] = useState(false);

  async function usarArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro("");
    setLendo(true);
    const r = await prepararFoto(arquivo);
    setLendo(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    liberarFoto(pendente);
    onChange(r.foto);
  }

  function desfazer() {
    liberarFoto(pendente);
    onChange(null);
    setErro("");
  }

  const previewUrl = pendente?.tipo === "nova" ? pendente.previewUrl : pendente?.tipo === "remover" ? null : urlAtual;
  const temFotoAtual = !!urlAtual;

  return (
    <div
      className={`flex flex-col items-center gap-5 rounded-2xl border border-dashed p-5 text-center transition-colors sm:flex-row sm:items-center sm:text-left ${
        arrastando ? "border-brand-400 bg-brand-50/60" : "border-ink-200 bg-ink-25"
      }`}
      onDragOver={(e) => {
        if (desabilitado) return;
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        if (!desabilitado) usarArquivo(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="relative shrink-0">
        <Avatar
          key={previewUrl ?? "sem-foto"}
          url={previewUrl}
          nome={nome}
          tamanho={104}
          moldura={false}
          className="rounded-full border-4 border-white object-cover shadow-card"
        />
        {lendo && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70" role="status">
            <Loader2 size={22} className="animate-spin text-brand-600" aria-hidden="true" />
            <span className="sr-only">Lendo imagem…</span>
          </span>
        )}
        {pendente && (
          <span
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
              pendente.tipo === "nova" ? "bg-brand-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {pendente.tipo === "nova" ? "Nova" : "Será removida"}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-bold text-ink-900">Foto de perfil</p>
        <p id={idAjuda} className="mt-1 text-[0.8125rem] leading-5 text-ink-500">
          JPG, PNG ou WEBP de até 10 MB. Prefira uma imagem quadrada, com o rosto centralizado.
          {pendente?.tipo === "nova" && " A nova foto será enviada quando você salvar."}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_FOTO}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="input-foto"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            usarArquivo(arquivo);
          }}
        />

        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={desabilitado || lendo}
            aria-describedby={idAjuda}
            className={cls.btnContorno}
          >
            {temFotoAtual || pendente?.tipo === "nova" ? <Camera size={16} aria-hidden="true" /> : <ImageUp size={16} aria-hidden="true" />}
            {temFotoAtual || pendente?.tipo === "nova" ? "Alterar foto" : "Adicionar foto"}
          </button>
          {pendente ? (
            <button type="button" onClick={desfazer} disabled={desabilitado} className={cls.btnSecundario}>
              <RotateCcw size={16} aria-hidden="true" />
              {pendente.tipo === "nova" ? "Descartar nova foto" : "Manter foto"}
            </button>
          ) : (
            permitirRemover &&
            temFotoAtual && (
              <button
                type="button"
                onClick={() => onChange({ tipo: "remover" })}
                disabled={desabilitado}
                className={cls.btnPerigo}
              >
                <Trash2 size={16} aria-hidden="true" />
                Remover foto
              </button>
            )
          )}
        </div>

        {erro && (
          <p role="alert" className="mt-2 text-[13px] font-medium text-red-600">
            {erro}
          </p>
        )}
      </div>
    </div>
  );
}
