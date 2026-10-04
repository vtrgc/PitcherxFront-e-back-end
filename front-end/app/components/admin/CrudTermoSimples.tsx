"use client";

import { useCallback, useEffect, useState } from "react";
import { type LucideIcon } from "lucide-react";

import BarraPesquisaAdmin from "./BarraPesquisaAdmin";
import CabecalhoAdmin from "./CabecalhoAdmin";
import { CampoAdmin, LinhaAdmin, ListaAdmin } from "./ListaAdmin";
import ModalAdmin from "./ModalAdmin";
import Paginacao from "./Paginacao";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { useAuth } from "../../context/AuthContext";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useModalCadastro } from "../../hook/useModalCadastro";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { mesmoNome } from "../../lib/limites";

export interface TermoSimples {
  id: number;
  titulo: string;
  descricao: string;
}

interface Props {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  /** Nome no singular para títulos e mensagens (ex.: "termo de postagem"). */
  nomeItem?: string;
  listar: () => Promise<TermoSimples[]>;
  criar: (dados: { titulo: string; descricao: string }) => Promise<unknown>;
  atualizar: (id: number, dados: { titulo: string; descricao: string }) => Promise<unknown>;
  excluir: (id: number) => Promise<unknown>;
}

const TITULO_MAX = 255;
const DESCRICAO_MAX = 2000;

/**
 * Cadastro de termos com título e descrição (termos de postagem e de vínculo).
 *
 * Regra do backend: GET e DELETE para ADMIN; POST/PUT somente para as roles USUARIO/EMPRESA.
 * Um administrador que também tenha uma dessas roles (Admin → Usuários → adicionar perfil,
 * seguido de novo login) pode cadastrar e editar — "Cadastrar" e "Editar" ficam disponíveis
 * conforme as roles presentes na sessão. O título é VARCHAR(255) UNIQUE no banco.
 */
export default function CrudTermoSimples({ titulo, descricao, icone: Icone, nomeItem = "termo", listar, criar, atualizar, excluir }: Props) {
  const { pronto } = useRequireAdmin();
  const { usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const podeEscrever = !!usuario?.roles.some((r) => r === "USUARIO" || r === "EMPRESA");
  const dicaSemPermissao = "O servidor só aceita cadastro/edição de contas com perfil Usuário ou Empresa";

  const [termos, setTermos] = useState<TermoSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const modal = useModalCadastro<TermoSimples>();
  const [campoTitulo, setCampoTitulo] = useState("");
  const [campoDescricao, setCampoDescricao] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setTermos([...((await listar()) ?? [])].sort((a, b) => b.id - a.id));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os termos."));
    } finally {
      setLoading(false);
    }
  }, [listar]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const lista = useListagemAdmin(termos, (t) => [t.titulo, t.descricao]);

  function abrirNovo() {
    setCampoTitulo("");
    setCampoDescricao("");
    modal.abrirNovo();
  }

  function abrirEdicao(t: TermoSimples) {
    setCampoTitulo(t.titulo);
    setCampoDescricao(t.descricao);
    modal.abrirEdicao(t);
  }

  function salvar() {
    const idAtual = modal.registro?.id ?? null;
    modal.salvar({
      validar: () => {
        const t = campoTitulo.trim();
        if (!t || !campoDescricao.trim()) return "Preencha o título e a descrição.";
        if (t.length > TITULO_MAX) return `O título pode ter no máximo ${TITULO_MAX} caracteres.`;
        if (termos.some((x) => x.id !== idAtual && mesmoNome(x.titulo, t))) return "Já existe um termo com esse título.";
        return null;
      },
      enviar: () => {
        const dados = { titulo: campoTitulo.trim(), descricao: campoDescricao.trim() };
        return idAtual ? atualizar(idAtual, dados) : criar(dados);
      },
      sucesso: idAtual ? "Termo atualizado." : "Termo cadastrado.",
      falha: "Não foi possível salvar o termo. Verifique se o título já não está em uso.",
      depois: carregar,
    });
  }

  async function remover(termo: TermoSimples) {
    if (!(await confirmar(`Excluir o termo "${termo.titulo}"?`, { titulo: "Excluir termo", perigo: true }))) return;
    try {
      await excluir(termo.id);
      notificar("Termo excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o termo."));
    }
  }

  if (!pronto) {
    return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;
  }

  return (
    <>
      <CabecalhoAdmin
        icone={Icone}
        titulo={titulo}
        descricao={descricao}
        total={loading ? null : termos.length}
        rotuloTotal={["termo", "termos"]}
        onCadastrar={abrirNovo}
        cadastrarDesabilitado={!podeEscrever}
        dicaCadastrar={podeEscrever ? undefined : dicaSemPermissao}
      />

      {!podeEscrever && (
        <Alerta variante="info">
          O servidor só permite cadastrar e editar estes termos a contas com o perfil Usuário ou Empresa. Para cadastrar, adicione um desses
          perfis à sua conta em Admin → Usuários e entre novamente. Como administrador, você pode pesquisar, consultar e excluir.
        </Alerta>
      )}

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por título ou descrição..."
        rotulo={`Pesquisar ${titulo.toLowerCase()}`}
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={termos.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => lista.setTermo("")}
        icone={Icone}
        tituloVazio="Nenhum termo cadastrado ainda"
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="termos" />}
      >
        {lista.itens.map((termo) => (
          <LinhaAdmin
            key={termo.id}
            rotulo={termo.titulo}
            titulo={termo.titulo}
            subtitulo={<span className="whitespace-pre-line">{termo.descricao}</span>}
            onEditar={() => abrirEdicao(termo)}
            editarDesabilitado={!podeEscrever}
            dicaEditar={podeEscrever ? undefined : dicaSemPermissao}
            onExcluir={() => remover(termo)}
          />
        ))}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? `Editar ${nomeItem}` : `Cadastrar ${nomeItem}`}
        descricao={modal.editando ? `Alterando "${modal.registro?.titulo}".` : "Preencha o título e o texto do termo."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="termo-simples-titulo" rotulo="Título" obrigatorio contador={{ atual: campoTitulo.length, max: TITULO_MAX }}>
            <input id="termo-simples-titulo" value={campoTitulo} maxLength={TITULO_MAX} onChange={(e) => setCampoTitulo(e.target.value)} className={cls.input} />
          </CampoAdmin>
          <CampoAdmin id="termo-simples-descricao" rotulo="Descrição" obrigatorio contador={{ atual: campoDescricao.length, max: DESCRICAO_MAX }}>
            <textarea
              id="termo-simples-descricao"
              value={campoDescricao}
              maxLength={DESCRICAO_MAX}
              rows={5}
              onChange={(e) => setCampoDescricao(e.target.value)}
              className={`${cls.input} resize-y`}
            />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
