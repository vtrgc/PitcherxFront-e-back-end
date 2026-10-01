import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/** Mensagem de erro (padrão) ou sucesso, com aparência consistente nas duas telas. */
export default function AuthAlert({
  variant = "error",
  children,
}: {
  variant?: "error" | "success";
  children: ReactNode;
}) {
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`ax-alert ax-alert--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <p className="m-0">{children}</p>
    </div>
  );
}
