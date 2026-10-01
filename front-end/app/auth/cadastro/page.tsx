"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Phone, User } from "lucide-react";
import { cadastrarUsuario } from "../../services/usuario.service";
import { useAuth } from "../../context/AuthContext";
import { ApiError, NetworkError } from "../../lib/api";
import { validarCadastro, ErrosCadastro, somenteDigitos } from "../../lib/validacao";
import AuthShell from "../../components/auth/AuthShell";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";
import AuthAlert from "../../components/auth/AuthAlert";

export default function Cadastro() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin, isLoading } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [erros, setErros] = useState<ErrosCadastro>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated && !loading) {
      router.replace(isAdmin ? "/admin" : "/feed");
    }
  }, [isLoading, isAuthenticated, isAdmin, router, loading]);

  async function handleCriarConta() {
    const validacao = validarCadastro({ nome, email, senha, confirmarSenha, telefone });
    setErros(validacao);
    if (Object.keys(validacao).length > 0) {
      setErro("Revise os campos destacados.");
      return;
    }

    setErro("");
    setLoading(true);

    try {
      await cadastrarUsuario({
        nomeUsuario: nome.trim(),
        emailUsuario: email.trim().toLowerCase(),
        senhaUsuario: senha,
        // A coluna telefone_usuario é VARCHAR(13): enviamos só os dígitos, pois
        // "(11) 99999-9999" (15 caracteres) estouraria o limite e o cadastro falharia (500).
        telefoneUsuario: somenteDigitos(telefone) || undefined,
      });
    } catch (error) {
      setErro(
        error instanceof ApiError || error instanceof NetworkError ? error.message : "Não foi possível criar a conta."
      );
      setLoading(false);
      return;
    }

    try {
      await login({ emailUsuario: email.trim().toLowerCase(), senhaUsuario: senha });
      // Próximo passo do fluxo: completar o perfil (LinkedIn, CPF/CNPJ, especialidade).
      router.replace("/auth/completar-cadastro");
    } catch {
      // A conta foi criada; só o login automático falhou.
      router.replace("/auth/login");
    }
  }

  return (
    <AuthShell>
      <div className="ax-form">
        <h1 className="ax-title">Crie sua conta</h1>
        <p className="ax-lead">Faça parte de uma comunidade onde ideias e pessoas se conectam.</p>

        <form
          noValidate
          className="ax-fields"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleCriarConta();
          }}
        >
          {erro && <AuthAlert>{erro}</AuthAlert>}

          <AuthField
            label="Nome"
            type="text"
            name="nome"
            placeholder="Seu nome"
            autoComplete="name"
            icon={<User size={18} />}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            erro={erros.nome}
            maxLength={120}
          />

          <AuthField
            label="E-mail"
            type="email"
            name="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erros.email}
          />

          <AuthField
            label="Telefone (opcional)"
            type="tel"
            name="telefone"
            placeholder="(11) 99999-9999"
            autoComplete="tel"
            inputMode="tel"
            icon={<Phone size={18} />}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            erro={erros.telefone}
            maxLength={20}
          />

          <AuthField
            label="Senha"
            type="password"
            name="password"
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
            icon={<Lock size={18} />}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={erros.senha}
          />

          <AuthField
            label="Confirmar senha"
            type="password"
            name="confirm-password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            icon={<Lock size={18} />}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            erro={erros.confirmarSenha}
          />

          <AuthButton loading={loading} loadingLabel="Criando conta...">
            Criar conta
          </AuthButton>
        </form>

        <p className="ax-switch">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="ax-link">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
