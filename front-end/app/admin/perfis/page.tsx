"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, IdCard, ImageOff, Link2 } from "lucide-react";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { CampoAdmin, LinhaAdmin, ListaAdmin } from "../../components/admin/ListaAdmin";
import ModalAdmin from "../../components/admin/ModalAdmin";
import Paginacao from "../../components/admin/Paginacao";
import CamposProfissional from "../../components/perfil/CamposProfissional";
import Alerta from "../../components/ui/Alerta";
import Avatar from "../../components/ui/Avatar";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useModalCadastro } from "../../hook/useModalCadastro";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import {
  CamposProfissionalValor,
  ErrosProfissional,
  linkedinDoPerfil,
  paraRequestProfissional,
  profissionalInicial,
  validarProfissional,
} from "../../lib/perfil";
import { tipoDocumento } from "../../lib/verificacao";
import { somenteDigitos } from "../../lib/validacao";
import { PerfilUsuario } from "../../types/PerfilUsuario";
import { Usuario } from "../../types/Usuario";
import {
  atualizarPerfilUsuario,
  criarPerfilUsuario,
  excluirPerfilUsuario,
  listarPerfisUsuario,
  removerBanner,
} from "../../services/perfilUsuario.service";
import { listarUsuarios, obterRolePrincipal } from "../../services/usuario.service";

/** CPF/CNPJ é dado pessoal: na lista aparece mascarado; o valor completo só no formulário. */
function mascararDocumento(identificador: string) {
  const d = somenteDigitos(identificador);
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (d.length === 14) return `**.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-**`;
  return "—";
}

/**
 * Perfis profissionais (PerfilUsuarioRequestDTO: linkedin, identificador, idEspecialidade,
 * idUsuario). POST/PUT/DELETE /perfil-usuario aceitam ADMIN; a capa (banner) também pode ser
 * removida pelo ADMIN (DELETE /perfil-usuario/{id}/banner). Um perfil por usuário.
 */
