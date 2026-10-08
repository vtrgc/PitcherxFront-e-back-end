"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Power, ShieldCheck } from "lucide-react";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { CampoAdmin, LinhaAdmin, ListaAdmin } from "../../components/admin/ListaAdmin";
import ModalAdmin from "../../components/admin/ModalAdmin";
import Paginacao from "../../components/admin/Paginacao";
import Alerta from "../../components/ui/Alerta";
import Avatar from "../../components/ui/Avatar";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useModalCadastro } from "../../hook/useModalCadastro";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { ErrosCadastro, SENHA_MINIMA, somenteDigitos, validarCadastro } from "../../lib/validacao";
import { Usuario } from "../../types/Usuario";
import {
  listarUsuarios,
  cadastrarUsuario,
  ativarDesativarUsuario,
  excluirUsuario,
  adicionarRoleUsuario,
  obterRolePrincipal,
  ROLE_ID_MAP,
  ROLE_LABEL,
} from "../../services/usuario.service";

type FiltroStatus = "todos" | "ativos" | "inativos";

/**
 * Usuários.
 * - Cadastrar: POST /usuario/cadastro-usuario (nome, e-mail, senha, telefone opcional) —
 *   a conta nasce com o perfil USUARIO, como no cadastro público.
 * - Editar: status (PUT /usuario/ativar-desativar/{id}) e perfis (POST /usuario/alterar-role,
 *   que só ADICIONA). Nome, e-mail e telefone não são editados aqui: o PUT /usuario/{id} do
 *   backend grava a senha recebida sem criptografia e bloquearia o acesso do usuário.
 */
