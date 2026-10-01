"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LinkAnimada from "./LinkAnimada";

const NAV = [
  { href: "#como-funciona", rotulo: "Como funciona" },
  { href: "#ferramentas", rotulo: "Ferramentas" },
  { href: "#para-quem", rotulo: "Para quem é" },
  { href: "#perguntas", rotulo: "Perguntas" },
];

/** Cabeçalho sobre o céu do hero. Só rotas reais, conforme a sessão. */
export default function Cabecalho() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const logado = !isLoading && isAuthenticated;

  return (
    <header className="cf-cabecalho">
      <a href="#conteudo" className="cf-pular">
        Pular para o conteúdo
      </a>
      <Link href="/como-funciona" className="cf-marca" aria-label="PitcherX, como funciona">
        <Image src="/home/logo-mark.png" alt="" width={475} height={584} sizes="24px" className="cf-marca-simbolo" priority />
        <span>PitcherX</span>
      </Link>
      <nav aria-label="Seções" className="cf-nav">
        {NAV.map((n) => (
          <a key={n.href} href={n.href}>
            {n.rotulo}
          </a>
        ))}
      </nav>
      <div className="cf-cabecalho-acoes">
        <LinkAnimada className="cf-botao cf-botao--vidro cf-botao--pequeno cf-so-icone-no-celular">
          <Play size={12} aria-hidden="true" fill="currentColor" />
          <span className="cf-rotulo-icone">Versão animada</span>
        </LinkAnimada>
        <span className={isLoading ? "cf-carregando" : undefined}>
          {logado ? (
            <Link href={isAdmin ? "/admin" : "/feed"} className="cf-botao cf-botao--claro cf-botao--pequeno">
              {isAdmin ? "Painel" : "Plataforma"}
            </Link>
          ) : (
            <Link href="/auth/login" prefetch={false} className="cf-botao cf-botao--claro cf-botao--pequeno">
              Entrar
            </Link>
          )}
        </span>
      </div>
    </header>
  );
}
