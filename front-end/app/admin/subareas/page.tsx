"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";

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
import { Area } from "../../types/Area";
import { SubArea } from "../../types/SubArea";
import { listarSubAreas, criarSubArea, atualizarSubArea, excluirSubArea } from "../../services/subArea.service";
import { listarAreas } from "../../services/area.service";

/** Subáreas (SubAreaRequestDTO: nomeSubArea, descricaoSubArea, idArea — todos obrigatórios; só ADMIN). */
export default function AdminSubAreasPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtroArea, setFiltroArea] = useState<number | "">("");

  const modal = useModalCadastro<SubArea>();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [idArea, setIdArea] = useState<number | "">("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaSub, listaAreas] = await Promise.all([listarSubAreas(), listarAreas()]);
      setSubAreas([...(listaSub ?? [])].sort((a, b) => a.nomeSubArea.localeCompare(b.nomeSubArea, "pt-BR")));
      setAreas([...(listaAreas ?? [])].sort((a, b) => a.nomeArea.localeCompare(b.nomeArea, "pt-BR")));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as subáreas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const daArea = useMemo(() => (filtroArea ? subAreas.filter((s) => s.area?.idArea === filtroArea) : subAreas), [subAreas, filtroArea]);
  const lista = useListagemAdmin(daArea, (s) => [s.nomeSubArea, s.descricaoSubArea, s.area?.nomeArea]);

  function abrirNovo() {
    setNome("");
    setDescricao("");
    setIdArea(filtroArea);
    modal.abrirNovo();
  }

  function abrirEdicao(s: SubArea) {
    setNome(s.nomeSubArea);
    setDescricao(s.descricaoSubArea);
    setIdArea(s.area?.idArea ?? "");
    modal.abrirEdicao(s);
  }

  function salvar() {
    const idAtual = modal.registro?.idSubArea ?? null;
    modal.salvar({
      validar: () => {
        if (!nome.trim() || !descricao.trim() || !idArea) return "Preencha o nome, a descrição e selecione a área.";
        if (nome.trim().length > LIMITES.nomeSubArea) return `O nome pode ter no máximo ${LIMITES.nomeSubArea} caracteres.`;
        return null;
      },
      enviar: () => {
        const dados = { nomeSubArea: nome.trim(), descricaoSubArea: descricao.trim(), idArea: Number(idArea) };
        return idAtual ? atualizarSubArea(idAtual, dados) : criarSubArea(dados);
      },
      sucesso: idAtual ? "Subárea atualizada." : "Subárea cadastrada.",
      falha: "Não foi possível salvar a subárea.",
      depois: carregar,
    });
  }

  async function excluir(s: SubArea) {
    if (!(await confirmar(`Excluir a subárea "${s.nomeSubArea}"?`, { titulo: "Excluir subárea", perigo: true }))) return;
    try {
      await excluirSubArea(s.idSubArea);
      notificar("Subárea excluída.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir (o registro pode estar em uso)."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  const semAreas = !loading && areas.length === 0;

  return (
    <>
      <CabecalhoAdmin
        icone={LayoutGrid}
        titulo="Subáreas"
        descricao="Especializações dentro de cada área."
        total={loading ? null : subAreas.length}
        rotuloTotal={["subárea", "subáreas"]}
        onCadastrar={abrirNovo}
        cadastrarDesabilitado={semAreas}
        dicaCadastrar={semAreas ? "Cadastre uma área antes" : undefined}
      />

      {semAreas && <Alerta variante="aviso">Cadastre ao menos uma área (Admin → Áreas) antes de criar subáreas.</Alerta>}

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome, descrição ou área..."
        rotulo="Pesquisar subáreas"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <select
            aria-label="Filtrar por área"
            value={filtroArea}
            onChange={(e) => {
              setFiltroArea(e.target.value ? Number(e.target.value) : "");
              lista.irPara(1);
            }}
            className={`${cls.input} !py-2.5 !bg-white sm:!w-56`}
          >
            <option value="">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a.idArea} value={a.idArea}>
                {a.nomeArea}
              </option>
            ))}
          </select>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={subAreas.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroArea("");
        }}
        icone={LayoutGrid}
        tituloVazio="Nenhuma subárea cadastrada ainda"
        descricaoVazio='Use o botão "Cadastrar" para criar a primeira subárea.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="subáreas" />}
      >
        {lista.itens.map((s) => (
          <LinhaAdmin
            key={s.idSubArea}
            rotulo={s.nomeSubArea}
            titulo={s.nomeSubArea}
            subtitulo={s.descricaoSubArea}
            meta={<span className={cls.chip}>{s.area?.nomeArea ?? "Sem área"}</span>}
            onEditar={() => abrirEdicao(s)}
            onExcluir={() => excluir(s)}
          />
        ))}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar subárea" : "Cadastrar subárea"}
        descricao={modal.editando ? `Alterando "${modal.registro?.nomeSubArea}".` : "Preencha os dados da nova subárea."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="sub-area" rotulo="Área" obrigatorio>
            <select id="sub-area" value={idArea} onChange={(e) => setIdArea(e.target.value ? Number(e.target.value) : "")} className={`${cls.input} !bg-white`}>
              <option value="">Selecione a área</option>
              {areas.map((a) => (
                <option key={a.idArea} value={a.idArea}>
                  {a.nomeArea}
                </option>
              ))}
            </select>
          </CampoAdmin>
          <CampoAdmin id="sub-nome" rotulo="Nome" obrigatorio contador={{ atual: nome.length, max: LIMITES.nomeSubArea }}>
            <input id="sub-nome" value={nome} maxLength={LIMITES.nomeSubArea} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Desenvolvimento web" className={cls.input} />
          </CampoAdmin>
          <CampoAdmin id="sub-descricao" rotulo="Descrição" obrigatorio>
            <textarea id="sub-descricao" value={descricao} rows={3} maxLength={2000} onChange={(e) => setDescricao(e.target.value)} className={`${cls.input} resize-y`} />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
