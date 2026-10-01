import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, RefreshCw } from "lucide-react";

type Variante = "erro" | "sucesso" | "aviso" | "info";

const ESTILOS: Record<Variante, string> = {
  erro: "border-red-200 bg-red-50 text-red-700",
  sucesso: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aviso: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};

/** Mensagem inline padronizada (erro, sucesso, aviso ou informação). */
export default function Alerta({
  variante = "erro",
  titulo,
  children,
  onTentarNovamente,
  className = "",
}: {
  variante?: Variante;
  titulo?: string;
  children?: ReactNode;
  onTentarNovamente?: () => void;
  className?: string;
}) {
  const Icone = variante === "sucesso" ? CheckCircle2 : variante === "info" ? Info : AlertTriangle;
  return (
    <div
      role={variante === "erro" ? "alert" : "status"}
      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3.5 text-sm ${ESTILOS[variante]} ${className}`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Icone size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          {titulo && <p className="font-semibold">{titulo}</p>}
          {children && <div className={titulo ? "mt-0.5 opacity-90" : ""}>{children}</div>}
        </div>
      </div>
      {onTentarNovamente && (
        <button
          type="button"
          onClick={onTentarNovamente}
          className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 bg-white/60 px-3 py-1.5 text-[13px] font-semibold hover:bg-white"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
