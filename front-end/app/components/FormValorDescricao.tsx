"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { mensagemErro } from "../lib/api";
import { formatarMoeda, parseValorMonetario } from "../lib/validacao";
import { LIMITES } from "../lib/limites";
import { cls } from "./ui/estilos";
import Alerta from "./ui/Alerta";

/** Formulário de descrição + valor opcional (propostas e contra-propostas). */
export default function FormValorDescricao({
  idPrefixo,
  descricaoInicial = "",
  valorInicial = null,
  placeholder,
  rotuloEnviar,
  onEnviar,
  onCancelar,
}: {
  idPrefixo: string;
  descricaoInicial?: string;
  valorInicial?: number | null;
  placeholder: string;
  rotuloEnviar: string;
  onEnviar: (descricao: string, valor: number | null) => Promise<void>;
  onCancelar: () => void;
}) {
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [valor, setValor] = useState(valorInicial != null ? String(valorInicial).replace(".", ",") : "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
    if (!descricao.trim()) {
      setErro("Preencha a descrição.");
      return;
    }
    const numero = parseValorMonetario(valor);
    if (numero !== null && (Number.isNaN(numero) || numero < 0)) {
      setErro("Valor inválido. Use somente números, com até duas casas decimais (ex.: 1500,00).");
      return;
    }
    if (numero !== null && numero > LIMITES.valorMonetario) {
      setErro(`O valor máximo aceito é ${formatarMoeda(LIMITES.valorMonetario)}.`);
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onEnviar(descricao.trim(), numero);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!salvando) enviar();
      }}
    >
      {erro && <Alerta className="mt-4">{erro}</Alerta>}
      <div className="mt-4 grid gap-4">
        <div>
          <label htmlFor={`${idPrefixo}-descricao`} className={cls.label}>
            Descrição
          </label>
          <textarea
            id={`${idPrefixo}-descricao`}
            value={descricao}
            maxLength={2000}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={`${cls.input} resize-y`}
          />
        </div>
        <div className="max-w-xs">
          <label htmlFor={`${idPrefixo}-valor`} className={cls.label}>
            Valor em R$ (opcional)
          </label>
          <input
            id={`${idPrefixo}-valor`}
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="Ex.: 1500,00"
            inputMode="decimal"
            className={cls.input}
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={salvando} className={cls.btnPrimario}>
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {rotuloEnviar}
        </button>
        <button type="button" onClick={onCancelar} disabled={salvando} className={cls.btnSecundario}>
          <X size={16} /> Cancelar
        </button>
      </div>
    </form>
  );
}
