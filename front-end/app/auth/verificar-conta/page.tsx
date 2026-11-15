"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LogOut, MailCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { caminhoInternoSeguro } from "../../lib/image";
import { reenviarCodigoVerificacao, verificarConta } from "../../services/usuario.service";
import AuthShell from "../../components/auth/AuthShell";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";
import AuthAlert from "../../components/auth/AuthAlert";

/**
 * Verificação da conta (POST /usuario/verificar-conta).
 *
 * No cadastro o backend cria a conta inativa e envia por e-mail um código de 6 dígitos.
 * A conta é ativada pela administração (análise de identidade); a confirmação do código exige
 * o token, então é pedida no primeiro acesso: o login devolve `verificado: false` e as páginas
 * protegidas trazem a pessoa para cá até ela digitar o código (ou pedir um novo).
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
  const [reenviando, setReenviando] = useState(false);
  const [aviso, setAviso] = useState("");

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
    // Conta ativa e já verificada, sem pedido explícito (vindo de Configurações): nada a fazer.
    if (usuario?.isActive && usuario?.verificado !== false && !destino) router.replace(proximaTela(isAdmin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, usuario?.isActive, usuario?.verificado, isAdmin, enviando, verificada]);

  async function pedirNovoCodigo() {
    setErro("");
    setAviso("");
    setReenviando(true);
    try {
      await reenviarCodigoVerificacao();
      setCodigo("");
      setAviso(`Enviamos um novo código para ${usuario?.emailUsuario || "o seu e-mail"}. O código anterior deixou de valer.`);
    } catch (error) {
      const mensagem = error instanceof ApiError ? error.payload?.message ?? "" : "";
      if (/j[aá] foi verificada/i.test(mensagem)) {
        atualizarUsuarioLocal({ verificado: true });
        setVerificada(true);
        router.replace(proximaTela(isAdmin));
        return;
      }
      setErro(mensagemErro(error, "Não foi possível enviar um novo código. Tente novamente."));
    } finally {
      setReenviando(false);
    }
  }

  async function enviar() {
    const limpo = codigo.replace(/\D/g, "");
    if (limpo.length !== TAMANHO_CODIGO) {
      setErro(`Digite os ${TAMANHO_CODIGO} dígitos do código enviado para o seu e-mail.`);
      return;
    }
    setErro("");
    setAviso("");
    setContaDesativada(false);
    setEnviando(true);
    try {
      const resposta = await verificarConta(limpo);
      setVerificada(true);
      atualizarUsuarioLocal({ isActive: resposta?.active ?? true, verificado: true });
      const admin = !!(resposta?.roles ?? usuario?.roles ?? []).includes("ADMIN");
      router.replace(proximaTela(admin));
    } catch (error) {
      const mensagem = error instanceof ApiError ? error.payload?.message ?? "" : "";
      if (/j[aá] foi verificada/i.test(mensagem) && usuario?.isActive) {
        // Já confirmado (por exemplo, em outro aparelho): libera e segue em frente.
        atualizarUsuarioLocal({ verificado: true });
        setVerificada(true);
        router.replace(proximaTela(isAdmin));
        return;
      } else if (/j[aá] foi verificada/i.test(mensagem)) {
        // A conta já tinha sido verificada e continua inativa: foi desativada pelo administrador.
        setContaDesativada(true);
        setErro("Esta conta já foi verificada, mas está desativada. Fale com um administrador da plataforma.");
      } else if (/inv[aá]lido/i.test(mensagem)) {
        setErro("Código inválido. Confira os 6 dígitos do e-mail mais recente ou peça um novo código.");
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
          Para concluir o seu cadastro, digite o código de {TAMANHO_CODIGO} dígitos que enviamos para{" "}
          <strong className="text-ink-900">{usuario?.emailUsuario || "o seu e-mail"}</strong>.
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
          {aviso && !erro && <AuthAlert variant="success">{aviso}</AuthAlert>}

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
          Não encontrou o e-mail? Confira a caixa de spam e as promoções, ou{" "}
          <button
            type="button"
            className="ax-link ax-link--sm inline-flex items-center gap-1"
            onClick={pedirNovoCodigo}
            disabled={reenviando || contaDesativada}
          >
            {reenviando ? "enviando…" : "peça um novo código"}
          </button>
          .
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
