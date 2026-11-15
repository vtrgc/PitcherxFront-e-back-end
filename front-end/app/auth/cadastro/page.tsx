"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Lock, Mail, MailCheck, Phone, ShieldCheck, User } from "lucide-react";
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
  const { login, usuario: usuarioLogado, isAuthenticated, isAdmin, isLoading } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [erros, setErros] = useState<ErrosCadastro>({});
  // Conta criada, mas ainda inativa (aguardando a aprovação da identidade pela administração).
  const [contaCriada, setContaCriada] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !loading) {
      if (usuarioLogado && !usuarioLogado.isActive) router.replace("/auth/verificar-conta");
      else router.replace(isAdmin ? "/admin" : "/feed");
    }
  }, [isLoading, isAuthenticated, isAdmin, router, loading, usuarioLogado]);

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
      if (error instanceof ApiError && error.status === 400 && /j[aá] existe.*e-?mail/i.test(error.payload?.message ?? "")) {
        setErros({ email: "Este e-mail já está cadastrado." });
        setErro("Já existe uma conta com este e-mail. Entre com ela ou recupere a senha.");
      } else if (error instanceof ApiError && Object.keys(error.errosDeCampo).length > 0) {
        const campos = error.errosDeCampo;
        setErros({ nome: campos.nomeUsuario, email: campos.emailUsuario, senha: campos.senhaUsuario, telefone: campos.telefoneUsuario });
        setErro("Revise os campos destacados.");
      } else {
        setErro(
          error instanceof ApiError || error instanceof NetworkError ? error.message : "Não foi possível criar a conta."
        );
      }
      setLoading(false);
      return;
    }

    try {
      const novo = await login({ emailUsuario: email.trim().toLowerCase(), senhaUsuario: senha });
      // O backend cria a conta inativa (o login só funciona após a aprovação da identidade);
      // se ela já estiver ativa: verificação do código e depois completar o perfil.
      router.replace(novo.isActive ? "/auth/completar-cadastro" : "/auth/verificar-conta?novo=1");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && /ativad/i.test(error.payload?.message ?? "")) {
        // Fluxo normal do backend: a conta nasce inativa até a administração aprovar a identidade.
        setContaCriada(email.trim().toLowerCase());
        setLoading(false);
        return;
      }
      // A conta foi criada; só o login automático falhou.
      router.replace("/auth/login?cadastro=1");
    }
  }

  if (contaCriada) {
    return (
      <AuthShell>
        <div className="ax-form">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true">
            <MailCheck size={24} />
          </span>
          <h1 className="ax-title">Conta criada!</h1>
          <p className="ax-lead">
            Recebemos o seu cadastro com o e-mail <strong className="text-ink-900">{contaCriada}</strong>.
          </p>
          <ol className="mt-5 space-y-3 text-[14px] text-ink-700">
            <li className="flex gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                <strong>Aguarde a aprovação.</strong> Para manter a plataforma segura, a administração confere cada nova conta. Você
                receberá um e-mail quando ela for liberada.
              </span>
            </li>
            <li className="flex gap-3">
              <MailCheck size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                <strong>Guarde o código de verificação</strong> que enviamos por e-mail: ele será pedido no primeiro acesso.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                Depois de entrar, envie o comprovante de identidade em <strong>Configurações</strong> e complete o seu perfil.
              </span>
            </li>
          </ol>
          <Link href="/auth/login?cadastro=1" className="ax-btn mt-7 inline-flex w-full items-center justify-center">
            Ir para o login
          </Link>
        </div>
      </AuthShell>
    );
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
            placeholder="Mínimo de 6 caracteres, com letras e números"
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
