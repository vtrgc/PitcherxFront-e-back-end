"use client";

import { useState } from "react";
import Link from "next/link";
import { Key, Trash2, Settings, ChevronRight, Loader2, UserRound, Bell, Users, LogOut, Mail, Phone, Clock } from "lucide-react";
import PageShell from "../components/PageShell";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { useAuth } from "../context/AuthContext";
import { redefinirSenha, excluirUsuario } from "../services/usuario.service";
import { ApiError, decodificarToken, getToken, mensagemErro } from "../lib/api";
import { useNotificacoes } from "../context/NotificacoesContext";
import { SENHA_MINIMA } from "../lib/validacao";

export default function Configuracoes() {
  const { usuario, logout, isAdmin } = useAuth();
  const { notificar } = useFeedback();
  const { naoLidas } = useNotificacoes();
  // Validade da sessão: o JWT do backend expira em 30 dias (campo `exp`).
  const [expiraEm] = useState(() => {
    const exp = decodificarToken(getToken())?.exp;
    return typeof exp === "number" ? new Date(exp * 1000) : null;
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [erroExclusao, setErroExclusao] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  function limparSenha() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroSenha("");
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario || salvandoSenha) return;
    setErroSenha("");

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      setErroSenha("Preencha todos os campos.");
      return;
    }
    if (novaSenha.length < SENHA_MINIMA) {
      setErroSenha(`A nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha("As novas senhas não conferem.");
      return;
    }
    if (novaSenha === senhaAtual) {
      setErroSenha("A nova senha deve ser diferente da atual.");
      return;
    }

    setSalvandoSenha(true);
    try {
      await redefinirSenha(usuario.idUsuario, senhaAtual, novaSenha);
      notificar("Senha alterada com sucesso.", "sucesso");
      limparSenha();
      setMostrarSenha(false);
    } catch (error) {
      setErroSenha(
        error instanceof ApiError && error.status === 400
          ? error.message || "A senha atual está incorreta."
          : mensagemErro(error, "Não foi possível alterar a senha.")
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function excluirConta() {
    if (!usuario || excluindo) return;
    setErroExclusao("");
    if (textoConfirmacao.trim().toUpperCase() !== "EXCLUIR") {
      setErroExclusao('Digite "EXCLUIR" para confirmar.');
      return;
    }
    setExcluindo(true);
    try {
      await excluirUsuario(usuario.idUsuario);
      logout();
    } catch (error) {
      setErroExclusao(
        error instanceof ApiError && error.status >= 500
          ? "Não foi possível excluir a conta. Contas com curtidas, projetos ou outros registros vinculados podem não ser removidas pelo servidor."
          : mensagemErro(error, "Não foi possível excluir a conta.")
      );
      setExcluindo(false);
    }
  }

  return (
    <PageShell>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Settings size={19} aria-hidden="true" />
        </div>
        <h1 className="font-display text-[1.75rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink-900">Configurações</h1>
      </div>

      <div className="max-w-2xl divide-y divide-ink-100 border-y border-ink-100">
        <Link href="/perfil" className="flex items-center justify-between py-4 text-[14.5px] font-medium text-ink-900 hover:text-brand-700">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <UserRound size={18} aria-hidden="true" />
            </span>
            Perfil e foto
          </span>
          <ChevronRight size={17} className="text-ink-400" aria-hidden="true" />
        </Link>

        <div className="py-4">
          <p className="flex items-center gap-3 text-[14.5px] font-medium text-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Mail size={18} aria-hidden="true" />
            </span>
            Dados da conta
          </p>
          <dl className="mt-3 grid gap-3 pl-12 text-[13.5px] sm:grid-cols-2">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">Nome</dt>
              <dd className="mt-0.5 break-words text-ink-800">{usuario?.nomeUsuario ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">E-mail</dt>
              <dd className="mt-0.5 break-all text-ink-800">{usuario?.emailUsuario ?? "—"}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">
                <Phone size={12} aria-hidden="true" /> Telefone
              </dt>
              <dd className="mt-0.5 text-ink-800">{usuario?.telefoneUsuario || "Não informado"}</dd>
            </div>
          </dl>
          <p className="mt-3 pl-12 text-[12.5px] leading-5 text-ink-500">
            Nome, e-mail e telefone ainda não podem ser alterados pelo PitcherX: a atualização de cadastro do servidor
            (PUT /usuario) grava a senha sem criptografia e bloquearia o seu acesso. A edição será liberada quando o
            servidor for corrigido.
          </p>
        </div>

        <Link href="/notificacoes" className="flex items-center justify-between py-4 text-[14.5px] font-medium text-ink-900 hover:text-brand-700">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Bell size={18} aria-hidden="true" />
            </span>
            Notificações
            {!!naoLidas && naoLidas > 0 && (
              <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white">{naoLidas} não lida{naoLidas === 1 ? "" : "s"}</span>
            )}
          </span>
          <ChevronRight size={17} className="text-ink-400" aria-hidden="true" />
        </Link>

        {!isAdmin && (
          <Link href="/conexoes" className="flex items-center justify-between py-4 text-[14.5px] font-medium text-ink-900 hover:text-brand-700">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Users size={18} aria-hidden="true" />
              </span>
              Conexões e solicitações
            </span>
            <ChevronRight size={17} className="text-ink-400" aria-hidden="true" />
          </Link>
        )}

        <div>
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-expanded={mostrarSenha}
            aria-controls="painel-senha"
            className="flex w-full items-center justify-between py-4 text-left text-[14.5px] font-medium text-ink-900 hover:text-brand-700"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Key size={18} aria-hidden="true" />
              </span>
              Alterar senha
            </span>
            <ChevronRight
              size={17}
              className="text-ink-400 transition-transform"
              style={{ transform: mostrarSenha ? "rotate(90deg)" : "none" }}
              aria-hidden="true"
            />
          </button>

          {mostrarSenha && (
            <form id="painel-senha" noValidate onSubmit={alterarSenha} className="space-y-4 pb-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="senhaAtual" className={cls.label}>
                    Senha atual
                  </label>
                  <input
                    id="senhaAtual"
                    type="password"
                    autoComplete="current-password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className={cls.input}
                  />
                </div>
                <div>
                  <label htmlFor="novaSenha" className={cls.label}>
                    Nova senha
                  </label>
                  <input
                    id="novaSenha"
                    type="password"
                    autoComplete="new-password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
                    className={cls.input}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="confirmarNovaSenha" className={cls.label}>
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirmarNovaSenha"
                    type="password"
                    autoComplete="new-password"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className={cls.input}
                  />
                </div>
              </div>

              {erroSenha && <Alerta>{erroSenha}</Alerta>}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarSenha(false);
                    limparSenha();
                  }}
                  className={cls.btnSecundario}
                  disabled={salvandoSenha}
                >
                  Cancelar
                </button>
                <button type="submit" className={cls.btnPrimario} disabled={salvandoSenha}>
                  {salvandoSenha && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {salvandoSenha ? "Salvando..." : "Alterar senha"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <span className="flex items-center gap-3 text-[14.5px] font-medium text-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Clock size={18} aria-hidden="true" />
            </span>
            <span>
              Sessão
              <span className="block text-[12.5px] font-normal text-ink-500">
                {expiraEm ? `Válida até ${expiraEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : "Sessão ativa neste navegador"}
              </span>
            </span>
          </span>
          <button type="button" onClick={() => logout()} className={cls.btnContorno}>
            <LogOut size={16} aria-hidden="true" /> Sair da conta
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setMostrarExclusao((v) => !v)}
            aria-expanded={mostrarExclusao}
            aria-controls="painel-exclusao"
            className="flex w-full items-center justify-between py-4 text-left text-[14.5px] font-medium text-red-600 hover:text-red-700"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              Excluir conta
            </span>
            <ChevronRight
              size={17}
              className="text-red-400 transition-transform"
              style={{ transform: mostrarExclusao ? "rotate(90deg)" : "none" }}
              aria-hidden="true"
            />
          </button>

          {mostrarExclusao && (
            <div id="painel-exclusao" className="space-y-4 rounded-2xl bg-red-50 p-5 pb-6 mb-4">
              <div className="text-sm text-ink-600">
                <p className="font-semibold mb-2">Esta ação é irreversível.</p>
                <p>
                  Sua conta será removida do PitcherX. {isAdmin && "Você está usando uma conta de administrador. "}
                  Se houver registros vinculados que o servidor não consiga remover, a exclusão será recusada.
                </p>
              </div>

              <div>
                <label htmlFor="deleteConfirm" className={cls.label}>
                  Digite &quot;EXCLUIR&quot; para confirmar
                </label>
                <input
                  id="deleteConfirm"
                  type="text"
                  autoComplete="off"
                  value={textoConfirmacao}
                  onChange={(e) => setTextoConfirmacao(e.target.value)}
                  className={cls.input}
                  placeholder="EXCLUIR"
                />
              </div>

              {erroExclusao && <Alerta>{erroExclusao}</Alerta>}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarExclusao(false);
                    setTextoConfirmacao("");
                    setErroExclusao("");
                  }}
                  className={cls.btnSecundario}
                  disabled={excluindo}
                >
                  Cancelar
                </button>
                <button type="button" onClick={excluirConta} className={cls.btnPerigo} disabled={excluindo}>
                  {excluindo && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {excluindo ? "Excluindo..." : "Excluir minha conta"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
