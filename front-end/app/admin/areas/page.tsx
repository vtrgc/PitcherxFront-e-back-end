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
import { LIMITES, mesmoNome } from "../../lib/limites";
import { Area } from "../../types/Area";
import { SubArea } from "../../types/SubArea";
import { listarAreas, criarArea, atualizarArea, excluirArea } from "../../services/area.service";
import { listarSubAreas } from "../../services/subArea.service";

/** Áreas (AreaRequestDTO: nomeArea, descricaoArea — ambos obrigatórios; POST/PUT/DELETE só ADMIN). */
export default function AdminAreasPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [areas, setAreas] = useState<Area[]>([]);
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const modal = useModalCadastro<Area>();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaAreas, listaSub] = await Promise.all([listarAreas(), listarSubAreas().catch(() => [] as SubArea[])]);
      setAreas([...(listaAreas ?? [])].sort((a, b) => a.nomeArea.localeCompare(b.nomeArea, "pt-BR")));
      setSubAreas(listaSub ?? []);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as áreas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const subPorArea = useMemo(() => {
    const mapa = new Map<number, number>();
    subAreas.forEach((s) => s.area?.idArea && mapa.set(s.area.idArea, (mapa.get(s.area.idArea) ?? 0) + 1));
    return mapa;
  }, [subAreas]);

  const lista = useListagemAdmin(areas, (a) => [a.nomeArea, a.descricaoArea]);

  function abrirNovo() {
    setNome("");
    setDescricao("");
    modal.abrirNovo();
  }

  function abrirEdicao(area: Area) {
    setNome(area.nomeArea);
    setDescricao(area.descricaoArea);
    modal.abrirEdicao(area);
  }

  function salvar() {
    const idAtual = modal.registro?.idArea ?? null;
    modal.salvar({
      validar: () => {
        const n = nome.trim();
        if (!n || !descricao.trim()) return "Preencha o nome e a descrição.";
        if (n.length > LIMITES.nomeArea) return `O nome pode ter no máximo ${LIMITES.nomeArea} caracteres.`;
        // nome_area é UNIQUE no banco: um nome repetido seria recusado com erro 500.
        if (areas.some((a) => a.idArea !== idAtual && mesmoNome(a.nomeArea, n))) return "Já existe uma área com esse nome.";
        return null;
      },
      enviar: () => {
        const dados = { nomeArea: nome.trim(), descricaoArea: descricao.trim() };
        return idAtual ? atualizarArea(idAtual, dados) : criarArea(dados);
      },
      sucesso: idAtual ? "Área atualizada." : "Área cadastrada.",
      falha: "Não foi possível salvar a área. Verifique se o nome já não está em uso.",
      depois: carregar,
    });
  }

  async function excluir(area: Area) {
    // Subáreas referenciam a área (sem cascade): o servidor recusaria a exclusão com erro 500.
    let emUso = 0;
    try {
      emUso = ((await listarSubAreas()) ?? []).filter((s) => s.area?.idArea === area.idArea).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar se a área está em uso. Tente novamente."));
      return;
    }
    if (emUso > 0) {
      notificar(`Esta área tem ${emUso} subárea${emUso === 1 ? "" : "s"} vinculada${emUso === 1 ? "" : "s"}. Exclua ou mova as subáreas antes de excluir a área.`);
      return;
    }
    if (!(await confirmar(`Excluir a área "${area.nomeArea}"?`, { titulo: "Excluir área", perigo: true }))) return;
    try {
      await excluirArea(area.idArea);
      notificar("Área excluída.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir (o registro pode estar em uso)."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  return (
    <>
      <CabecalhoAdmin
        icone={LayoutGrid}
        titulo="Áreas"
        descricao="Grandes áreas de atuação usadas para organizar o conteúdo."
        total={loading ? null : areas.length}
        rotuloTotal={["área", "áreas"]}
        onCadastrar={abrirNovo}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome ou descrição..."
        rotulo="Pesquisar áreas"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={areas.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => lista.setTermo("")}
        icone={LayoutGrid}
        tituloVazio="Nenhuma área cadastrada ainda"
        descricaoVazio='Use o botão "Cadastrar" para criar a primeira área.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="áreas" />}
      >
        {lista.itens.map((area) => {
          const qtd = subPorArea.get(area.idArea) ?? 0;
          return (
            <LinhaAdmin
              key={area.idArea}
              rotulo={area.nomeArea}
              titulo={area.nomeArea}
              subtitulo={area.descricaoArea}
              meta={<span className={cls.chipInativo}>{qtd} subárea{qtd === 1 ? "" : "s"}</span>}
              onEditar={() => abrirEdicao(area)}
              onExcluir={() => excluir(area)}
            />
          );
        })}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar área" : "Cadastrar área"}
        descricao={modal.editando ? `Alterando "${modal.registro?.nomeArea}".` : "Preencha os dados da nova área."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="area-nome" rotulo="Nome" obrigatorio contador={{ atual: nome.length, max: LIMITES.nomeArea }}>
            <input id="area-nome" value={nome} maxLength={LIMITES.nomeArea} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Tecnologia" className={cls.input} />
          </CampoAdmin>
          <CampoAdmin id="area-descricao" rotulo="Descrição" obrigatorio>
            <textarea
              id="area-descricao"
              value={descricao}
              rows={3}
              maxLength={2000}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Do que trata esta área"
              className={`${cls.input} resize-y`}
            />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
