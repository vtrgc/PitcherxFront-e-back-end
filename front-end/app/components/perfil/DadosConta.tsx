"use client";

import { useState } from "react";
import { Loader2, Lock, Save } from "lucide-react";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { AuthUser, useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { emailValido, somenteDigitos, telefoneValido } from "../../lib/validacao";
import { atualizarUsuario } from "../../services/usuario.service";

/**
 * Nome, e-mail e telefone (PUT /usuario/{id}). O backend pede a senha atual como confirmação
 * (ela não é alterada aqui). O token identifica o usuário pelo e-mail: se o e-mail mudar, a
 * sessão é refeita com o novo e-mail e a senha confirmada.
 */
export default function DadosConta({ usuario }: { usuario: AuthUser }) {
  const { login, atualizarUsuarioLocal } = useAuth();
  const { notificar } = useFeedback();
  const [nome, setNome] = useState(usuario.nomeUsuario);
  const [email, setEmail] = useState(usuario.emailUsuario);
  const [telefone, setTelefone] = useState(usuario.telefoneUsuario ?? "");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const alterado =
    nome.trim() !== usuario.nomeUsuario || email.trim().toLowerCase() !== usuario.emailUsuario.toLowerCase() ||
    somenteDigitos(telefone) !== somenteDigitos(usuario.telefoneUsuario ?? "");

  async function salvar() {
    const e: Record<string, string> = {};
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    if (nomeLimpo.length < 3) e.nome = "Informe seu nome (pelo menos 3 caracteres).";
    if (!emailValido(email)) e.email = "Informe um e-mail válido.";
    if (telefone.trim() && !telefoneValido(telefone)) e.telefone = "Informe um telefone válido (com DDD).";
    if (!senha) e.senha = "Digite sua senha atual para confirmar.";
    setErros(e);
    if (Object.keys(e).length > 0) return;

    setSalvando(true);
    setErro("");
    const novoEmail = email.trim().toLowerCase();
    try {
      await atualizarUsuario(usuario.idUsuario, {
        nomeUsuario: nomeLimpo,
        emailUsuario: novoEmail,
        senhaUsuario: senha,
        telefoneUsuario: somenteDigitos(telefone) || undefined,
      });
      if (novoEmail !== usuario.emailUsuario.toLowerCase()) {
        // O token antigo carrega o e-mail anterior e deixa de valer: entra de novo.
        await login({ emailUsuario: novoEmail, senhaUsuario: senha });
      } else {
        atualizarUsuarioLocal({ nomeUsuario: nomeLimpo, telefoneUsuario: somenteDigitos(telefone) || null });
      }
      setSenha("");
      notificar("Dados da conta atualizados.", "sucesso");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && /senha/i.test(error.payload?.message ?? "")) {
        setErros({ senha: "Senha atual incorreta." });
      } else if (error instanceof ApiError && error.status === 400 && /e-?mail/i.test(error.payload?.message ?? "")) {
        setErros({ email: "Este e-mail já está em uso por outra conta." });
      } else {
        setErro(mensagemErro(error, "Não foi possível salvar os dados da conta."));
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      {erro && <Alerta className="mb-4">{erro}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="conta-nome" rotulo="Nome" valor={nome} onChange={setNome} erro={erros.nome} maxLength={120} className="sm:col-span-2" autoComplete="name" />
        <Campo id="conta-email" rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} erro={erros.email} autoComplete="email" />
        <Campo id="conta-telefone" rotulo="Telefone (opcional)" tipo="tel" valor={telefone} onChange={setTelefone} erro={erros.telefone} maxLength={20} autoComplete="tel" />
      </div>
      {alterado && (
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-25 p-4">
          <Campo
            id="conta-senha"
            rotulo="Senha atual (para confirmar)"
            tipo="password"
            valor={senha}
            onChange={setSenha}
            erro={erros.senha}
            autoComplete="current-password"
            icone
          />
          <button type="button" onClick={salvar} disabled={salvando} className={`${cls.btnPrimario} mt-3 !text-[13px]`}>
            {salvando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
            Salvar dados da conta
          </button>
        </div>
      )}
    </div>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  onChange,
  erro,
  tipo = "text",
  maxLength,
  className = "",
  autoComplete,
  icone = false,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  erro?: string;
  tipo?: string;
  maxLength?: number;
  className?: string;
  autoComplete?: string;
  icone?: boolean;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={`${cls.label} flex items-center gap-1.5`}>
        {icone && <Lock size={13} aria-hidden="true" />}
        {rotulo}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!erro}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={cls.input}
      />
      {erro && (
        <p id={`${id}-erro`} className="mt-1 text-[13px] text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
