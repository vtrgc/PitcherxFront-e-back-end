"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { isoParaInputDataHora } from "../lib/date";
import { mensagemErro } from "../lib/api";
import { Contrato, ContratoRequest } from "../types/Contrato";
import { Projeto } from "../types/Projeto";
import { Proposta } from "../types/Proposta";
import { formatarMoeda } from "../lib/validacao";
import { cls } from "./ui/estilos";
import Alerta from "./ui/Alerta";

/**
 * Formulário de contrato (ContratoRequestDTO: datas LocalDateTime em ISO). A proposta é
 * obrigatória (@NotNull) e precisa ser do projeto escolhido; com ela o contrato nasce PENDENTE.
 */
export default function FormContrato({
  contrato,
  projetos,
  projetoFixo,
  projetoInicial,
  propostas,
  propostaInicial,
  onEnviar,
  onCancelar,
}: {
  contrato?: Contrato | null;
  /** Projetos que podem ser vinculados (ignorado quando `projetoFixo` é informado). */
  projetos: Projeto[];
  projetoFixo?: number;
  projetoInicial?: number | "";
  /** Propostas disponíveis (filtradas pelo projeto escolhido). */
  propostas: Proposta[];
  propostaInicial?: number | "";
  onEnviar: (dados: ContratoRequest) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(contrato?.tituloContrato ?? "");
  const [descricao, setDescricao] = useState(contrato?.descricaoContrato ?? "");
  const [dataInicio, setDataInicio] = useState(isoParaInputDataHora(contrato?.dataInicioContrato));
  const [dataFim, setDataFim] = useState(isoParaInputDataHora(contrato?.dataFimContrato));
  const [projetoId, setProjetoId] = useState<number | "">(projetoFixo ?? contrato?.projetoId ?? projetoInicial ?? "");
  const [propostaId, setPropostaId] = useState<number | "">(contrato?.propostaId ?? propostaInicial ?? "");
  const propostasDoProjeto = propostas.filter((p) => projetoId !== "" && p.projetoId === Number(projetoId) && p.statusProposta !== "RECUSADA");
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
    if (!propostaId) {
      setErro("Selecione a proposta que este contrato formaliza.");
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
        propostaId: Number(propostaId),
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
              onChange={(e) => {
                setProjetoId(e.target.value ? Number(e.target.value) : "");
                setPropostaId("");
              }}
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
        <div className="md:col-span-2">
          <label htmlFor="contrato-proposta" className={cls.label}>
            Proposta formalizada *
          </label>
          <select
            id="contrato-proposta"
            value={propostaId}
            onChange={(e) => setPropostaId(e.target.value ? Number(e.target.value) : "")}
            disabled={projetoId === ""}
            className={`${cls.input} !bg-white`}
          >
            <option value="">
              {projetoId === "" ? "Escolha o projeto primeiro" : propostasDoProjeto.length === 0 ? "Este projeto não tem propostas" : "Selecione a proposta"}
            </option>
            {propostasDoProjeto.map((p) => (
              <option key={p.idProposta} value={p.idProposta}>
                #{p.idProposta} · {formatarMoeda(p.valorProposta)} · {p.descricaoProposta.slice(0, 60)}
                {p.descricaoProposta.length > 60 ? "…" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[12px] text-ink-400">
            O contrato fica “aguardando aceite”; ao ser aceito, o valor da proposta é somado ao arrecadado do projeto.
          </p>
        </div>
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
