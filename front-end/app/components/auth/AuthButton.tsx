import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type AuthButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type"> & {
  /** Exibe o spinner + `loadingLabel` e desabilita o botão. */
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

/** Botão principal (submit) das telas de autenticação, com estado de carregamento. */
export default function AuthButton({
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...rest
}: AuthButtonProps) {
  return (
    <button
      type="submit"
      className="ax-btn"
      disabled={loading || disabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
