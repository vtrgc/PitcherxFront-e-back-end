"use client";

import { ReactNode } from "react";
import { Plus, type LucideIcon } from "lucide-react";
import { cls } from "../ui/estilos";

/**
 * Cabeçalho padrão das telas administrativas: ícone, título, descrição, total e o botão
 * "+ Cadastrar" (quando a API permite cadastrar pela conta de administrador).
 */
export default function CabecalhoAdmin({
  icone: Icone,
  titulo,
  descricao,
  total,
  rotuloTotal,
  onCadastrar,
  cadastrarDesabilitado = false,
  dicaCadastrar,
  acoes,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao: ReactNode;
  /** Total de registros (null enquanto carrega). */
  total?: number | null;
  rotuloTotal?: [singular: string, plural: string];
  onCadastrar?: () => void;
  cadastrarDesabilitado?: boolean;
  dicaCadastrar?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className={`${cls.card} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icone size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[17px] font-bold text-ink-900">{titulo}</h1>
            {typeof total === "number" && rotuloTotal && (
              <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11.5px] font-bold text-ink-500">
                {total} {total === 1 ? rotuloTotal[0] : rotuloTotal[1]}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[0.8125rem] text-ink-500">{descricao}</div>
        </div>
      </div>
      {(onCadastrar || acoes) && (
        <div className="flex shrink-0 flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          {acoes}
          {onCadastrar && (
            <button
              type="button"
              onClick={onCadastrar}
              disabled={cadastrarDesabilitado}
              title={dicaCadastrar}
              className={`${cls.btnPrimario} !px-4`}
            >
              <Plus size={16} aria-hidden="true" /> Cadastrar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
