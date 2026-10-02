"use client";

import { EyeOff } from "lucide-react";

/** Aviso exibido no lugar de um conteúdo que o próprio usuário denunciou. */
export default function ConteudoOcultado({ nome, onDesfazer, className = "" }: { nome: string; onDesfazer: () => void; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-25 px-4 py-3 text-[13.5px] text-ink-500 ${className}`}>
      <span className="inline-flex items-center gap-2">
        <EyeOff size={15} aria-hidden="true" /> Você denunciou {nome}. Ele(a) está oculto(a) para você.
      </span>
      <button type="button" onClick={onDesfazer} className="font-semibold text-brand-700 hover:underline">
        Desfazer denúncia
      </button>
    </div>
  );
}
