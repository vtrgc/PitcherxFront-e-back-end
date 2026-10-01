"use client";

import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LinkAnimada from "./LinkAnimada";

function Seta() {
  return (
    <span className="cf-botao-seta" aria-hidden="true">
      <ArrowUpRight size={15} strokeWidth={2.2} />
    </span>
  );
}

/**
 * Botões principais, conforme a sessão (só rotas reais):
 *  visitante → Criar conta (/auth/cadastro) · usuário → Ir para a plataforma (/feed) · admin → Ir para o painel (/admin)
 * `secundario`: "animada" (hero) ou "entrar" (chamado final).
 */
export default function AcoesSessao({ secundario, tema = "claro" }: { secundario: "animada" | "entrar"; tema?: "claro" | "escuro" }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const logado = !isLoading && isAuthenticated;

  const principal = logado ? (
    <Link href={isAdmin ? "/admin" : "/feed"} className="cf-botao cf-botao--principal">
      {isAdmin ? "Ir para o painel" : "Ir para a plataforma"}
      <Seta />
    </Link>
  ) : (
    <Link href="/auth/cadastro" prefetch={false} className="cf-botao cf-botao--principal">
      Criar conta
      <Seta />
    </Link>
  );

  let segundo = null;
  if (secundario === "animada") {
    segundo = (
      <LinkAnimada className={`cf-botao cf-botao--${tema === "escuro" ? "vidro" : "linha"}`}>
        <Play size={13} aria-hidden="true" fill="currentColor" />
        Ver a experiência animada
      </LinkAnimada>
    );
  } else if (!logado) {
    segundo = (
      <Link href="/auth/login" prefetch={false} className={`cf-botao cf-botao--${tema === "escuro" ? "vidro" : "linha"}`}>
        Já tenho conta
      </Link>
    );
  }

  return (
    <div className={`cf-acoes${isLoading ? " cf-carregando" : ""}`}>
      {principal}
      {segundo}
    </div>
  );
}
