"use client";

import { useCallback, useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useConsultaCep } from "../hook/useConsultaCep";
import { mensagemErro } from "../lib/api";
import { EnderecoCep, formatarCep } from "../lib/cep";
import { somenteDigitos } from "../lib/validacao";
import { LIMITES } from "../lib/limites";
import { Endereco, EnderecoRequest, UFS } from "../types/Endereco";
import { atualizarEndereco, criarEndereco, excluirEndereco } from "../services/endereco.service";
import { cls } from "./ui/estilos";
import Alerta from "./ui/Alerta";
import { useFeedback } from "./ui/FeedbackProvider";
import StatusCep from "./perfil/StatusCep";

type Campos = Omit<EnderecoRequest, "usuarioId" | "numeroCasa"> & { numeroCasa: string };
type Erros = Partial<Record<keyof Campos, string>>;

function inicial(endereco: Endereco | null): Campos {
  return {
    cep: endereco?.cep ?? "",
    uf: endereco?.uf ?? "",
    bairro: endereco?.bairro ?? "",
    logradouro: endereco?.logradouro ?? "",
    complemento: endereco?.complemento ?? "",
    numeroCasa: endereco?.numeroCasa != null ? String(endereco.numeroCasa) : "",
  };
}

export function validarEndereco(c: Campos): Erros {
  const erros: Erros = {};
  if (somenteDigitos(c.cep).length !== 8) erros.cep = "CEP deve ter 8 dígitos.";
  if (!UFS.includes(c.uf as (typeof UFS)[number])) erros.uf = "Selecione o estado.";
  if (!c.logradouro.trim()) erros.logradouro = "Informe o logradouro.";
  else if (c.logradouro.trim().length > LIMITES.textoEndereco) erros.logradouro = `Máximo de ${LIMITES.textoEndereco} caracteres.`;
  if (!c.numeroCasa.trim() || !/^\d{1,9}$/.test(c.numeroCasa.trim())) erros.numeroCasa = "Informe o número.";
  if (!c.bairro.trim()) erros.bairro = "Informe o bairro.";
  else if (c.bairro.trim().length > LIMITES.textoEndereco) erros.bairro = `Máximo de ${LIMITES.textoEndereco} caracteres.`;
  if (!c.complemento.trim()) erros.complemento = "Informe o complemento (ex.: casa, apto 12).";
  return erros;
}

/**
 * Formulário de endereço (POST/PUT /endereco). O DTO do backend exige todos os
 * campos, inclusive o complemento, e limita CEP a 8 caracteres e UF a 2.
 */
export default function FormEndereco({
  usuarioId,
  endereco,
  onSalvo,
  onExcluido,
  compacto = false,
}: {
  usuarioId: number;
  endereco: Endereco | null;
  onSalvo: (e: Endereco) => void;
  onExcluido?: () => void;
  compacto?: boolean;
}) {
  const { confirmar, notificar } = useFeedback();
  const [campos, setCampos] = useState<Campos>(() => inicial(endereco));
  const [erros, setErros] = useState<Erros>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  function set<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  // CEP completo: preenche logradouro, bairro e UF (editáveis). A cidade não é salva pela API.
  const preencher = useCallback((e: EnderecoCep) => {
    setCampos((c) => ({ ...c, logradouro: e.logradouro || c.logradouro, bairro: e.bairro || c.bairro, uf: e.uf || c.uf }));
  }, []);
  const cep = useConsultaCep(preencher);
  const cidade = cep.estado.status === "encontrado" ? cep.estado.endereco.cidade : "";

  async function salvar() {
    const v = validarEndereco(campos);
    setErros(v);
    if (Object.keys(v).length > 0) return;
    setErro("");
    setSalvando(true);
    try {
      const dados: EnderecoRequest = {
        cep: somenteDigitos(campos.cep),
        uf: campos.uf,
        bairro: campos.bairro.trim(),
        logradouro: campos.logradouro.trim(),
        complemento: campos.complemento.trim(),
        numeroCasa: Number(campos.numeroCasa),
        usuarioId,
      };
      const salvo = endereco ? await atualizarEndereco(endereco.idEndereco, dados) : await criarEndereco(dados);
      notificar("Endereço salvo.", "sucesso");
      onSalvo(salvo);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar o endereço."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!endereco) return;
    if (!(await confirmar("Excluir este endereço?", { titulo: "Excluir endereço", perigo: true }))) return;
    setExcluindo(true);
    try {
      await excluirEndereco(endereco.idEndereco);
      notificar("Endereço excluído.", "sucesso");
      onExcluido?.();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível excluir o endereço."));
    } finally {
      setExcluindo(false);
    }
  }

  const campo = (id: keyof Campos, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, classe = "") => (
    <div className={classe}>
      <label htmlFor={`end-${id}`} className={cls.label}>
        {rotulo}
      </label>
      <input
        id={`end-${id}`}
        value={campos[id]}
        onChange={(e) => set(id, e.target.value)}
        aria-invalid={!!erros[id]}
        aria-describedby={erros[id] ? `end-${id}-erro` : undefined}
        className={cls.input}
        {...props}
      />
      {erros[id] && (
        <p id={`end-${id}-erro`} className="mt-1 text-[13px] text-red-600">
          {erros[id]}
        </p>
      )}
    </div>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!salvando) salvar();
      }}
    >
      {erro && <Alerta className="mb-5">{erro}</Alerta>}
      <div className={`grid gap-4 ${compacto ? "md:grid-cols-3" : "sm:grid-cols-2 md:grid-cols-3"}`}>
        <div>
          {campo("cep", "CEP", {
            inputMode: "numeric",
            maxLength: 9,
            placeholder: "00000-000",
            autoComplete: "postal-code",
            value: formatarCep(campos.cep),
            "aria-busy": cep.estado.status === "carregando",
            onChange: (e) => {
              const novo = formatarCep(e.target.value);
              set("cep", novo);
              cep.aoDigitar(novo);
            },
          })}
          <StatusCep estado={cep.estado} id="end-cep-status" onRepetir={cep.repetir} />
          {cidade && <p className="mt-0.5 text-[12px] text-ink-500">Cidade: {cidade} (não é salva pela API)</p>}
        </div>
        <div>
          <label htmlFor="end-uf" className={cls.label}>
            UF
          </label>
          <select
            id="end-uf"
            value={campos.uf}
            onChange={(e) => set("uf", e.target.value)}
            aria-invalid={!!erros.uf}
            className={`${cls.input} !bg-white`}
          >
            <option value="">Selecione</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          {erros.uf && <p className="mt-1 text-[13px] text-red-600">{erros.uf}</p>}
        </div>
        {campo("bairro", "Bairro", { maxLength: LIMITES.textoEndereco })}
        {campo("logradouro", "Logradouro", { maxLength: LIMITES.textoEndereco, autoComplete: "address-line1" }, "sm:col-span-2")}
        {campo("numeroCasa", "Número", { inputMode: "numeric", maxLength: 9 })}
        {campo("complemento", "Complemento", { maxLength: 120, autoComplete: "address-line2" }, "sm:col-span-2 md:col-span-3")}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={salvando} className={cls.btnPrimario}>
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {endereco ? "Salvar endereço" : "Adicionar endereço"}
        </button>
        {endereco && onExcluido && (
          <button type="button" onClick={excluir} disabled={excluindo} className={cls.btnPerigo}>
            {excluindo ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