export default function AdminUsuariosPage() {
  const { pronto, usuario: admin } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroRole, setFiltroRole] = useState("");
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  // Cadastro
  const cadastro = useModalCadastro<Usuario>();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errosCadastro, setErrosCadastro] = useState<ErrosCadastro>({});

  // Edição (status + perfis)
  const edicao = useModalCadastro<Usuario>();
  const [ativo, setAtivo] = useState(true);
  const [roleNova, setRoleNova] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setUsuarios([...((await listarUsuarios()) ?? [])].sort((a, b) => b.idUsuario - a.idUsuario));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const filtradosPorStatus = useMemo(
    () =>
      usuarios.filter(
        (u) =>
          (filtroStatus === "todos" || (filtroStatus === "ativos" ? u.active : !u.active)) && (!filtroRole || (u.roles ?? []).includes(filtroRole))
      ),
    [usuarios, filtroStatus, filtroRole]
  );
  const lista = useListagemAdmin(filtradosPorStatus, (u) => [u.nomeUsuario, u.emailUsuario, u.telefoneUsuario, ...(u.roles ?? []).map((r) => ROLE_LABEL[r] ?? r)]);

  // ------------------------------------------------------------------ cadastro
  function abrirCadastro() {
    setNome("");
    setEmail("");
    setTelefone("");
    setSenha("");
    setConfirmarSenha("");
    setErrosCadastro({});
    cadastro.abrirNovo();
  }

  function salvarCadastro() {
    cadastro.salvar({
      validar: () => {
        const erros = validarCadastro({ nome, email, senha, confirmarSenha, telefone });
        if (!erros.email && usuarios.some((u) => u.emailUsuario.toLowerCase() === email.trim().toLowerCase())) erros.email = "Já existe um usuário com esse e-mail.";
        setErrosCadastro(erros);
        return Object.keys(erros).length > 0 ? "Revise os campos destacados." : null;
      },
      enviar: () =>
        cadastrarUsuario({
          nomeUsuario: nome.trim(),
          emailUsuario: email.trim().toLowerCase(),
          senhaUsuario: senha,
          // telefone_usuario é VARCHAR(13): só dígitos.
          telefoneUsuario: somenteDigitos(telefone) || undefined,
        }),
      sucesso: "Usuário cadastrado.",
      falha: "Não foi possível cadastrar o usuário.",
      depois: carregar,
    });
  }

  // ------------------------------------------------------------------ edição
  function abrirEdicao(u: Usuario) {
    setAtivo(u.active);
    setRoleNova("");
    edicao.abrirEdicao(u);
  }

  async function salvarEdicao() {
    const u = edicao.registro;
    if (!u) return;
    const mudouStatus = ativo !== u.active;
    if (!mudouStatus && !roleNova) {
      edicao.setErro("Nenhuma alteração para salvar.");
      return;
    }
    if (roleNova) {
      const irreversivel = "O servidor não possui endpoint para remover perfis: esta ação não pode ser desfeita pela interface.";
      const msg =
        roleNova === "ADMIN"
          ? `Conceder acesso de ADMINISTRADOR a "${u.nomeUsuario}"? ${irreversivel}`
          : `Adicionar o perfil ${ROLE_LABEL[roleNova]} a "${u.nomeUsuario}"? ${irreversivel}`;
      if (!(await confirmar(msg, { titulo: "Adicionar perfil", confirmarLabel: "Adicionar", perigo: roleNova === "ADMIN" }))) return;
    }
    edicao.salvar({
      enviar: async () => {
        if (mudouStatus) await ativarDesativarUsuario(u.idUsuario);
        if (roleNova) await adicionarRoleUsuario(u.idUsuario, ROLE_ID_MAP[roleNova]);
      },
      sucesso: roleNova ? "Usuário atualizado. Para o novo perfil valer, o usuário precisa entrar novamente." : "Usuário atualizado.",
      falha: "Não foi possível salvar as alterações.",
      depois: carregar,
    });
  }

  // ------------------------------------------------------------------ ações rápidas
  async function toggleAtivo(u: Usuario) {
    const acao = u.active ? "desativar" : "ativar";
    if (
      !(await confirmar(`Deseja ${acao} a conta de "${u.nomeUsuario}"?`, {
        titulo: u.active ? "Desativar conta" : "Ativar conta",
        confirmarLabel: u.active ? "Desativar" : "Ativar",
        perigo: u.active,
      }))
    )
      return;
    setProcessandoId(u.idUsuario);
    try {
      await ativarDesativarUsuario(u.idUsuario);
      notificar(`Conta ${u.active ? "desativada" : "ativada"}.`, "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível alterar o status."));
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluir(u: Usuario) {
    if (!(await confirmar(`Excluir permanentemente o usuário "${u.nomeUsuario}"? Essa ação não pode ser desfeita.`, { titulo: "Excluir usuário", perigo: true }))) return;
    setProcessandoId(u.idUsuario);
    try {
      await excluirUsuario(u.idUsuario);
      notificar("Usuário excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(
        mensagemErro(error, "Não foi possível excluir este usuário. Contas com curtidas, endereços ou outros registros vinculados podem ser recusadas pelo servidor.")
      );
    } finally {
      setProcessandoId(null);
    }
  }

  if (!pronto) {
    return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;
  }

  const emEdicao = edicao.registro;
  const rolesDisponiveis = emEdicao ? Object.keys(ROLE_ID_MAP).filter((r) => !(emEdicao.roles ?? []).includes(r)) : [];
  const campoErro = (campo: keyof ErrosCadastro) =>
    errosCadastro[campo] ? { "aria-invalid": true, "aria-describedby": `usr-${campo}-erro` } : {};

  return (
    <>
      <CabecalhoAdmin
        icone={ShieldCheck}
        titulo="Usuários"
        descricao="Contas da plataforma: cadastro, status e perfis de acesso."
        total={loading ? null : usuarios.length}
        rotuloTotal={["usuário", "usuários"]}
        onCadastrar={abrirCadastro}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por nome, e-mail ou telefone..."
        rotulo="Pesquisar usuários"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <>
            <select
              aria-label="Filtrar por status"
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value as FiltroStatus);
                lista.irPara(1);
              }}
              className={`${cls.input} !py-2.5 !bg-white sm:!w-44`}
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Somente ativos</option>
              <option value="inativos">Somente inativos</option>
            </select>
            <select
              aria-label="Filtrar por perfil"
              value={filtroRole}
              onChange={(e) => {
                setFiltroRole(e.target.value);
                lista.irPara(1);
              }}
              className={`${cls.input} !py-2.5 !bg-white sm:!w-44`}
            >
              <option value="">Todos os perfis</option>
              {Object.keys(ROLE_ID_MAP).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={usuarios.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroStatus("todos");
          setFiltroRole("");
        }}
        icone={ShieldCheck}
        tituloVazio="Nenhum usuário cadastrado"
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="usuários" />}
      >
        {lista.itens.map((u) => {
          const ehVoce = u.idUsuario === admin?.idUsuario;
          const ocupado = processandoId === u.idUsuario;
          const principal = obterRolePrincipal(u.roles);
          return (
            <LinhaAdmin
              key={u.idUsuario}
              rotulo={u.nomeUsuario}
              inicio={<Avatar url={u.urlImagemUsuario} nome={u.nomeUsuario} tamanho={38} />}
              titulo={
                <span className="flex flex-wrap items-center gap-2">
                  {u.nomeUsuario}
                  {ehVoce && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold text-brand-700">você</span>}
                </span>
              }
              subtitulo={<span className="break-all">{u.emailUsuario}</span>}
              meta={
                <>
                  <span
                    className={u.active ? cls.chipAtivo : cls.chipInativo}
                    title={u.active ? "Conta ativa" : "Conta desativada ou aguardando a verificação do e-mail (código enviado no cadastro)"}
                  >
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                  <span className={cls.chip} title={(u.roles ?? []).map((r) => ROLE_LABEL[r] ?? r).join(", ")}>
                    {ROLE_LABEL[principal] ?? principal}
                    {(u.roles ?? []).length > 1 && ` +${u.roles.length - 1}`}
                  </span>
                </>
              }
              acoes={
                <>
                  <Link href={`/perfil/${u.idUsuario}`} className={`${cls.btnIcone} !h-9 !w-9`} aria-label={`Ver perfil de ${u.nomeUsuario}`} title="Ver perfil">
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleAtivo(u)}
                    disabled={ocupado || ehVoce}
                    className={`${cls.btnIcone} !h-9 !w-9`}
                    aria-label={`${u.active ? "Desativar" : "Ativar"} ${u.nomeUsuario}`}
                    title={ehVoce ? "Você não pode desativar a própria conta" : u.active ? "Desativar" : "Ativar"}
                  >
                    {ocupado ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                  </button>
                </>
              }
              onEditar={() => abrirEdicao(u)}
              editarDesabilitado={ehVoce || ocupado}
              dicaEditar={ehVoce ? "Você não pode alterar a própria conta aqui" : undefined}
              onExcluir={ehVoce ? undefined : () => excluir(u)}
            />
          );
        })}
      </ListaAdmin>

      {/* ------------------------------------------------------------ cadastrar */}
      <ModalAdmin
        aberto={cadastro.aberto}
        titulo="Cadastrar usuário"
        descricao="A conta é criada com o perfil Usuário e fica inativa até a pessoa confirmar o código enviado por e-mail (ou até você ativá-la em Editar). Outros perfis podem ser adicionados em Editar."
        onFechar={cadastro.fechar}
        onSalvar={salvarCadastro}
        salvando={cadastro.salvando}
        rotuloSalvar="Cadastrar"
      >
        <div className="space-y-4">
          {cadastro.erro && <Alerta>{cadastro.erro}</Alerta>}
          <CampoAdmin id="usr-nome" rotulo="Nome" obrigatorio erro={errosCadastro.nome}>
            <input id="usr-nome" value={nome} maxLength={255} onChange={(e) => setNome(e.target.value)} autoComplete="off" className={cls.input} {...campoErro("nome")} />
          </CampoAdmin>
          <CampoAdmin id="usr-email" rotulo="E-mail" obrigatorio erro={errosCadastro.email}>
            <input id="usr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className={cls.input} {...campoErro("email")} />
          </CampoAdmin>
          <CampoAdmin id="usr-telefone" rotulo="Telefone (opcional)" erro={errosCadastro.telefone} ajuda="Com DDD. Ex.: (11) 99999-0000">
            <input
              id="usr-telefone"
              type="tel"
              inputMode="tel"
              value={telefone}
              maxLength={20}
              onChange={(e) => setTelefone(e.target.value.replace(/[^\d()\s+-]/g, ""))}
              className={cls.input}
              {...campoErro("telefone")}
            />
          </CampoAdmin>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoAdmin id="usr-senha" rotulo="Senha" obrigatorio erro={errosCadastro.senha} ajuda={`Mínimo de ${SENHA_MINIMA} caracteres.`}>
              <input id="usr-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" className={cls.input} {...campoErro("senha")} />
            </CampoAdmin>
            <CampoAdmin id="usr-confirmarSenha" rotulo="Confirmar senha" obrigatorio erro={errosCadastro.confirmarSenha}>
              <input
                id="usr-confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
                className={cls.input}
                {...campoErro("confirmarSenha")}
              />
            </CampoAdmin>
          </div>
        </div>
      </ModalAdmin>

      {/* ------------------------------------------------------------ editar */}
      <ModalAdmin
        aberto={edicao.aberto}
        titulo="Editar usuário"
        descricao={emEdicao ? `${emEdicao.nomeUsuario} · ${emEdicao.emailUsuario}` : undefined}
        onFechar={edicao.fechar}
        onSalvar={salvarEdicao}
        salvando={edicao.salvando}
        rotuloSalvar="Salvar alterações"
      >
        {emEdicao && (
          <div className="space-y-5">
            {edicao.erro && <Alerta>{edicao.erro}</Alerta>}
            <dl className="grid gap-3 rounded-xl bg-ink-25 p-4 text-[13.5px] sm:grid-cols-2">
              <div>
                <dt className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-400">Nome</dt>
                <dd className="mt-0.5 break-words text-ink-800">{emEdicao.nomeUsuario}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-400">E-mail</dt>
                <dd className="mt-0.5 break-all text-ink-800">{emEdicao.emailUsuario}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-400">Telefone</dt>
                <dd className="mt-0.5 text-ink-800">{emEdicao.telefoneUsuario || "Não informado"}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-400">Perfis atuais</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {(emEdicao.roles ?? []).map((r) => (
                    <span key={r} className={cls.chip}>
                      {ROLE_LABEL[r] ?? r}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <p className="text-[12.5px] leading-5 text-ink-500">
              Nome, e-mail e telefone são alterados pelo próprio usuário. A atualização de cadastro do servidor (PUT /usuario) gravaria a
              senha sem criptografia e bloquearia o acesso da pessoa.
            </p>

            <fieldset>
              <legend className={cls.label}>Status da conta</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { valor: true, rotulo: "Ativa" },
                  { valor: false, rotulo: "Desativada" },
                ].map((op) => (
                  <label
                    key={op.rotulo}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] ${
                      ativo === op.valor ? "border-brand-300 bg-brand-50 text-ink-900" : "border-ink-100 text-ink-700 hover:bg-ink-25"
                    }`}
                  >
                    <input type="radio" name="usr-status" checked={ativo === op.valor} onChange={() => setAtivo(op.valor)} className="h-4 w-4 accent-brand-600" />
                    {op.rotulo}
                  </label>
                ))}
              </div>
            </fieldset>

            <CampoAdmin
              id="usr-role"
              rotulo="Adicionar perfil"
              ajuda={rolesDisponiveis.length === 0 ? "Este usuário já possui todos os perfis." : "O servidor só adiciona perfis; não é possível removê-los depois."}
            >
              <select
                id="usr-role"
                value={roleNova}
                onChange={(e) => setRoleNova(e.target.value)}
                disabled={rolesDisponiveis.length === 0}
                className={`${cls.input} !bg-white`}
              >
                <option value="">Nenhum</option>
                {rolesDisponiveis.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r] ?? r}
                  </option>
                ))}
              </select>
            </CampoAdmin>
          </div>
        )}
      </ModalAdmin>
    </>
  );
}
