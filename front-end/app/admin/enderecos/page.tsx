"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home } from "lucide-react";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { CampoAdmin, LinhaAdmin, ListaAdmin } from "../../components/admin/ListaAdmin";
import ModalAdmin from "../../components/admin/ModalAdmin";
import Paginacao from "../../components/admin/Paginacao";
import CamposEndereco from "../../components/perfil/CamposEndereco";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useModalCadastro } from "../../hook/useModalCadastro";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { formatarCep } from "../../lib/cep";
import { CamposEnderecoValor, ErrosEndereco, NOME_UF, enderecoInicial, paraRequestEndereco, validarEndereco } from "../../lib/perfil";
import { Endereco, UFS } from "../../types/Endereco";
import { Usuario } from "../../types/Usuario";
import { listarEnderecos, criarEndereco, atualizarEndereco, excluirEndereco } from "../../services/endereco.service";
import { listarUsuarios } from "../../services/usuario.service";

/**
 * Endereços (EnderecoRequestDTO: cep ≤ 8, uf 2, bairro, logradouro, complemento, numeroCasa e
 * usuarioId — todos obrigatórios). A cidade vem da consulta de CEP, mas não é salva pela API.
 */
export default function AdminEnderecosPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtroUf, setFiltroUf] = useState("");

  const modal = useModalCadastro<Endereco>();
  const [usuarioId, setUsuarioId] = useState<number | "">("");
  const [campos, setCampos] = useState<CamposEnderecoValor>(() => enderecoInicial(null));
  const [errosCampos, setErrosCampos] = useState<ErrosEndereco>({});

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaEnderecos, listaUsuarios] = await Promise.all([listarEnderecos(), listarUsuarios()]);
      setEnderecos([...(listaEnderecos ?? [])].sort((a, b) => b.idEndereco - a.idEndereco));
      setUsuarios([...(listaUsuarios ?? [])].sort((a, b) => a.nomeUsuario.localeCompare(b.nomeUsuario, "pt-BR")));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os endereços."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const nomes = useMemo(() => new Map(usuarios.map((u) => [u.idUsuario, u.nomeUsuario])), [usuarios]);
  const nomeUsuario = (id: number) => nomes.get(id) ?? `Usuário #${id}`;

  const daUf = useMemo(() => (filtroUf ? enderecos.filter((e) => e.uf === filtroUf) : enderecos), [enderecos, filtroUf]);
  const lista = useListagemAdmin(daUf, (e) => [
    e.logradouro,
    e.numeroCasa,
    e.complemento,
    e.bairro,
    e.uf,
    NOME_UF[e.uf],
    e.cep,
    formatarCep(e.cep),
    nomes.get(e.usuarioId),
  ]);
  const ufsUsadas = useMemo(() => UFS.filter((uf) => enderecos.some((e) => e.uf === uf)), [enderecos]);

  function abrirNovo() {
    setUsuarioId("");
    setCampos(enderecoInicial(null));
    setErrosCampos({});
    modal.abrirNovo();
  }

  function abrirEdicao(e: Endereco) {
    setUsuarioId(e.usuarioId);
    setCampos(enderecoInicial(e));
    setErrosCampos({});
    modal.abrirEdicao(e);
  }

  function salvar() {
    const idAtual = modal.registro?.idEndereco ?? null;
    modal.salvar({
      validar: () => {
        const erros = validarEndereco(campos);
        setErrosCampos(erros);
        if (!usuarioId) return "Selecione o usuário dono do endereço.";
        if (Object.keys(erros).length > 0) return "Revise os campos destacados.";
        return null;
      },
      enviar: () => {
        const dados = paraRequestEndereco(campos, Number(usuarioId));
        return idAtual ? atualizarEndereco(idAtual, dados) : criarEndereco(dados);
      },
      sucesso: idAtual ? "Endereço atualizado." : "Endereço cadastrado.",
      falha: "Não foi possível salvar o endereço.",
      depois: carregar,
    });
  }

  async function excluir(e: Endereco) {
    if (!(await confirmar(`Excluir o endereço de ${nomeUsuario(e.usuarioId)} (${e.logradouro}, ${e.numeroCasa})?`, { titulo: "Excluir endereço", perigo: true }))) return;
    try {
      await excluirEndereco(e.idEndereco);
      notificar("Endereço excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o endereço."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  return (
    <>
      <CabecalhoAdmin
        icone={Home}
        titulo="Endereços"
        descricao="Endereços cadastrados e vinculados a cada usuário."
        total={loading ? null : enderecos.length}
        rotuloTotal={["endereço", "endereços"]}
        onCadastrar={abrirNovo}
        cadastrarDesabilitado={!loading && usuarios.length === 0}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por rua, bairro, CEP ou usuário..."
        rotulo="Pesquisar endereços"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <select
            aria-label="Filtrar por estado"
            value={filtroUf}
            onChange={(e) => {
              setFiltroUf(e.target.value);
              lista.irPara(1);
            }}
            className={`${cls.input} !py-2.5 !bg-white sm:!w-48`}
          >
            <option value="">Todos os estados</option>
            {ufsUsadas.map((uf) => (
              <option key={uf} value={uf}>
                {uf} — {NOME_UF[uf]}
              </option>
            ))}
          </select>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={enderecos.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroUf("");
        }}
        icone={Home}
        tituloVazio="Nenhum endereço cadastrado ainda"
        descricaoVazio='Use o botão "Cadastrar" para adicionar um endereço a um usuário.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="endereços" />}
      >
        {lista.itens.map((e) => (
          <LinhaAdmin
            key={e.idEndereco}
            rotulo={`endereço de ${nomeUsuario(e.usuarioId)}`}
            titulo={
              <>
                {e.logradouro}, {e.numeroCasa}
                {e.complemento ? <span className="font-normal text-ink-500"> — {e.complemento}</span> : null}
              </>
            }
            subtitulo={`${e.bairro} · ${NOME_UF[e.uf] ?? e.uf} · CEP ${formatarCep(e.cep)}`}
            meta={<span className={cls.chip}>{nomeUsuario(e.usuarioId)}</span>}
            onEditar={() => abrirEdicao(e)}
            onExcluir={() => excluir(e)}
          />
        ))}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar endereço" : "Cadastrar endereço"}
        descricao={modal.editando ? `Endereço de ${nomeUsuario(modal.registro!.usuarioId)}.` : "Digite o CEP para preencher rua, bairro e estado."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
        largura="max-w-2xl"
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="end-usuario" rotulo="Usuário" obrigatorio>
            <select
              id="end-usuario"
              value={usuarioId}
              onChange={(ev) => setUsuarioId(ev.target.value ? Number(ev.target.value) : "")}
              aria-invalid={!!modal.erro && !usuarioId}
              className={`${cls.input} !bg-white`}
            >
              <option value="">Selecione o usuário</option>
              {usuarios.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nomeUsuario} ({u.emailUsuario})
                </option>
              ))}
            </select>
          </CampoAdmin>
          <CamposEndereco valor={campos} onChange={setCampos} erros={errosCampos} desabilitado={modal.salvando} prefixoId="admin-end" />
        </div>
      </ModalAdmin>
    </>
  );
}
