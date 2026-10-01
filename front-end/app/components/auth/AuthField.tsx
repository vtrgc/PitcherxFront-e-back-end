"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  label: string;
  /** Ícone decorativo à esquerda (ex.: <Mail size={18} />). */
  icon?: ReactNode;
  /** Mensagem de erro do campo (marca o input como inválido e o associa via aria-describedby). */
  erro?: string;
};

/**
 * Campo padrão das telas de autenticação: label visível, ícone, foco roxo discreto.
 * Campos do tipo "password" ganham o botão de mostrar/ocultar senha.
 */
export default function AuthField({ label, icon, type = "text", erro, ...rest }: AuthFieldProps) {
  const id = useId();
  const idErro = `${id}-erro`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="ax-label">
        {label}
      </label>

      <div className="ax-control">
        {icon && (
          <span className="ax-icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          {...rest}
          id={id}
          type={isPassword && visible ? "text" : type}
          className={`ax-input${isPassword ? " ax-input--password" : ""}`}
          aria-invalid={erro ? true : rest["aria-invalid"]}
          aria-describedby={erro ? idErro : undefined}
        />

        {isPassword && (
          <button
            type="button"
            className="ax-eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        )}
      </div>
      {erro && (
        <p id={idErro} className="ax-field-error">
          {erro}
        </p>
      )}
    </div>
  );
}
