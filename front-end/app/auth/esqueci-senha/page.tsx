"use client";

import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { ApiError, NetworkError } from "../../lib/api";
import { emailValido, SENHA_MINIMA } from "../../lib/validacao";
import { esqueciSenha, resetarSenha } from "../../services/usuario.service";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";
import AuthAlert from "../../components/auth/AuthAlert";
import "@fontsource-variable/archivo/wdth.css";
import "../../components/auth/auth.css";
import "./esqueci-senha.css";

/**
 * Fluxo de recuperação em 3 telas:
 *  1. E-mail        -> POST /usuario/esqueci-senha (o backend envia um código de 6 dígitos, válido por 15 min).
 *  2. Verificação   -> apenas coleta os 6 dígitos (veja a observação abaixo).
 *  3. Nova senha    -> POST /usuario/resetar-senha (confere o código e grava a nova senha).
 *
 * Observação: o endpoint /usuario/validar-token do backend responde 204 mesmo quando o
 * código é inválido (o resultado da validação é descartado no controller). Por isso a
 * conferência real do código é feita pelo /resetar-senha, que devolve 400 se o código
 * for inválido ou estiver expirado — nesse caso a tela volta para a etapa do código.
 */
type Etapa = "email" | "codigo" | "senha" | "sucesso";

const TAMANHO_CODIGO = 6;
const ESPERA_REENVIO = 60; // segundos
const ETAPAS: Etapa[] = ["email", "codigo", "senha"];
const ID_FORM = "rx-form";
const codigoVazio = () => Array<string>(TAMANHO_CODIGO).fill("");

