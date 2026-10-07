"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, NetworkError } from "../../lib/api";
import { caminhoInternoSeguro } from "../../lib/image";
import AuthShell from "../../components/auth/AuthShell";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";
import AuthAlert from "../../components/auth/AuthAlert";

export default function Login() {
  return (
    <Suspense fallback={<AuthShell>{null}</AuthShell>}>
      <LoginConteudo />
    </Suspense>
  );
}

function LoginConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, usuario: usuarioLogado, isAuthenticated, isAdmin, isLoading } = useAuth();

  const destino = caminhoInternoSeguro(searchParams.get("redirect"));
  const sessaoExpirada = searchParams.get("expirada") === "1";
  const acabouDeCadastrar = searchParams.get("cadastro") === "1";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Quem já está logado não precisa ver a tela de login.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !loading) {
      if (usuarioLogado && !usuarioLogado.isActive) router.replace("/auth/verificar-conta");
      else router.replace(isAdmin ? "/admin" : destino || "/feed");
    }
  }, [isLoading, isAuthenticated, isAdmin, destino, router, loading, usuarioLogado]);

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setErro("");
    setLoading(true);

    try {
      const usuario = await login({ emailUsuario: email.trim(), senhaUsuario: senha });

      if (!usuario.isActive) {
        // Conta ainda não verificada (o cadastro cria a conta inativa até o código do
        // e-mail ser confirmado) ou desativada pelo administrador. A verificação exige o
        // token, então a sessão continua aberta e a tela de verificação trata os dois casos.
        const query = destino ? `?redirect=${encodeURIComponent(destino)}` : "";
        router.replace(`/auth/verificar-conta${query}`);
        return;
      }

      const admin = usuario.roles?.includes("ADMIN");
      router.replace(admin ? "/admin" : destino || "/feed");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404 || error.status === 401)) {
        // O backend diferencia "e-mail inexistente" (404) de "senha errada" (400);
        // mostramos a mesma mensagem para não revelar quais e-mails têm conta.
        setErro("E-mail ou senha inválidos.");
      } else if (error instanceof ApiError || error instanceof NetworkError) {
        setErro(error.message);
      } else {
        setErro("Não foi possível conectar ao servidor.");
      }
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="ax-form">
        <h1 className="ax-title">Bem-vindo de volta!</h1>
        <p className="ax-lead">Entre na sua conta e continue acompanhando suas ideias e conexões.</p>

        {/* noValidate: validação própria, com mensagens em português */}
        <form
          noValidate
          className="ax-fields"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleEntrar();
          }}
        >
          {sessaoExpirada && !erro && (
            <AuthAlert variant="success">Sua sessão expirou. Entre novamente para continuar.</AuthAlert>
          )}
          {acabouDeCadastrar && !erro && (
            <AuthAlert variant="success">
              Conta criada! Entre com seu e-mail e senha e digite o código de verificação que enviamos por e-mail.
            </AuthAlert>
          )}
          {erro && <AuthAlert>{erro}</AuthAlert>}

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
            aria-invalid={!!erro && !email.trim()}
          />

          <AuthField
            label="Senha"
            type="password"
            name="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            icon={<Lock size={18} />}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={!!erro && !senha}
          />

          <div className="ax-row-end">
            <Link href="/auth/esqueci-senha" className="ax-link ax-link--sm">
              Esqueceu sua senha?
            </Link>
          </div>

          <AuthButton loading={loading} loadingLabel="Entrando...">
            Entrar
          </AuthButton>
        </form>

        <p className="ax-switch">
          Ainda não tem uma conta?{" "}
          <Link href="/auth/cadastro" className="ax-link">
            Criar conta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
