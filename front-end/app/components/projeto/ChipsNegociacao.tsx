import { cls } from "../ui/estilos";

const ROTULO: Record<string, string> = {
  PENDENTE: "Pendente",
  ACEITA: "Aceita",
  ACEITE: "Aceito",
  RECUSADA: "Recusada",
  REJEITADA: "Rejeitada",
};

const ESTILO_PENDENTE =
  "inline-flex items-center rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200";
const ESTILO_NEGATIVO =
  "inline-flex items-center rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold bg-red-50 text-red-700 border border-red-200";

/** Status de proposta, contraproposta ou contrato. */
export function ChipStatusNegociacao({ status }: { status: string | null | undefined }) {
  const s = status || "PENDENTE";
  const classe = s === "PENDENTE" ? ESTILO_PENDENTE : s === "ACEITA" || s === "ACEITE" ? cls.chipAtivo : ESTILO_NEGATIVO;
  return <span className={classe}>{ROTULO[s] ?? s}</span>;
}
