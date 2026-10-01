"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, Save, X } from "lucide-react";
import { apiDateToInput, hojeServidorInput, inputDateToApi, validarDatasProjeto } from "../lib/date";
import { LIMITES } from "../lib/limites";
import { isValidImageUrl } from "../lib/image";
import { mensagemErro } from "../lib/api";
import { Projeto, ProjetoRequest } from "../types/Projeto";
import { TipoProjeto } from "../types/TipoProjeto";
import { cls } from "./ui/estilos";
import Alerta from "./ui/Alerta";
import SeletorImagens from "./SeletorImagens";

/**
 * Formulário de projeto (criação e edição). Replica as validações do ProjetoRequestDTO:
 * nome/descrição obrigatórios, início hoje ou futuro, término futuro e tipo obrigatório.
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

    setErro("");
    setSalvando(true);
    try {
      await onEnviar({
        nomeProjeto: nome.trim(),
        descricaoProjeto: descricao.trim(),
        dataInicioProjeto: inputDateToApi(dataInicio),
        dataFimProjeto: inputDateToApi(dataFim),
        tipoProjetoId: Number(tipoProjetoId),
        urlImagemProjeto: edicao ? undefined : urlImagem.trim() || undefined,
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
