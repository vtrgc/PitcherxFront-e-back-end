"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LogOut, MailCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { caminhoInternoSeguro } from "../../lib/image";
import { verificarConta } from "../../services/usuario.service";
import AuthShell from "../../components/auth/AuthShell";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";
import AuthAlert from "../../components/auth/AuthAlert";

/**
 * Verificação da conta (POST /usuario/verificar-conta).
 *
 * No cadastro o backend cria a conta inativa e envia por e-mail um código de 6 dígitos.
 * O login continua funcionando para contas não verificadas (ele devolve `isActive: false`),
 * e a rota de verificação exige o token — por isso esta tela só é usada com a sessão aberta.
 *
 * Query string:
 *  - `novo=1`: veio do cadastro; depois de verificar segue para "Completar cadastro".
 *  - `redirect`: caminho interno para onde voltar depois de verificar.
 */
export default function VerificarConta() {
  return (
    <Suspense fallback={<AuthShell>{null}</AuthShell>}>
      <VerificarContaConteudo />
    </Suspense>
  );
}

const TAMANHO_CODIGO = 6;

function VerificarContaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario, isAuthenticated, isLoading, isAdmin, logout, atualizarUsuarioLocal } = useAuth();

  const novoCadastro = searchParams.get("novo") === "1";
  const destino = caminhoInternoSeguro(searchParams.get("redirect"));

  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [contaDesativada, setContaDesativada] = useState(false);
  const [verificada, setVerificada] = useState(false);

  function proximaTela(admin: boolean) {
    if (admin) return "/admin";
    if (novoCadastro) return "/auth/completar-cadastro";
    return destino || "/feed";
  }

  useEffect(() => {
    if (isLoading || enviando || verificada) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=%2Fauth%2Fverificar-conta");
      return;
    }
    // Conta já ativa ou de administrador: nada a verificar.
    if (usuario?.isActive || isAdmin) router.replace(proximaTela(isAdmin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, usuario?.isActive, isAdmin, enviando, verificada]);

  async function enviar() {
    const limpo = codigo.replace(/\D/g, "");
    if (limpo.length !== TAMANHO_CODIGO) {
      setErro(`Digite os ${TAMANHO_CODIGO} dígitos do código enviado para o seu e-mail.`);
      return;
    }
    setErro("");
    setContaDesativada(false);
    setEnviando(true);
    try {
      const resposta = await verificarConta(limpo);
      setVerificada(true);
      atualizarUsuarioLocal({ isActive: resposta?.active ?? true });
      const admin = !!(resposta?.roles ?? usuario?.roles ?? []).includes("ADMIN");
      router.replace(proximaTela(admin));
    } catch (error) {
      const mensagem = error instanceof ApiError ? error.payload?.message ?? "" : "";
      if (/j[aá] foi verificada/i.test(mensagem)) {
        // A conta já tinha sido verificada e continua inativa: foi desativada pelo administrador.
        setContaDesativada(true);
        setErro("Esta conta já foi verificada, mas está desativada. Fale com um administrador da plataforma.");
      } else if (/inv[aá]lido/i.test(mensagem)) {
        setErro("Código inválido. Confira os 6 dígitos do e-mail mais recente e tente novamente.");
      } else {
        setErro(mensagemErro(error, "Não foi possível verificar a conta. Tente novamente."));
      }
      setEnviando(false);
    }
  }

  return (
    <AuthShell>
      <div className="ax-form">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true">
          <MailCheck size={24} />
        </span>
        <h1 className="ax-title">Verifique sua conta</h1>
        <p className="ax-lead">
          Enviamos um código de {TAMANHO_CODIGO} dígitos para{" "}
          <strong className="text-ink-900">{usuario?.emailUsuario || "o seu e-mail"}</strong>. Digite-o abaixo para ativar a conta.
        </p>

        <form
          noValidate
          className="ax-fields"
          onSubmit={(e) => {
            e.preventDefault();
            if (!enviando) enviar();
          }}
        >
          {erro && <AuthAlert>{erro}</AuthAlert>}

          <AuthField
            label="Código de verificação"
            type="text"
            name="codigo"
            placeholder="000000"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={TAMANHO_CODIGO}
            icon={<KeyRound size={18} />}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, TAMANHO_CODIGO))}
            disabled={contaDesativada}
            style={{ letterSpacing: "0.35em", fontVariantNumeric: "tabular-nums" }}
          />

          <AuthButton loading={enviando} loadingLabel="Verificando..." disabled={contaDesativada}>
            Verificar conta
          </AuthButton>
        </form>

        <p className="mt-5 text-[13px] leading-5 text-ink-500">
          Não encontrou o e-mail? Confira a caixa de spam e as promoções. O código é gerado uma única vez no cadastro; se ele não
          chegar, fale com um administrador da plataforma.
        </p>

        <p className="ax-switch">
          <button type="button" className="ax-link inline-flex items-center gap-1.5" onClick={() => logout()}>
            <LogOut size={14} aria-hidden="true" /> Sair e entrar com outra conta
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
