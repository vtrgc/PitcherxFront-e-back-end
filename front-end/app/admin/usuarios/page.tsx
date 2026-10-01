"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Power, Trash2, ShieldCheck, UserPlus, Loader2, ExternalLink, X } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import Alerta from "../../components/ui/Alerta";
import Avatar from "../../components/ui/Avatar";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { Usuario } from "../../types/Usuario";
import {
  listarUsuarios,
  ativarDesativarUsuario,
  excluirUsuario,
  adicionarRoleUsuario,
  obterRolePrincipal,
  ROLE_ID_MAP,
  ROLE_LABEL,
} from "../../services/usuario.service";

type FiltroStatus = "todos" | "ativos" | "inativos";

export default function AdminUsuariosPage() {
  const { pronto, usuario: admin } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroRole, setFiltroRole] = useState("");
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const [gerenciando, setGerenciando] = useState<Usuario | null>(null);
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

  async function toggleAtivo(u: Usuario) {
    const acao = u.active ? "desativar" : "ativar";
    if (!(await confirmar(`Deseja ${acao} a conta de "${u.nomeUsuario}"?`, { titulo: u.active ? "Desativar conta" : "Ativar conta", confirmarLabel: u.active ? "Desativar" : "Ativar", perigo: u.active }))) return;
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
        mensagemErro(
          error,
          "Não foi possível excluir este usuário. Contas com curtidas, endereços ou outros registros vinculados podem ser recusadas pelo servidor."
        )
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function adicionarRole() {
    if (!gerenciando || !roleNova) return;
    const irreversivel = "O servidor não possui endpoint para remover perfis: esta ação não pode ser desfeita pela interface.";
    const mensagem =
      roleNova === "ADMIN"
        ? `Conceder acesso de ADMINISTRADOR a "${gerenciando.nomeUsuario}"? ${irreversivel}`
        : `Adicionar o perfil ${ROLE_LABEL[roleNova]} a "${gerenciando.nomeUsuario}"? ${irreversivel}`;
    if (!(await confirmar(mensagem, { titulo: "Adicionar perfil", confirmarLabel: "Adicionar", perigo: roleNova === "ADMIN" }))) return;

    setProcessandoId(gerenciando.idUsuario);
    try {
      await adicionarRoleUsuario(gerenciando.idUsuario, ROLE_ID_MAP[roleNova]);
      notificar("Perfil adicionado. O usuário precisa entrar novamente para a mudança valer.", "sucesso");
      setGerenciando(null);
      setRoleNova("");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível adicionar o perfil."));
    } finally {
      setProcessandoId(null);
    }
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter(
      (u) =>
        (!termo || u.nomeUsuario.toLowerCase().includes(termo) || u.emailUsuario.toLowerCase().includes(termo)) &&
        (filtroStatus === "todos" || (filtroStatus === "ativos" ? u.active : !u.active)) &&
        (!filtroRole || (u.roles ?? []).includes(filtroRole))
    );
  }, [usuarios, busca, filtroStatus, filtroRole]);

  if (!pronto) {
    return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;
  }

  const rolesDisponiveis = gerenciando ? Object.keys(ROLE_ID_MAP).filter((r) => !(gerenciando.roles ?? []).includes(r)) : [];

  return (
    <>
      <div className={`${cls.card} p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <ShieldCheck size={19} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">Usuários</h1>
            <p className="text-[0.8125rem] text-ink-500 mt-0.5">
              {usuarios.length} usuário{usuarios.length === 1 ? "" : "s"} cadastrado{usuarios.length === 1 ? "" : "s"}. Nome,
              e-mail e telefone são editados pelo próprio usuário; aqui o administrador gerencia status e perfis.
            </p>
          </div>
        </div>
      </div>

      {gerenciando && (
        <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-perfis">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="titulo-perfis" className={cls.h2}>
                Perfis de {gerenciando.nomeUsuario}
              </h2>
              <p className={`${cls.textoSuave} mt-1`}>
                O backend apenas <strong>adiciona</strong> perfis (POST /usuario/alterar-role); não há como remover um perfil
                já concedido.
              </p>
            </div>
            <button type="button" onClick={() => setGerenciando(null)} className={cls.btnIcone} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(gerenciando.roles ?? []).map((r) => (
              <span key={r} className={cls.chip}>
                {ROLE_LABEL[r] ?? r}
              </span>
            ))}
          </div>

          {rolesDisponiveis.length === 0 ? (
            <p className={`${cls.textoSuave} mt-4`}>Este usuário já possui todos os perfis.</p>
          ) : (
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="role-nova" className={cls.label}>
                  Adicionar perfil
                </label>
                <select id="role-nova" value={roleNova} onChange={(e) => setRoleNova(e.target.value)} className={`${cls.input} !w-auto !bg-white`}>
                  <option value="">Selecione</option>
                  {rolesDisponiveis.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r] ?? r}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={adicionarRole}
                disabled={!roleNova || processandoId === gerenciando.idUsuario}
                className={cls.btnPrimario}
              >
                {processandoId === gerenciando.idUsuario ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Adicionar
              </button>
            </div>
          )}
        </section>
      )}

      <div className={`${cls.card} flex flex-wrap items-center gap-3 p-3`}>
        <div className="flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-25 px-3.5 focus-within:border-brand-500 focus-within:bg-white">
          <Search size={17} className="shrink-0 text-brand-500" aria-hidden="true" />
          <label htmlFor="busca-usuarios" className="sr-only">
            Buscar usuários
          </label>
          <input
            id="busca-usuarios"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="h-full w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-ink-400"
          />
        </div>
        <select aria-label="Filtrar por status" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
          <option value="todos">Todos os status</option>
          <option value="ativos">Somente ativos</option>
          <option value="inativos">Somente inativos</option>
        </select>
        <select aria-label="Filtrar por perfil" value={filtroRole} onChange={(e) => setFiltroRole(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
          <option value="">Todos os perfis</option>
          {Object.keys(ROLE_ID_MAP).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className={`${cls.card} overflow-hidden`}>
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Carregando usuários">
            <div className={`${cls.skeleton} h-5 w-full rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-4/5 rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-3/5 rounded-lg`} />
          </div>
        ) : erroCarregamento ? null : filtrados.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nenhum usuário encontrado" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {filtrados.map((u) => {
              const ehVoce = u.idUsuario === admin?.idUsuario;
              const ocupado = processandoId === u.idUsuario;
              return (
                <li key={u.idUsuario} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-brand-50/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar url={u.urlImagemUsuario} nome={u.nomeUsuario} tamanho={38} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14.5px] font-semibold text-ink-900">{u.nomeUsuario}</h3>
                        {ehVoce && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold text-brand-700">você</span>}
                      </div>
                      <p className="truncate text-[0.8125rem] text-ink-500">{u.emailUsuario}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <span className={u.active ? cls.chipAtivo : cls.chipInativo}>{u.active ? "Ativo" : "Inativo"}</span>
                    <span className={cls.chip} title={(u.roles ?? []).join(", ")}>
                      {ROLE_LABEL[obterRolePrincipal(u.roles)] ?? obterRolePrincipal(u.roles)}
                      {(u.roles ?? []).length > 1 && ` +${u.roles.length - 1}`}
                    </span>

                    <Link href={`/perfil/${u.idUsuario}`} className={cls.btnIcone} aria-label={`Ver perfil de ${u.nomeUsuario}`}>
                      <ExternalLink size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setGerenciando(u);
                        setRoleNova("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={ocupado || ehVoce}
                      className={cls.btnIcone}
                      aria-label={`Gerenciar perfis de ${u.nomeUsuario}`}
                      title={ehVoce ? "Você não pode alterar seus próprios perfis" : "Gerenciar perfis"}
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAtivo(u)}
                      disabled={ocupado || ehVoce}
                      className={cls.btnIcone}
                      aria-label={`${u.active ? "Desativar" : "Ativar"} ${u.nomeUsuario}`}
                      title={ehVoce ? "Você não pode desativar a própria conta" : u.active ? "Desativar" : "Ativar"}
                    >
                      {ocupado ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(u)}
                      disabled={ocupado || ehVoce}
                      className={cls.btnIconePerigo}
                      aria-label={`Excluir ${u.nomeUsuario}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
