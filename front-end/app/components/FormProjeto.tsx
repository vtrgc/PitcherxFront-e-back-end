"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleDollarSign, ImagePlus, Loader2, Save, X } from "lucide-react";
import { apiDateToInput, hojeServidorInput, inputDateToApi, validarDatasProjeto } from "../lib/date";
import { LIMITES } from "../lib/limites";
import { isValidImageUrl } from "../lib/image";
import { mensagemErro } from "../lib/api";
import {
  CamposFicha,
  ErrosFicha,
  RISCO_MAX,
  USO_RECURSOS_MAX,
  camposDaFicha,
  camposFinanceirosApi,
  montarDescricaoProjeto,
  validarCamposFicha,
} from "../lib/fichaProjeto";
import { Projeto, ProjetoRequest } from "../types/Projeto";
import { TipoProjeto } from "../types/TipoProjeto";
import { cls } from "./ui/estilos";
import Alerta from "./ui/Alerta";
import SeletorImagens from "./SeletorImagens";

/**
 * Formulário de projeto (criação e edição). Replica as validações do ProjetoRequestDTO:
 * nome/descrição obrigatórios, início hoje ou futuro, término futuro e tipo obrigatório.
 *
 * Dados financeiros: `metaFinanceira` (obrigatória), `valorArrecadado` e `riscoProjeto` são
 * campos do DTO. Participação, investimento mínimo e uso dos recursos são opcionais e, por não
 * terem coluna no backend, ficam no fim da descrição (ver lib/fichaProjeto) sem aparecer no texto.
 *
 * Imagens: na criação, o usuário pode escolher arquivos (enviados depois por
 * PUT /projeto/{id}/imagens) ou informar uma URL. Na edição, a galeria é gerenciada na
 * página do projeto — o PUT /projeto ignora `urlImagemProjeto` (mapper do backend).
 */
