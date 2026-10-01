"use client";

import { CamposEnderecoValor, ErrosEndereco, TEXTO_ENDERECO_MAX } from "../../lib/perfil";
import { UFS } from "../../types/Endereco";
import { cls } from "../ui/estilos";

/**
 * Campos controlados do endereço (EnderecoRequestDTO). Todos são obrigatórios na API;
 * no perfil público aparece apenas o estado.
 */
export default function CamposEndereco({
  valor,
  onChange,
  erros,
  desabilitado = false,
  prefixoId = "end",
}: {
  valor: CamposEnderecoValor;
  onChange: (v: CamposEnderecoValor) => void;
  erros: ErrosEndereco;
  desabilitado?: boolean;
  prefixoId?: string;
}) {
  const set = <K extends keyof CamposEnderecoValor>(campo: K, v: CamposEnderecoValor[K]) =>
    onChange({ ...valor, [campo]: v });
  const id = (c: string) => `${prefixoId}-${c}`;

  const campo = (
    chave: keyof CamposEnderecoValor,
    rotulo: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    classe = ""
  ) => (
    <div className={classe}>
      <label htmlFor={id(chave)} className={cls.label}>
        {rotulo}
      </label>
      <input
        id={id(chave)}
        value={valor[chave]}
        disabled={desabilitado}
        onChange={(e) => set(chave, e.target.value)}
        aria-invalid={!!erros[chave]}
        aria-describedby={erros[chave] ? id(`${chave}-erro`) : undefined}
        className={cls.input}
        {...props}
      />
      {erros[chave] && (
        <p id={id(`${chave}-erro`)} className="mt-1 text-[13px] text-red-600">
          {erros[chave]}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      {campo(
        "cep",
        "CEP",
        {
          inputMode: "numeric",
          maxLength: 9,
          placeholder: "00000-000",
          autoComplete: "postal-code",
          onChange: (e) => set("cep", e.target.value.replace(/[^\d-]/g, "")),
        },
        "sm:col-span-2"
      )}
      <div className="sm:col-span-2">
        <label htmlFor={id("uf")} className={cls.label}>
          Estado
        </label>
        <select
          id={id("uf")}
          value={valor.uf}
          disabled={desabilitado}
          onChange={(e) => set("uf", e.target.value)}
          aria-invalid={!!erros.uf}
          aria-describedby={erros.uf ? id("uf-erro") : undefined}
          className={`${cls.input} !bg-white`}
        >
          <option value="">Selecione</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        {erros.uf && (
          <p id={id("uf-erro")} className="mt-1 text-[13px] text-red-600">
            {erros.uf}
          </p>
        )}
      </div>
      {campo("bairro", "Bairro", { maxLength: TEXTO_ENDERECO_MAX }, "sm:col-span-2")}
      {campo("logradouro", "Logradouro", { maxLength: TEXTO_ENDERECO_MAX, autoComplete: "address-line1" }, "sm:col-span-4")}
      {campo(
        "numeroCasa",
        "Número",
        { inputMode: "numeric", maxLength: 9, onChange: (e) => set("numeroCasa", e.target.value.replace(/\D/g, "")) },
        "sm:col-span-2"
      )}
      {campo(
        "complemento",
        "Complemento",
        { maxLength: 120, autoComplete: "address-line2", placeholder: "Ex.: casa, apto 12" },
        "sm:col-span-6"
      )}
    </div>
  );
}
