"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tags } from "lucide-react";

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
import { Projeto } from "../../types/Projeto";
import { TipoProjeto } from "../../types/TipoProjeto";
import { listarTiposProjeto, criarTipoProjeto, atualizarTipoProjeto, excluirTipoProjeto } from "../../services/tipoProjeto.service";
import { listarProjetos } from "../../services/projeto.service";

/** Tipos de projeto (TipoProjetoRequestDTO: nomeTipoProjeto UNIQUE, descricaoTipoProjeto; POST/PUT/DELETE só ADMIN). */
export default function AdminTiposProjetoPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [tipos, setTipos] = useState<TipoProjeto[]>([]);
  const [projetos, setProjetos] = useState<Projeto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const modal = useModalCadastro<TipoProjeto>();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [lista, listaProjetos] = await Promise.all([listarTiposProjeto(), listarProjetos().catch(() => null)]);
      setTipos([...(lista ?? [])].sort((a, b) => a.nomeTipoProjeto.localeCompare(b.nomeTipoProjeto, "pt-BR")));
      setProjetos(listaProjetos);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os tipos de projeto."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const usoPorTipo = useMemo(() => {
    const mapa = new Map<number, number>();
    projetos?.forEach((p) => mapa.set(p.tipoProjetoId, (mapa.get(p.tipoProjetoId) ?? 0) + 1));
    return mapa;
  }, [projetos]);

  const lista = useListagemAdmin(tipos, (t) => [t.nomeTipoProjeto, t.descricaoTipoProjeto]);

  function abrirNovo() {
    setNome("");
    setDescricao("");
    modal.abrirNovo();
  }

  function abrirEdicao(t: TipoProjeto) {
    setNome(t.nomeTipoProjeto);
    setDescricao(t.descricaoTipoProjeto);
    modal.abrirEdicao(t);
  }

  function salvar() {
    const idAtual = modal.registro?.idTipoProjeto ?? null;
    modal.salvar({
      validar: () => {
        const n = nome.trim();
        if (!n || !descricao.trim()) return "Preencha o nome e a descrição.";
        if (n.length > LIMITES.nomeTipoProjeto) return `O nome pode ter no máximo ${LIMITES.nomeTipoProjeto} caracteres.`;
        // nome_tipo_projeto é UNIQUE no banco: um nome repetido seria recusado com erro 500.
        if (tipos.some((t) => t.idTipoProjeto !== idAtual && mesmoNome(t.nomeTipoProjeto, n))) return "Já existe um tipo de projeto com esse nome.";
        return null;
      },
      enviar: () => {
        const dados = { nomeTipoProjeto: nome.trim(), descricaoTipoProjeto: descricao.trim() };
        return idAtual ? atualizarTipoProjeto(idAtual, dados) : criarTipoProjeto(dados);
      },
      sucesso: idAtual ? "Tipo de projeto atualizado." : "Tipo de projeto cadastrado.",
      falha: "Não foi possível salvar o tipo de projeto. Verifique se o nome já não está em uso.",
      depois: carregar,
    });
  }

  async function excluir(tipo: TipoProjeto) {
    // projeto.tipo_projeto_id tem ON DELETE CASCADE: excluir um tipo em uso APAGARIA os projetos.
    let emUso = 0;
    try {
      emUso = ((await listarProjetos()) ?? []).filter((p) => p.tipoProjetoId === tipo.idTipoProjeto).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar se o tipo está em uso. Tente novamente."));
      return;
    }
    if (emUso > 0) {
      notificar(`O tipo "${tipo.nomeTipoProjeto}" é usado por ${emUso} projeto${emUso === 1 ? "" : "s"}. Excluí-lo apagaria esses projetos; edite o tipo em vez de excluir.`);
      return;
    }
    if (!(await confirmar(`Excluir o tipo "${tipo.nomeTipoProjeto}"?`, { titulo: "Excluir tipo de projeto", perigo: true }))) return;
    try {
      await excluirTipoProjeto(tipo.idTipoProjeto);
      notificar("Tipo de projeto excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o tipo de projeto."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  return (
    <>
      <CabecalhoAdmin
        icone={Tags}
        titulo="Tipos de projeto"
        descricao="Categorias escolhidas ao publicar um novo projeto."
        total={loading ? null : tipos.length}
        rotuloTotal={["tipo", "tipos"]}
        onCadastrar={abrirNovo}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome ou descrição..."
        rotulo="Pesquisar tipos de projeto"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={tipos.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => lista.setTermo("")}
        icone={Tags}
        tituloVazio="Nenhum tipo de projeto cadastrado ainda"
        descricaoVazio='Sem tipos, ninguém consegue publicar projetos. Use "Cadastrar" para criar o primeiro.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="tipos" />}
      >
        {lista.itens.map((tipo) => {
          const uso = usoPorTipo.get(tipo.idTipoProjeto) ?? 0;
          return (
            <LinhaAdmin
              key={tipo.idTipoProjeto}
              rotulo={tipo.nomeTipoProjeto}
              titulo={tipo.nomeTipoProjeto}
              subtitulo={tipo.descricaoTipoProjeto}
              meta={projetos ? <span className={uso > 0 ? cls.chip : cls.chipInativo}>{uso} projeto{uso === 1 ? "" : "s"}</span> : undefined}
              onEditar={() => abrirEdicao(tipo)}
              onExcluir={() => excluir(tipo)}
            />
          );
        })}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar tipo de projeto" : "Cadastrar tipo de projeto"}
        descricao={modal.editando ? `Alterando "${modal.registro?.nomeTipoProjeto}".` : "Preencha os dados do novo tipo."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="tipo-nome" rotulo="Nome" obrigatorio contador={{ atual: nome.length, max: LIMITES.nomeTipoProjeto }}>
            <input
              id="tipo-nome"
              value={nome}
              maxLength={LIMITES.nomeTipoProjeto}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Startup"
              className={cls.input}
            />
          </CampoAdmin>
          <CampoAdmin id="tipo-descricao" rotulo="Descrição" obrigatorio>
            <textarea id="tipo-descricao" value={descricao} rows={3} maxLength={2000} onChange={(e) => setDescricao(e.target.value)} className={`${cls.input} resize-y`} />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