export default function FormProjeto({
  projeto,
  tipos,
  onEnviar,
  onCancelar,
  rotuloEnviar,
}: {
  projeto?: Projeto | null;
  tipos: TipoProjeto[];
  onEnviar: (dados: ProjetoRequest, arquivos: File[]) => Promise<void>;
  onCancelar: () => void;
  rotuloEnviar: string;
}) {
  const [nome, setNome] = useState(projeto?.nomeProjeto ?? "");
  const [descricao, setDescricao] = useState(projeto?.descricaoProjeto ?? "");
  const [dataInicio, setDataInicio] = useState(apiDateToInput(projeto?.dataInicioProjeto));
  const [dataFim, setDataFim] = useState(apiDateToInput(projeto?.dataFimProjeto));
  const [tipoProjetoId, setTipoProjetoId] = useState<number | "">(projeto?.tipoProjetoId ?? "");
  const edicao = !!projeto;
  const [urlImagem, setUrlImagem] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [ficha, setFicha] = useState<CamposFicha>(() => camposDaFicha(projeto?.ficha));
  const [errosFicha, setErrosFicha] = useState<ErrosFicha>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const inicioJaPassou = !!projeto && !!dataInicio && dataInicio < hojeServidorInput();

  async function enviar() {
    if (!nome.trim() || !descricao.trim()) {
      setErro("Preencha o nome e a descrição do projeto.");
      return;
    }
    if (!tipoProjetoId) {
      setErro("Selecione o tipo de projeto.");
      return;
    }
    const erroDatas = validarDatasProjeto(dataInicio, dataFim);
    if (erroDatas) {
      setErro(erroDatas);
      return;
    }
    if (!edicao && urlImagem.trim() && !isValidImageUrl(urlImagem.trim())) {
      setErro("A URL da imagem deve começar com http:// ou https://.");
      return;
    }
    // url_imagem_projeto é VARCHAR(2048): um link maior faria o servidor responder 500.
    if (!edicao && urlImagem.trim().length > LIMITES.urlImagemProjeto) {
      setErro(`A URL da imagem pode ter no máximo ${LIMITES.urlImagemProjeto} caracteres. Use um link mais curto.`);
      return;
    }

    const financeiro = validarCamposFicha(ficha);
    // metaFinanceira é @NotNull no ProjetoRequestDTO.
    if (!financeiro.erros.meta && !financeiro.ficha?.meta) financeiro.erros.meta = "Informe a meta financeira do projeto.";
    setErrosFicha(financeiro.erros);
    if (Object.keys(financeiro.erros).length > 0) {
      setErro("Revise os dados financeiros destacados.");
      return;
    }

    setErro("");
    setSalvando(true);
    try {
      await onEnviar({
        nomeProjeto: nome.trim(),
        descricaoProjeto: montarDescricaoProjeto(descricao, financeiro.ficha),
        dataInicioProjeto: inputDateToApi(dataInicio),
        dataFimProjeto: inputDateToApi(dataFim),
        tipoProjetoId: Number(tipoProjetoId),
        urlImagemProjeto: edicao ? undefined : urlImagem.trim() || undefined,
        ...camposFinanceirosApi(financeiro.ficha),
      }, edicao ? [] : arquivos);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar o projeto."));
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

      {tipos.length === 0 && (
        <Alerta variante="aviso" className="mt-4">
          Nenhum tipo de projeto cadastrado ainda. Peça a um administrador para cadastrar um tipo antes de continuar.
        </Alerta>
      )}

      {inicioJaPassou && (
        <Alerta variante="info" className="mt-4">
          A API só aceita data de início igual ou posterior a hoje, inclusive na edição. Ajuste a data de início para salvar.
        </Alerta>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="proj-nome" className={cls.label}>
            Nome do projeto
          </label>
          <input id="proj-nome" value={nome} maxLength={LIMITES.nomeProjeto} onChange={(e) => setNome(e.target.value)} className={cls.input} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="proj-descricao" className={cls.label}>
            Descrição
          </label>
          <textarea
            id="proj-descricao"
            value={descricao}
            maxLength={2000}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o projeto, o problema que ele resolve e quem você procura..."
            rows={4}
            className={`${cls.input} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="proj-inicio" className={cls.label}>
            Data de início
          </label>
          <input
            id="proj-inicio"
            type="date"
            min={hojeServidorInput()}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className={cls.input}
          />
        </div>

        <div>
          <label htmlFor="proj-fim" className={cls.label}>
            Data de término
          </label>
          <input
            id="proj-fim"
            type="date"
            min={dataInicio || hojeServidorInput()}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className={cls.input}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="proj-tipo" className={cls.label}>
            Tipo de projeto
          </label>
          <select
            id="proj-tipo"
            value={tipoProjetoId}
            onChange={(e) => setTipoProjetoId(e.target.value ? Number(e.target.value) : "")}
            className={`${cls.input} !bg-white`}
          >
            <option value="">Selecione um tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.idTipoProjeto} value={tipo.idTipoProjeto}>
                {tipo.nomeTipoProjeto}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[12px] text-ink-400">
            <Link href="/tipos-projeto" className="underline hover:text-brand-700">
              Ver descrição dos tipos
            </Link>
          </p>
        </div>

        <fieldset className="md:col-span-2 rounded-xl border border-ink-100 p-4" disabled={salvando}>
          <legend className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-ink-800">
            <CircleDollarSign size={15} aria-hidden="true" /> Dados financeiros
          </legend>
          <p className="mb-3 text-[12.5px] text-ink-500">
            Aparecem na página do projeto (meta, progresso da captação, risco e participação oferecida). A meta é obrigatória; deixe
            em branco o restante que não quiser divulgar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoFicha
              id="meta"
              rotulo="Meta financeira (R$) *"
              placeholder="Ex.: 100.000,00"
              valor={ficha.meta}
              erro={errosFicha.meta}
              onChange={(v) => setFicha((f) => ({ ...f, meta: v }))}
            />
            <CampoFicha
              id="captado"
              rotulo="Valor arrecadado (R$)"
              placeholder="Ex.: 65.000,00"
              valor={ficha.captado}
              erro={errosFicha.captado}
              onChange={(v) => setFicha((f) => ({ ...f, captado: v }))}
            />
            <CampoFicha
              id="participacao"
              rotulo="Participação oferecida (%)"
              placeholder="Ex.: 15"
              valor={ficha.participacao}
              erro={errosFicha.participacao}
              onChange={(v) => setFicha((f) => ({ ...f, participacao: v }))}
            />
            <CampoFicha
              id="minimo"
              rotulo="Investimento mínimo (R$)"
              placeholder="Ex.: 5.000,00"
              valor={ficha.investimentoMinimo}
              erro={errosFicha.investimentoMinimo}
              onChange={(v) => setFicha((f) => ({ ...f, investimentoMinimo: v }))}
            />
            <div className="sm:col-span-2">
              <label htmlFor="proj-ficha-risco" className={cls.label}>
                Risco do projeto
              </label>
              <input
                id="proj-ficha-risco"
                value={ficha.risco ?? ""}
                maxLength={RISCO_MAX}
                onChange={(e) => setFicha((f) => ({ ...f, risco: e.target.value }))}
                placeholder="Ex.: Médio — depende de aprovação regulatória"
                aria-invalid={!!errosFicha.risco}
                className={cls.input}
              />
              {errosFicha.risco && <p className="mt-1 text-[13px] text-red-600">{errosFicha.risco}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="proj-ficha-uso" className={cls.label}>
                Uso dos recursos
              </label>
              <textarea
                id="proj-ficha-uso"
                value={ficha.usoRecursos}
                maxLength={USO_RECURSOS_MAX}
                rows={2}
                onChange={(e) => setFicha((f) => ({ ...f, usoRecursos: e.target.value }))}
                placeholder="Ex.: 40% marketing, 35% desenvolvimento, 25% operação"
                aria-invalid={!!errosFicha.usoRecursos}
                className={`${cls.input} resize-y`}
              />
              {errosFicha.usoRecursos && <p className="mt-1 text-[13px] text-red-600">{errosFicha.usoRecursos}</p>}
            </div>
          </div>
        </fieldset>

        {!edicao && (
          <div className="md:col-span-2 space-y-3">
            <div>
              <p className={`${cls.label} flex items-center gap-1.5`}>
                <ImagePlus size={14} aria-hidden="true" />
                Imagens do projeto (opcional)
              </p>
              <SeletorImagens arquivos={arquivos} onChange={setArquivos} desabilitado={salvando} rotulo="Escolher imagens" />
            </div>
            {arquivos.length === 0 && (
              <div>
                <label htmlFor="proj-imagem" className={cls.label}>
                  Ou informe a URL de uma imagem
                </label>
                <input
                  id="proj-imagem"
                  type="url"
                  inputMode="url"
                  value={urlImagem}
                  onChange={(e) => setUrlImagem(e.target.value)}
                  placeholder="https://..."
                  className={cls.input}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={salvando || tipos.length === 0} className={cls.btnPrimario}>
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

function CampoFicha({
  id,
  rotulo,
  placeholder,
  valor,
  erro,
  onChange,
}: {
  id: string;
  rotulo: string;
  placeholder: string;
  valor: string;
  erro?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={`proj-ficha-${id}`} className={cls.label}>
        {rotulo}
      </label>
      <input
        id={`proj-ficha-${id}`}
        inputMode="decimal"
        value={valor}
        maxLength={24}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,R$\s%]/g, ""))}
        placeholder={placeholder}
        aria-invalid={!!erro}
        aria-describedby={erro ? `proj-ficha-${id}-erro` : undefined}
        className={cls.input}
      />
      {erro && (
        <p id={`proj-ficha-${id}-erro`} className="mt-1 text-[13px] text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
