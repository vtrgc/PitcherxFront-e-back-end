"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConsultaCep } from "../../hook/useConsultaCep";
import { EnderecoCep, formatarCep } from "../../lib/cep";
import { CamposEnderecoValor, ErrosEndereco, TEXTO_ENDERECO_MAX } from "../../lib/perfil";
import { UFS } from "../../types/Endereco";
import { cls } from "../ui/estilos";
import StatusCep from "./StatusCep";

/**
 * Campos controlados do endereço (EnderecoRequestDTO). Todos são obrigatórios na API;
 * no perfil público aparece apenas o estado.
 *
 * Ao completar o CEP, o endereço é consultado (lib/cep) e logradouro, bairro e estado são
 * preenchidos; o usuário pode alterá-los. A cidade é só exibida (o backend não a guarda).
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

  // A consulta termina depois do último render: usa o valor mais recente do formulário.
  const valorRef = useRef(valor);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valorRef.current = valor;
    onChangeRef.current = onChange;
  }, [valor, onChange]);

  const preencher = useCallback((e: EnderecoCep) => {
    const atual = valorRef.current;
    onChangeRef.current({
      ...atual,
      logradouro: e.logradouro || atual.logradouro,
      bairro: e.bairro || atual.bairro,
      uf: e.uf || atual.uf,
    });
  }, []);
  const cep = useConsultaCep(preencher);
  const cidade = cep.estado.status === "encontrado" ? cep.estado.endereco.cidade : "";

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
      <div className="sm:col-span-2">
        <label htmlFor={id("cep")} className={cls.label}>
          CEP
        </label>
        <input
          id={id("cep")}
          value={formatarCep(valor.cep)}
          disabled={desabilitado}
          inputMode="numeric"
          maxLength={9}
          placeholder="00000-000"
          autoComplete="postal-code"
          onChange={(e) => {
            const novo = formatarCep(e.target.value);
            set("cep", novo);
            cep.aoDigitar(novo);
          }}
          aria-invalid={!!erros.cep}
          aria-busy={cep.estado.status === "carregando"}
          aria-describedby={[erros.cep ? id("cep-erro") : "", cep.estado.status !== "ocioso" ? id("cep-status") : ""].filter(Boolean).join(" ") || undefined}
          className={cls.input}
        />
        {erros.cep && (
          <p id={id("cep-erro")} className="mt-1 text-[13px] text-red-600">
            {erros.cep}
          </p>
        )}
        <StatusCep estado={cep.estado} id={id("cep-status")} onRepetir={cep.repetir} />
      </div>
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
      {cidade ? (
        <div className="sm:col-span-2">
          <label htmlFor={id("cidade")} className={cls.label}>
            Cidade
          </label>
          <input id={id("cidade")} value={cidade} readOnly aria-describedby={id("cidade-dica")} className={`${cls.input} !bg-ink-25 text-ink-500`} />
          <p id={id("cidade-dica")} className="mt-1 text-[12px] text-ink-400">
            Identificada pelo CEP.
          </p>
        </div>
      ) : null}
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
        cidade ? "sm:col-span-4" : "sm:col-span-6"
      )}
    </div>
  );
}