export default function AdminPerfisPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtroEspecialidade, setFiltroEspecialidade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | "CPF" | "CNPJ">("");

  const modal = useModalCadastro<PerfilUsuario>();
  const [usuarioId, setUsuarioId] = useState<number | "">("");
  const [campos, setCampos] = useState<CamposProfissionalValor>(() => profissionalInicial(null));
  const [erros, setErros] = useState<ErrosProfissional>({});

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaPerfis, listaUsuarios] = await Promise.all([listarPerfisUsuario(), listarUsuarios()]);
      setPerfis([...listaPerfis].sort((a, b) => a.usuario.nomeUsuario.localeCompare(b.usuario.nomeUsuario, "pt-BR")));
      setUsuarios([...(listaUsuarios ?? [])].sort((a, b) => a.nomeUsuario.localeCompare(b.nomeUsuario, "pt-BR")));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os perfis profissionais."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.idUsuario, u])), [usuarios]);
  const especialidades = useMemo(
    () => [...new Set(perfis.map((p) => p.especialidade?.nomeEspecialidade).filter((n): n is string => !!n))].sort(),
    [perfis]
  );
  // Só usuários que ainda não têm perfil (o backend guarda um perfil por usuário). Contas só
  // ADMIN ficam de fora: perfil profissional é para quem participa da rede.
  const comPerfil = useMemo(() => new Set(perfis.map((p) => p.usuario.idUsuario)), [perfis]);
  const semPerfil = useMemo(
    () => usuarios.filter((u) => !comPerfil.has(u.idUsuario) && obterRolePrincipal(u.roles) !== "ADMIN"),
    [usuarios, comPerfil]
  );

  const filtrados = useMemo(
    () =>
      perfis.filter(
        (p) =>
          (!filtroEspecialidade || p.especialidade?.nomeEspecialidade === filtroEspecialidade) &&
          (!filtroTipo || tipoDocumento(p.identificador) === filtroTipo)
      ),
    [perfis, filtroEspecialidade, filtroTipo]
  );
  const lista = useListagemAdmin(filtrados, (p) => [
    p.usuario.nomeUsuario,
    p.usuario.emailUsuario,
    p.especialidade?.nomeEspecialidade,
    linkedinDoPerfil(p),
  ]);

  function abrirNovo() {
    setUsuarioId("");
    setCampos(profissionalInicial(null));
    setErros({});
    modal.abrirNovo();
  }

  function abrirEdicao(p: PerfilUsuario) {
    setUsuarioId(p.usuario.idUsuario);
    setCampos(profissionalInicial(p));
    setErros({});
    modal.abrirEdicao(p);
  }

  function salvar() {
    const atual = modal.registro;
    modal.salvar({
      validar: () => {
        const e = validarProfissional(campos);
        setErros(e);
        if (!usuarioId) return "Selecione o usuário.";
        if (Object.keys(e).length > 0) return "Revise os campos destacados.";
        return null;
      },
      enviar: () => {
        const dados = paraRequestProfissional(campos, Number(usuarioId));
        return atual ? atualizarPerfilUsuario(atual.idPerfilUsuario, dados) : criarPerfilUsuario(dados);
      },
      sucesso: atual ? "Perfil profissional atualizado." : "Perfil profissional cadastrado.",
      falha: "Não foi possível salvar o perfil profissional.",
      depois: carregar,
    });
  }

  async function excluir(p: PerfilUsuario) {
    if (
      !(await confirmar(
        `Excluir o perfil profissional de "${p.usuario.nomeUsuario}"? A área de atuação, o CPF/CNPJ, o LinkedIn e a capa saem do perfil. A conta do usuário continua ativa.`,
        { titulo: "Excluir perfil profissional", perigo: true }
      ))
    )
      return;
    try {
      await excluirPerfilUsuario(p.idPerfilUsuario);
      await carregar();
      notificar("Perfil profissional excluído.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o perfil profissional."));
    }
  }

  async function tirarCapa(p: PerfilUsuario) {
    if (
      !(await confirmar(`Remover a imagem de capa do perfil de "${p.usuario.nomeUsuario}"?`, {
        titulo: "Remover capa",
        confirmarLabel: "Remover",
        perigo: true,
      }))
    )
      return;
    try {
      await removerBanner(p.idPerfilUsuario);
      await carregar();
      notificar("Capa removida.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível remover a capa."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  const emEdicao = modal.registro;
  const opcoesUsuario = emEdicao ? [usuariosPorId.get(emEdicao.usuario.idUsuario)].filter((u): u is Usuario => !!u) : semPerfil;

  return (
    <>
      <CabecalhoAdmin
        icone={IdCard}
        titulo="Perfis profissionais"
        descricao="Área de atuação, CPF/CNPJ e LinkedIn de cada usuário (um perfil por conta)."
        total={loading ? null : perfis.length}
        rotuloTotal={["perfil", "perfis"]}
        onCadastrar={abrirNovo}
        cadastrarDesabilitado={!loading && semPerfil.length === 0}
        dicaCadastrar={!loading && semPerfil.length === 0 ? "Todos os usuários já têm perfil profissional" : undefined}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome, e-mail, área ou LinkedIn..."
        rotulo="Pesquisar perfis profissionais"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <>
            <select
              aria-label="Filtrar por área de atuação"
              value={filtroEspecialidade}
              onChange={(e) => {
                setFiltroEspecialidade(e.target.value);
                lista.irPara(1);
              }}
              className={`${cls.input} !py-2.5 !bg-white sm:!w-56`}
            >
              <option value="">Todas as áreas</option>
              {especialidades.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por tipo de documento"
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value as "" | "CPF" | "CNPJ");
                lista.irPara(1);
              }}
              className={`${cls.input} !py-2.5 !bg-white sm:!w-44`}
            >
              <option value="">CPF e CNPJ</option>
              <option value="CPF">Pessoa física (CPF)</option>
              <option value="CNPJ">Empresa (CNPJ)</option>
            </select>
          </>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={perfis.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroEspecialidade("");
          setFiltroTipo("");
        }}
        icone={IdCard}
        tituloVazio="Nenhum perfil profissional cadastrado"
        descricaoVazio="Os perfis são criados pelos usuários em “Completar cadastro” ou aqui, pelo botão Cadastrar."
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="perfis" />}
      >
        {lista.itens.map((p) => {
          const linkedin = linkedinDoPerfil(p);
          const tipo = tipoDocumento(p.identificador);
          return (
            <LinhaAdmin
              key={p.idPerfilUsuario}
              rotulo={`perfil de ${p.usuario.nomeUsuario}`}
              inicio={<Avatar url={usuariosPorId.get(p.usuario.idUsuario)?.urlImagemUsuario} nome={p.usuario.nomeUsuario} tamanho={38} />}
              titulo={p.usuario.nomeUsuario}
              subtitulo={<span className="break-all">{p.usuario.emailUsuario}</span>}
              meta={
                <>
                  <span className={cls.chip}>{p.especialidade?.nomeEspecialidade ?? "Sem área"}</span>
                  <span className={cls.chipInativo} title="Documento mascarado">
                    {tipo ?? "Doc."} {mascararDocumento(p.identificador)}
                  </span>
                  {linkedin ? (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline"
                    >
                      <Link2 size={12} aria-hidden="true" /> LinkedIn
                    </a>
                  ) : (
                    <span className="text-[12px] text-ink-400">Sem LinkedIn</span>
                  )}
                  {p.urlBanner && <span className="text-[12px] text-ink-400">· com capa</span>}
                </>
              }
              acoes={
                <>
                  <Link
                    href={`/perfil/${p.usuario.idUsuario}`}
                    className={`${cls.btnIcone} !h-9 !w-9`}
                    aria-label={`Ver perfil de ${p.usuario.nomeUsuario}`}
                    title="Ver perfil"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  {p.urlBanner && (
                    <button
                      type="button"
                      onClick={() => tirarCapa(p)}
                      className={`${cls.btnIcone} !h-9 !w-9`}
                      aria-label={`Remover capa de ${p.usuario.nomeUsuario}`}
                      title="Remover capa"
                    >
                      <ImageOff size={16} />
                    </button>
                  )}
                </>
              }
              onEditar={() => abrirEdicao(p)}
              onExcluir={() => excluir(p)}
            />
          );
        })}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? "Editar perfil profissional" : "Cadastrar perfil profissional"}
        descricao={
          emEdicao
            ? `${emEdicao.usuario.nomeUsuario} · ${emEdicao.usuario.emailUsuario}`
            : "Escolha o usuário e preencha a área de atuação e o CPF/CNPJ."
        }
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
        largura="max-w-2xl"
      >
        <div className="space-y-5">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin
            id="perfil-usuario"
            rotulo="Usuário"
            obrigatorio
            ajuda={modal.editando ? "O dono do perfil não muda na edição." : "Somente usuários que ainda não têm perfil."}
          >
            <select
              id="perfil-usuario"
              value={usuarioId}
              disabled={modal.editando}
              onChange={(e) => setUsuarioId(e.target.value ? Number(e.target.value) : "")}
              className={`${cls.input} !bg-white`}
            >
              <option value="">Selecione o usuário</option>
              {opcoesUsuario.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nomeUsuario} ({u.emailUsuario})
                </option>
              ))}
            </select>
          </CampoAdmin>
          <CamposProfissional valor={campos} onChange={setCampos} erros={erros} desabilitado={modal.salvando} prefixoId="admin-prof" />
        </div>
      </ModalAdmin>
    </>
  );
}
