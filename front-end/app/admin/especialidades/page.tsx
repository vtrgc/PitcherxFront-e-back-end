"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award } from "lucide-react";

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
import { Especialidade, PerfilUsuario } from "../../types/PerfilUsuario";
import {
  listarEspecialidades,
  criarEspecialidade,
  atualizarEspecialidade,
  excluirEspecialidade,
  listarPerfisUsuario,
} from "../../services/perfilUsuario.service";

/** Especialidades (EspecialidadeRequestDTO: nomeEspecialidade, VARCHAR(120) UNIQUE; só ADMIN). */
export default function AdminEspecialidadesPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [perfis, setPerfis] = useState<PerfilUsuario[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const modal = useModalCadastro<Especialidade>();
  const [nome, setNome] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [lista, listaPerfis] = await Promise.all([listarEspecialidades(), listarPerfisUsuario().catch(() => null)]);
      setEspecialidades([...(lista ?? [])].sort((a, b) => a.nomeEspecialidade.localeCompare(b.nomeEspecialidade, "pt-BR")));
      setPerfis(listaPerfis);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as especialidades."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const usoPorEspecialidade = useMemo(() => {
    const mapa = new Map<number, number>();
    perfis?.forEach((p) => {
      const id = p.especialidade?.idEspecialidade;
      if (id) mapa.set(id, (mapa.get(id) ?? 0) + 1);
    });
    return mapa;
  }, [perfis]);

  const lista = useListagemAdmin(especialidades, (e) => [e.nomeEspecialidade]);

  function abrirNovo() {
    setNome("");
    modal.abrirNovo();
  }

  function abrirEdicao(e: Especialidade) {
    setNome(e.nomeEspecialidade);
    modal.abrirEdicao(e);
  }

  function salvar() {
    const idAtual = modal.registro?.idEspecialidade ?? null;
    modal.salvar({
      validar: () => {
        const n = nome.trim();
        if (!n) return "Preencha o nome da especialidade.";
        if (n.length > LIMITES.nomeEspecialidade) return `O nome pode ter no máximo ${LIMITES.nomeEspecialidade} caracteres.`;
        // nome_especialidade é UNIQUE no banco: um nome repetido seria recusado com erro 500.
        if (especialidades.some((e) => e.idEspecialidade !== idAtual && mesmoNome(e.nomeEspecialidade, n))) return "Já existe uma especialidade com esse nome.";
        return null;
      },
      enviar: () => {
        const dados = { nomeEspecialidade: nome.trim() };
        return idAtual ? atualizarEspecialidade(idAtual, dados) : criarEspecialidade(dados);
      },
      sucesso: idAtual ? "Especialidade atualizada." : "Especialidade cadastrada.",
      falha: "Não foi possível salvar a especialidade. Verifique se o nome já não está em uso.",
      depois: carregar,
    });
  }

  async function excluir(esp: Especialidade) {
    // No banco, perfil_usuario.especialidade_id tem ON DELETE CASCADE: excluir uma
    // especialidade em uso APAGARIA os perfis profissionais de quem a escolheu.
    let emUso = 0;
    try {
      emUso = ((await listarPerfisUsuario()) ?? []).filter((p) => p.especialidade?.idEspecialidade === esp.idEspecialidade).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar se a especialidade está em uso. Tente novamente."));
      return;
    }
    if (emUso > 0) {
      notificar(
        `Esta especialidade está em uso por ${emUso} perfil${emUso === 1 ? "" : "s"}. Excluí-la apagaria esses perfis profissionais; edite o nome em vez de excluir.`
      );
      return;
    }
    if (!(await confirmar(`Excluir a especialidade "${esp.nomeEspecialidade}"?`, { titulo: "Excluir especialidade", perigo: true }))) return;
    try {
      await excluirEspecialidade(esp.idEspecialidade);
      notificar("Especialidade excluída.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir (o registro pode estar em uso)."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  return (
    <>
      <CabecalhoAdmin
        icone={Award}
        titulo="Especialidades"
        descricao="Áreas de atuação que os usuários escolhem no perfil profissional."
        total={loading ? null : especialidades.length}
        rotuloTotal={["especialidade", "especialidades"]}
        onCadastrar={abrirNovo}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome..."
        rotulo="Pesquisar especialidades"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={especialidades.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => lista.setTermo("")}
        icone={Award}
        tituloVazio="Nenhuma especialidade cadastrada ainda"
        descricaoVazio='Use o botão "Cadastrar" para criar a primeira especialidade.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="especialidades" />}
      >
        {lista.itens.map((esp) => {
          const uso = usoPorEspecialidade.get(esp.idEspecialidade) ?? 0;
          return (
            <LinhaAdmin
              key={esp.idEspecialidade}
              rotulo={esp.nomeEspecialidade}
              titulo={esp.nomeEspecialidade}
              meta={perfis ? <span className={uso > 0 ? cls.chip : cls.chipInativo}>{uso} perfil{uso === 1 ? "" : "s"}</span> : undefined}
              onEditar={() => abrirEdicao(esp)}
              onExcluir={() => excluir(esp)}
            />
          );
        })}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar especialidade" : "Cadastrar especialidade"}
        descricao={modal.editando ? `Alterando "${modal.registro?.nomeEspecialidade}".` : "Informe o nome da nova especialidade."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin
            id="esp-nome"
            rotulo="Nome"
            obrigatorio
            contador={{ atual: nome.length, max: LIMITES.nomeEspecialidade }}
            ajuda={modal.editando ? "O novo nome aparece em todos os perfis que usam esta especialidade." : undefined}
          >
            <input
              id="esp-nome"
              value={nome}
              maxLength={LIMITES.nomeEspecialidade}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Engenharia de Software"
              className={cls.input}
            />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
