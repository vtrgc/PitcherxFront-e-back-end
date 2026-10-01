"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause } from "lucide-react";
import type { MouseEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { CHAVE_ANIMAR, EVENTO_PULAR, ROTA_SEM_ANIMACAO } from "./constantes";


/**
 * Header mínimo da Home. Só rotas reais, conforme a sessão:
 *  visitante → Entrar / Criar conta · usuário → Ir para a plataforma (/feed) · admin → Ir para o painel (/admin).
 * Enquanto a sessão carrega, o espaço dos botões fica reservado (sem "piscar").
 */
export default function HomeHeader() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  /** Quem tem "movimento reduzido" e tinha escolhido a animação volta ao padrão (sem animação). */
  function esquecerEscolha() {
    try {
      window.localStorage.removeItem(CHAVE_ANIMAR);
    } catch {
      /* nada guardado */
    }
  }

  function pular(e: MouseEvent<HTMLAnchorElement>) {
    // Sem o motor (JS desligado / movimento reduzido) o link âncora nativo resolve sozinho.
    const tratado = !window.dispatchEvent(new CustomEvent(EVENTO_PULAR, { cancelable: true }));
    if (tratado) e.preventDefault();
  }

  return (
    <header data-hx="header" className="hx-header">
      <a href="#comecar" onClick={pular} className="hx-pular">
        Pular animação
      </a>

      <Link href="/" aria-label="PitcherX, página inicial" className="hx-header-logo">
        <Image src="/home/logo-mark.png" alt="" width={475} height={584} priority sizes="28px" className="hx-header-logo-img" />
        <span className="hx-marca">
          Pitcher<span className="hx-marca-x">X</span>
        </span>
      </Link>

      <nav aria-label="Acesso" className="hx-header-acoes">
        {/* Para quem prefere ler: a mesma história, sem animação. */}
        <Link
          href={ROTA_SEM_ANIMACAO}
          prefetch={false}
          className="hx-botao hx-botao--linha hx-desligar"
          onClick={esquecerEscolha}
        >
          <Pause size={15} aria-hidden="true" />
          <span className="hx-desligar-texto">Sem animação</span>
        </Link>
        {isLoading ? (
          // Reserva o espaço com os links de visitante invisíveis (sem JS, o <noscript> da página os mostra).
          <span className="hx-carregando">
            <Link href="/auth/login" prefetch={false} className="hx-botao hx-botao--linha">
              Entrar
            </Link>
            <Link href="/auth/cadastro" prefetch={false} className="hx-botao hx-botao--claro hx-so-largo">
              Criar conta
            </Link>
          </span>
        ) : isAuthenticated ? (
          <Link href={isAdmin ? "/admin" : "/feed"} className="hx-botao hx-botao--claro">
            {isAdmin ? "Ir para o painel" : "Ir para a plataforma"}
          </Link>
        ) : (
          <>
            <Link href="/auth/login" prefetch={false} className="hx-botao hx-botao--linha">
              Entrar
            </Link>
            <Link href="/auth/cadastro" prefetch={false} className="hx-botao hx-botao--claro hx-so-largo">
              Criar conta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