export default function EsqueciSenha() {
  const router = useRouter();

  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [digitos, setDigitos] = useState<string[]>(codigoVazio);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [espera, setEspera] = useState(0);

  // Erro geral (servidor/conexão) e erros de campo
  const [erro, setErro] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroCodigo, setErroCodigo] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroConfirmacao, setErroConfirmacao] = useState("");
  const [aviso, setAviso] = useState("");

  const refsCodigo = useRef<(HTMLInputElement | null)[]>([]);
  const codigo = digitos.join("");
  const indiceEtapa = etapa === "sucesso" ? ETAPAS.length : ETAPAS.indexOf(etapa);

  // Senhas diferentes: avisa enquanto digita, assim que a confirmação tiver conteúdo.
  const erroConfirmar =
    confirmarSenha && novaSenha !== confirmarSenha ? "As senhas não coincidem." : erroConfirmacao;

  // Contagem regressiva do "Reenviar"
  useEffect(() => {
    if (espera <= 0) return;
    const t = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [espera]);

  // Foco no primeiro campo vazio ao entrar na etapa do código
  useEffect(() => {
    if (etapa !== "codigo") return;
    const primeiroVazio = digitos.findIndex((d) => !d);
    refsCodigo.current[primeiroVazio === -1 ? TAMANHO_CODIGO - 1 : primeiroVazio]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  function limparMensagens() {
    setErro("");
    setErroEmail("");
    setErroCodigo("");
    setErroSenha("");
    setErroConfirmacao("");
    setAviso("");
  }

  function irPara(proxima: Etapa) {
    limparMensagens();
    setEtapa(proxima);
  }

  function mensagemEnvio(error: unknown) {
    if (error instanceof ApiError && error.status >= 500) {
      // O backend responde 500 quando o e-mail não está cadastrado ou o envio falha.
      return "Não foi possível enviar o código. Confira o e-mail informado e tente novamente.";
    }
    if (error instanceof ApiError || error instanceof NetworkError) return error.message;
    return "Não foi possível conectar ao servidor.";
  }

  // ---------------------------------------------------------------- Etapa 1
  async function handleSolicitar() {
    limparMensagens();
    if (!email.trim()) {
      setErroEmail("Informe seu e-mail.");
      return;
    }
    if (!emailValido(email)) {
      setErroEmail("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      await esqueciSenha(email.trim());
      setEmail(email.trim());
      setDigitos(codigoVazio());
      setEspera(ESPERA_REENVIO);
      irPara("codigo");
    } catch (error) {
      setErro(mensagemEnvio(error));
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------- Etapa 2
  function preencherAPartirDe(indice: number, valor: string) {
    const numeros = valor.replace(/\D/g, "");
    const novo = [...digitos];

    if (!numeros) {
      novo[indice] = "";
      setDigitos(novo);
      return;
    }

    // Aceita digitar, colar ou autopreencher (one-time-code) vários dígitos de uma vez.
    let i = indice;
    for (const n of numeros) {
      if (i >= TAMANHO_CODIGO) break;
      novo[i++] = n;
    }
    setDigitos(novo);
    setErroCodigo("");
    refsCodigo.current[Math.min(i, TAMANHO_CODIGO - 1)]?.focus();
  }

  function handleTeclaCodigo(indice: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[indice] && indice > 0) {
      e.preventDefault();
      const novo = [...digitos];
      novo[indice - 1] = "";
      setDigitos(novo);
      refsCodigo.current[indice - 1]?.focus();
    } else if (e.key === "ArrowLeft" && indice > 0) {
      e.preventDefault();
      refsCodigo.current[indice - 1]?.focus();
    } else if (e.key === "ArrowRight" && indice < TAMANHO_CODIGO - 1) {
      e.preventDefault();
      refsCodigo.current[indice + 1]?.focus();
    }
  }

  function handleColarCodigo(indice: number, e: ClipboardEvent<HTMLInputElement>) {
    const colado = e.clipboardData.getData("text");
    if (!/\d/.test(colado)) return;
    e.preventDefault();
    preencherAPartirDe(/\d{6}/.test(colado.replace(/\D/g, "")) ? 0 : indice, colado);
  }

  function handleConfirmarCodigo() {
    if (!new RegExp(`^\\d{${TAMANHO_CODIGO}}$`).test(codigo)) {
      setAviso("");
      setErroCodigo(`Digite os ${TAMANHO_CODIGO} dígitos do código enviado para o seu e-mail.`);
      return;
    }
    irPara("senha");
  }

  async function handleReenviar() {
    if (espera > 0 || reenviando) return;
    limparMensagens();
    setReenviando(true);
    try {
      await esqueciSenha(email);
      setDigitos(codigoVazio());
      setEspera(ESPERA_REENVIO);
      setAviso("Enviamos um novo código. Use sempre o código mais recente.");
      refsCodigo.current[0]?.focus();
    } catch (error) {
      setErro(mensagemEnvio(error));
    } finally {
      setReenviando(false);
    }
  }

  // ---------------------------------------------------------------- Etapa 3
  async function handleRedefinir() {
    setErro("");
    if (!novaSenha || novaSenha.length < SENHA_MINIMA) {
      setErroSenha(`A nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (!confirmarSenha) {
      setErroConfirmacao("Confirme a nova senha.");
      return;
    }
    // Senhas diferentes: a mensagem já aparece no campo de confirmação (erroConfirmar).
    if (novaSenha !== confirmarSenha) return;
    setErroSenha("");
    setLoading(true);
    try {
      await resetarSenha(email, codigo, novaSenha);
      setNovaSenha("");
      setConfirmarSenha("");
      irPara("sucesso");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        // Código errado ou expirado: volta para a etapa do código mantendo a senha digitada.
        setDigitos(codigoVazio());
        limparMensagens();
        setEtapa("codigo");
        setErroCodigo("Código inválido ou expirado. Confira o código ou solicite um novo.");
      } else if (error instanceof ApiError || error instanceof NetworkError) {
        setErro(error.message);
      } else {
        setErro("Não foi possível conectar ao servidor.");
      }
    } finally {
      setLoading(false);
    }
  }

  function voltar() {
    if (etapa === "email") router.push("/auth/login");
    else if (etapa === "codigo") irPara("email");
    else if (etapa === "senha") irPara("codigo");
  }

  function enviar() {
    if (loading) return;
    if (etapa === "email") handleSolicitar();
    else if (etapa === "codigo") handleConfirmarCodigo();
    else if (etapa === "senha") handleRedefinir();
  }

  // ---------------------------------------------------------------- UI
  const cabecalho = {
    email: {
      ilustracao: <IlustracaoCadeado selo="interrogacao" />,
      titulo: "Esqueci minha senha",
      texto: "Digite o e-mail da sua conta PitcherX. Vamos enviar um código de verificação.",
    },
    codigo: {
      ilustracao: <IlustracaoEnvelope />,
      titulo: "Verificação",
      texto: (
        <>
          Digite o código de {TAMANHO_CODIGO} dígitos enviado para <strong className="rx-strong">{email}</strong>.
        </>
      ),
    },
    senha: {
      ilustracao: <IlustracaoCadeado selo="check" />,
      titulo: "Nova senha",
      texto: `Crie uma senha forte com pelo menos ${SENHA_MINIMA} caracteres.`,
    },
    sucesso: {
      ilustracao: <IlustracaoCadeado selo="check" sucesso />,
      titulo: "Senha redefinida!",
      texto: "Sua senha foi alterada com sucesso. Agora é só entrar com a nova senha.",
    },
  }[etapa];

  const textoBotao = {
    email: { normal: "Enviar código", carregando: "Enviando código..." },
    codigo: { normal: "Confirmar código", carregando: "Confirmando..." },
    senha: { normal: "Salvar nova senha", carregando: "Salvando..." },
    sucesso: { normal: "Ir para o login", carregando: "" },
  }[etapa];

  return (
    <main className="ax-root rx-root">
      <div className="rx-screen">
        <div className="rx-deco" aria-hidden="true">
          <span className="rx-deco-a" />
          <span className="rx-deco-b" />
        </div>

        <div className="rx-top">
          {etapa !== "sucesso" && (
            <button type="button" className="rx-back" onClick={voltar} aria-label="Voltar">
              <ArrowLeft size={22} aria-hidden="true" />
            </button>
          )}
        </div>

        <ol className="rx-steps" aria-label={etapa === "sucesso" ? "Concluído" : `Etapa ${indiceEtapa + 1} de ${ETAPAS.length}`}>
          {ETAPAS.map((e, i) => (
            <li
              key={e}
              className={`rx-step${i <= indiceEtapa ? " is-on" : ""}`}
              aria-current={i === indiceEtapa ? "step" : undefined}
            />
          ))}
        </ol>

        <div key={etapa} className="rx-body">
          <div className="rx-illus">{cabecalho.ilustracao}</div>

          <h1 className="rx-title">{cabecalho.titulo}</h1>
          <p className="rx-lead">{cabecalho.texto}</p>

          <form
            id={ID_FORM}
            noValidate
            className="rx-fields"
            onSubmit={(e) => {
              e.preventDefault();
              if (etapa === "sucesso") router.push("/auth/login");
              else enviar();
            }}
          >
            {erro && <AuthAlert>{erro}</AuthAlert>}

            {/* -------- Etapa 1: e-mail -------- */}
            {etapa === "email" && (
              <AuthField
                label="E-mail"
                type="email"
                name="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                autoFocus
                icon={<Mail size={18} />}
                value={email}
                erro={erroEmail}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (erroEmail) setErroEmail("");
                  if (erro) setErro("");
                }}
              />
            )}

            {/* -------- Etapa 2: código -------- */}
            {etapa === "codigo" && (
              <fieldset className="rx-otp-group">
                <legend className="ax-label">Código de verificação</legend>
                <div className="rx-otp">
                  {digitos.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        refsCodigo.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={TAMANHO_CODIGO}
                      value={d}
                      aria-label={`Dígito ${i + 1} de ${TAMANHO_CODIGO}`}
                      aria-invalid={!!erroCodigo}
                      aria-describedby="rx-otp-msg"
                      className={`rx-otp-cell${d ? " is-filled" : ""}`}
                      onChange={(e) => preencherAPartirDe(i, e.target.value)}
                      onKeyDown={(e) => handleTeclaCodigo(i, e)}
                      onPaste={(e) => handleColarCodigo(i, e)}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>
                <p
                  id="rx-otp-msg"
                  className={`rx-hint${erroCodigo ? " is-error" : aviso ? " is-success" : ""}`}
                  role={erroCodigo ? "alert" : aviso ? "status" : undefined}
                >
                  {erroCodigo || aviso || "O código expira em 15 minutos."}
                </p>
              </fieldset>
            )}

            {/* -------- Etapa 3: nova senha -------- */}
            {etapa === "senha" && (
              <>
                {/* Campo oculto ajuda gerenciadores de senha a associar a nova senha à conta. */}
                <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />

                <AuthField
                  label="Nova senha"
                  type="password"
                  name="new-password"
                  placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
                  autoComplete="new-password"
                  autoFocus
                  value={novaSenha}
                  erro={erroSenha}
                  onChange={(e) => {
                    setNovaSenha(e.target.value);
                    if (erroSenha) setErroSenha("");
                    if (erro) setErro("");
                  }}
                />

                <AuthField
                  label="Confirme a senha"
                  type="password"
                  name="confirm-password"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  value={confirmarSenha}
                  erro={erroConfirmar}
                  onChange={(e) => {
                    setConfirmarSenha(e.target.value);
                    if (erroConfirmacao) setErroConfirmacao("");
                    if (erro) setErro("");
                  }}
                />
              </>
            )}
          </form>
        </div>

        <div className="rx-footer">
          <AuthButton form={ID_FORM} loading={loading} loadingLabel={textoBotao.carregando}>
            {textoBotao.normal}
          </AuthButton>

          {etapa === "email" && (
            <p className="rx-foot-text">
              Lembrou a senha?{" "}
              <Link href="/auth/login" className="rx-link">
                Voltar para o login
              </Link>
            </p>
          )}

          {etapa === "codigo" && (
            <p className="rx-foot-text">
              Não recebeu o código?{" "}
              {espera > 0 ? (
                <span className="rx-wait">
                  Reenviar em {Math.floor(espera / 60)}:{String(espera % 60).padStart(2, "0")}
                </span>
              ) : (
                <button type="button" className="rx-link rx-link-btn" onClick={handleReenviar} disabled={reenviando}>
                  {reenviando ? "Reenviando..." : "Reenviar"}
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ Ilustrações */

function IlustracaoCadeado({ selo, sucesso = false }: { selo: "interrogacao" | "check"; sucesso?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" width="88" height="88" aria-hidden="true">
      <path d="M32 42V32a16 16 0 0 1 32 0v10" fill="none" stroke="#6b21e0" strokeWidth="7" strokeLinecap="round" />
      <rect x="22" y="40" width="52" height="40" rx="10" fill={sucesso ? "#12b76a" : "#6b21e0"} />
      <circle cx="37" cy="60" r="3.6" fill="#fff" />
      <circle cx="48" cy="60" r="3.6" fill="#fff" />
      <circle cx="59" cy="60" r="3.6" fill="#fff" />
      <circle cx="72" cy="78" r="12" fill="#f5127d" stroke="#fff" strokeWidth="3.5" />
      {selo === "check" ? (
        <path d="m66.5 78 4 4 7.5-8" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path
            d="M68.3 74.6a3.9 3.9 0 1 1 5.6 3.5c-1.2.6-1.9 1.4-1.9 2.6v.5"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="72" cy="85" r="1.8" fill="#fff" />
        </>
      )}
    </svg>
  );
}

function IlustracaoEnvelope() {
  return (
    <svg viewBox="0 0 96 96" width="92" height="92" aria-hidden="true">
      <path d="M16 44 48 22l32 22v34a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4Z" fill="#5613be" />
      <rect x="27" y="18" width="42" height="46" rx="5" fill="#fff" stroke="#e4dcf7" strokeWidth="1.5" />
      <rect x="35" y="28" width="24" height="4" rx="2" fill="#f5127d" />
      <rect x="35" y="37" width="17" height="4" rx="2" fill="#c7b5f5" />
      <path d="M16 46v32a4 4 0 0 0 4 4h56a4 4 0 0 0 4-4V46L48 66Z" fill="#6b21e0" />
      <path d="m16 80 26-20M80 80 54 60" stroke="#5613be" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
