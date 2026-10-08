"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSignature } from "lucide-react";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { CampoAdmin, LinhaAdmin, ListaAdmin } from "../../components/admin/ListaAdmin";
import ModalAdmin from "../../components/admin/ModalAdmin";
import Paginacao from "../../components/admin/Paginacao";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useModalCadastro } from "../../hook/useModalCadastro";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { LIMITES } from "../../lib/limites";
import { Contrato } from "../../types/Contrato";
import { Termo } from "../../types/Termo";
import { listarTermos, criarTermo, atualizarTermo, excluirTermo } from "../../services/termo.service";
import { listarContratos } from "../../services/contrato.service";

/** Termos de contrato (TermoRequestDTO: tituloTermo e descricaoTermo VARCHAR(255), contratoId; só ADMIN). */
export default function AdminTermosPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [termos, setTermos] = useState<Termo[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtroContrato, setFiltroContrato] = useState<number | "">("");

  const modal = useModalCadastro<Termo>();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contratoId, setContratoId] = useState<number | "">("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaTermos, listaContratos] = await Promise.all([listarTermos(), listarContratos()]);
      setTermos([...(listaTermos ?? [])].sort((a, b) => b.idTermo - a.idTermo));
      setContratos([...(listaContratos ?? [])].sort((a, b) => a.tituloContrato.localeCompare(b.tituloContrato, "pt-BR")));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os termos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const nomesContrato = useMemo(() => new Map(contratos.map((c) => [c.idContrato, c.tituloContrato])), [contratos]);
  const nomeContrato = (id: number) => nomesContrato.get(id) || `Contrato #${id}`;

  const doContrato = useMemo(() => (filtroContrato ? termos.filter((t) => t.contratoId === filtroContrato) : termos), [termos, filtroContrato]);
  const lista = useListagemAdmin(doContrato, (t) => [t.tituloTermo, t.descricaoTermo, nomesContrato.get(t.contratoId)]);

  function abrirNovo() {
    setTitulo("");
    setDescricao("");
    setContratoId(filtroContrato);
    modal.abrirNovo();
  }

  function abrirEdicao(t: Termo) {
    setTitulo(t.tituloTermo);
    setDescricao(t.descricaoTermo);
    setContratoId(t.contratoId);
    modal.abrirEdicao(t);
  }

  function salvar() {
    const idAtual = modal.registro?.idTermo ?? null;
    modal.salvar({
      validar: () => {
        if (!titulo.trim() || !descricao.trim() || !contratoId) return "Preencha o título, a descrição e selecione o contrato.";
        // titulo_termo e descricao_termo são VARCHAR(255) no banco.
        if (titulo.trim().length > LIMITES.tituloTermo || descricao.trim().length > LIMITES.descricaoTermo)
          return `Título e descrição podem ter no máximo ${LIMITES.descricaoTermo} caracteres cada.`;
        return null;
      },
      enviar: () => {
        const dados = { tituloTermo: titulo.trim(), descricaoTermo: descricao.trim(), contratoId: Number(contratoId) };
        return idAtual ? atualizarTermo(idAtual, dados) : criarTermo(dados);
      },
      sucesso: idAtual ? "Termo atualizado." : "Termo cadastrado.",
      falha: "Não foi possível salvar o termo.",
      depois: carregar,
    });
  }

  async function excluir(t: Termo) {
    if (!(await confirmar(`Excluir o termo "${t.tituloTermo}"?`, { titulo: "Excluir termo", perigo: true }))) return;
    try {
      await excluirTermo(t.idTermo);
      notificar("Termo excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir (o registro pode estar em uso)."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  const semContratos = !loading && contratos.length === 0;

  return (
    <>
      <CabecalhoAdmin
        icone={FileSignature}
        titulo="Termos de contrato"
        descricao="Cláusulas vinculadas a cada contrato de projeto."
        total={loading ? null : termos.length}
        rotuloTotal={["termo", "termos"]}
        onCadastrar={abrirNovo}
        cadastrarDesabilitado={semContratos}
        dicaCadastrar={semContratos ? "Não há contratos cadastrados" : undefined}
      />

      {semContratos && (
        <Alerta variante="aviso">
          Não há contratos cadastrados. Termos precisam de um contrato; contratos são criados a partir dos projetos em{" "}
          <Link href="/contratos" className="font-semibold underline">
            Contratos
          </Link>
          .
        </Alerta>
      )}

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por título, descrição ou contrato..."
        rotulo="Pesquisar termos de contrato"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <select
            aria-label="Filtrar por contrato"
            value={filtroContrato}
            onChange={(e) => {
              setFiltroContrato(e.target.value ? Number(e.target.value) : "");
              lista.irPara(1);
            }}
            className={`${cls.input} !py-2.5 !bg-white sm:!w-60`}
          >
            <option value="">Todos os contratos</option>
            {contratos.map((c) => (
              <option key={c.idContrato} value={c.idContrato}>
                {c.tituloContrato}
              </option>
            ))}
          </select>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={termos.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroContrato("");
        }}
        icone={FileSignature}
        tituloVazio="Nenhum termo cadastrado ainda"
        descricaoVazio='Use o botão "Cadastrar" para adicionar um termo a um contrato.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="termos" />}
      >
        {lista.itens.map((t) => (
          <LinhaAdmin
            key={t.idTermo}
            rotulo={t.tituloTermo}
            titulo={t.tituloTermo}
            subtitulo={t.descricaoTermo}
            meta={
              <Link href={`/contratos/${t.contratoId}`} className={`${cls.chip} hover:underline`}>
                {nomeContrato(t.contratoId)}
              </Link>
            }
            onEditar={() => abrirEdicao(t)}
            onExcluir={() => excluir(t)}
          />
        ))}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar termo de contrato" : "Cadastrar termo de contrato"}
        descricao={modal.editando ? `Alterando "${modal.registro?.tituloTermo}".` : "Preencha a cláusula e escolha o contrato."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="termo-contrato" rotulo="Contrato" obrigatorio>
            <select
              id="termo-contrato"
              value={contratoId}
              onChange={(e) => setContratoId(e.target.value ? Number(e.target.value) : "")}
              className={`${cls.input} !bg-white`}
            >
              <option value="">Selecione o contrato</option>
              {contratos.map((c) => (
                <option key={c.idContrato} value={c.idContrato}>
                  {c.tituloContrato}
                </option>
              ))}
            </select>
          </CampoAdmin>
          <CampoAdmin id="termo-titulo" rotulo="Título" obrigatorio contador={{ atual: titulo.length, max: LIMITES.tituloTermo }}>
            <input id="termo-titulo" value={titulo} maxLength={LIMITES.tituloTermo} onChange={(e) => setTitulo(e.target.value)} className={cls.input} />
          </CampoAdmin>
          <CampoAdmin id="termo-descricao" rotulo="Descrição" obrigatorio contador={{ atual: descricao.length, max: LIMITES.descricaoTermo }}>
            <textarea
              id="termo-descricao"
              value={descricao}
              rows={3}
              maxLength={LIMITES.descricaoTermo}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${cls.input} resize-y`}
            />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
