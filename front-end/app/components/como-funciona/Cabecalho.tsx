"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import LinkAnimada from "./LinkAnimada";

const NAV = [
  { href: "#como-funciona", rotulo: "Como funciona" },
  { href: "#ferramentas", rotulo: "Ferramentas" },
  { href: "#para-quem", rotulo: "Para quem é" },
  { href: "#perguntas", rotulo: "Perguntas" },
];

/** Barra fina e translúcida, fixa no topo. Só rotas reais, conforme a sessão. */
export default function Cabecalho() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const logado = !isLoading && isAuthenticated;

  return (
    <header className="ap-nav">
      <a href="#conteudo" className="cf-pular">
        Pular para o conteúdo
      </a>
      <div className="ap-nav-in">
        <Link href="/como-funciona" className="ap-logo" aria-label="PitcherX, como funciona">
          <Image src="/home/logo-mark.png" alt="" width={475} height={584} sizes="18px" priority />
          <span>PitcherX</span>
        </Link>
        <nav aria-label="Seções">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.rotulo}
            </a>
          ))}
          <LinkAnimada>Versão animada</LinkAnimada>
        </nav>
        <span className={isLoading ? "cf-carregando" : undefined}>
          {logado ? (
            <Link href={isAdmin ? "/admin" : "/feed"} className="ap-entrar">
              {isAdmin ? "Painel" : "Plataforma"}
            </Link>
          ) : (
            <Link href="/auth/login" prefetch={false} className="ap-entrar">
              Entrar
            </Link>
          )}
        </span>
      </div>
    </header>
  );
}
