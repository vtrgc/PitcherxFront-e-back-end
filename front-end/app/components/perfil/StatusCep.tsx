"use client";

import { AlertCircle, CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { EstadoCep } from "../../hook/useConsultaCep";

/** Mensagem abaixo do campo CEP: consultando, endereço encontrado ou falha. */
export default function StatusCep({ estado, id, onRepetir }: { estado: EstadoCep; id: string; onRepetir?: () => void }) {
  if (estado.status === "ocioso") return null;
  return (
    <p id={id} role="status" aria-live="polite" className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px]">
      {estado.status === "carregando" && (
        <>
          <Loader2 size={13} className="animate-spin text-brand-600" aria-hidden="true" />
          <span className="text-ink-500">Consultando CEP...</span>
        </>
      )}
      {estado.status === "encontrado" && (
        <>
          <CheckCircle2 size={13} className="text-emerald-600" aria-hidden="true" />
          <span className="text-ink-600">
            Endereço encontrado
            {estado.endereco.cidade ? ` — ${estado.endereco.cidade}${estado.endereco.uf ? `/${estado.endereco.uf}` : ""}` : ""}. Confira e
            complete os campos.
          </span>
        </>
      )}
      {estado.status === "falha" && (
        <>
          <AlertCircle size={13} className="text-amber-600" aria-hidden="true" />
          <span className="text-amber-700">{estado.mensagem}</span>
          {estado.motivo === "indisponivel" && onRepetir && (
            <button type="button" onClick={onRepetir} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              <RotateCw size={12} aria-hidden="true" /> Tentar novamente
            </button>
          )}
        </>
      )}
    </p>
  );
}
