"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { isoParaInputDataHora } from "../lib/date";
import { mensagemErro } from "../lib/api";
import { Contrato, ContratoRequest } from "../types/Contrato";
import { Projeto } from "../types/Projeto";
import { cls } from "./ui/estilos";
import Alerta from "./ui/Alerta";

/** Formulário de contrato (ContratoRequestDTO: datas LocalDateTime em ISO). */
export default function FormContrato({
  contrato,
  projetos,
  projetoFixo,
  projetoInicial,
  onEnviar,
  onCancelar,
}: {
  contrato?: Contrato | null;
  /** Projetos que podem ser vinculados (ignorado quando `projetoFixo` é informado). */
  projetos: Projeto[];
  projetoFixo?: number;
  projetoInicial?: number | "";
  onEnviar: (dados: ContratoRequest) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(contrato?.tituloContrato ?? "");
  const [descricao, setDescricao] = useState(contrato?.descricaoContrato ?? "");
  const [dataInicio, setDataInicio] = useState(isoParaInputDataHora(contrato?.dataInicioContrato));
  const [dataFim, setDataFim] = useState(isoParaInputDataHora(contrato?.dataFimContrato));
  const [projetoId, setProjetoId] = useState<number | "">(projetoFixo ?? contrato?.projetoId ?? projetoInicial ?? "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha o título e a descrição do contrato.");
      return;
    }
    if (!dataInicio || !dataFim) {
      setErro("Informe as datas de início e de término.");
      return;
    }
    if (dataFim <= dataInicio) {
      setErro("O término deve ser posterior ao início.");
      return;
    }
    if (!projetoId) {
      setErro("Selecione o projeto vinculado.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onEnviar({
        tituloContrato: titulo.trim(),
        descricaoContrato: descricao.trim(),
        dataInicioContrato: dataInicio.length === 16 ? `${dataInicio}:00` : dataInicio,
        dataFimContrato: dataFim.length === 16 ? `${dataFim}:00` : dataFim,
        projetoId: Number(projetoId),
      });
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar o contrato."));
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

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="contrato-titulo" className={cls.label}>
            Título
          </label>
          <input id="contrato-titulo" value={titulo} maxLength={150} onChange={(e) => setTitulo(e.target.value)} className={cls.input} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="contrato-descricao" className={cls.label}>
            Descrição
          </label>
          <textarea
            id="contrato-descricao"
            value={descricao}
            maxLength={4000}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o objeto e as condições do contrato..."
            rows={4}
            className={`${cls.input} resize-y`}
          />
        </div>
        <div>
          <label htmlFor="contrato-inicio" className={cls.label}>
            Início
          </label>
          <input
            id="contrato-inicio"
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className={cls.input}
          />
        </div>
        <div>
          <label htmlFor="contrato-fim" className={cls.label}>
            Término
          </label>
          <input
            id="contrato-fim"
            type="datetime-local"
            min={dataInicio || undefined}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className={cls.input}
          />
        </div>
        {projetoFixo === undefined && (
          <div className="md:col-span-2">
            <label htmlFor="contrato-projeto" className={cls.label}>
              Projeto vinculado
            </label>
            <select
              id="contrato-projeto"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value ? Number(e.target.value) : "")}
              className={`${cls.input} !bg-white`}
            >
              <option value="">{projetos.length === 0 ? "Nenhum projeto disponível" : "Selecione um projeto"}</option>
              {projetos.map((p) => (
                <option key={p.idProjeto} value={p.idProjeto}>
                  {p.nomeProjeto}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={salvando} className={cls.btnPrimario}>
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {contrato ? "Salvar alterações" : "Criar contrato"}
        </button>
        <button type="button" onClick={onCancelar} disabled={salvando} className={cls.btnSecundario}>
          <X size={16} /> Cancelar
        </button>
      </div>
    </form>
  );
}
