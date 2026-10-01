"use client";

import { MouseEvent, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getToken, tokenExpirado, NetworkError } from "../../lib/api";
import { buscarUsuario } from "../../services/usuario.service";
import { TituloAnimado } from "./palco/TextoCena";
import { TEXTOS } from "./cenas/textos";
import { ROTA_SEM_ANIMACAO } from "./constantes";

/**
 * Cena 11 — chamado final. Seção comum (fora do palco fixo), fundo claro.
 * Somente rotas que existem:
 *  visitante → /auth/cadastro, /auth/login?redirect=/projetos, /auth/login?redirect=/feed
 *  usuário   → /projetos, /feed#criar-post
 *  admin     → /admin (admin não publica nem cria projetos)
 */
export default function CenaFinal() {
  const { usuario, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const verificando = useRef(false);

  /**
   * "Criar um projeto" e "Publicar no feed" só levam à área interna com uma sessão válida
   * no servidor. A sessão salva no navegador pode estar vencida ou pertencer a um usuário
   * que não existe mais no backend: nesse caso ela é descartada e o usuário vai primeiro
   * para o login, que o devolve ao destino escolhido depois de entrar.
   */
  async function abrirComSessao(e: MouseEvent<HTMLAnchorElement>, destino: string) {
    e.preventDefault();
    if (verificando.current) return;
    verificando.current = true;
    const irParaLogin = () => {
      logout({ redirecionar: false });
      router.push(`/auth/login?redirect=${encodeURIComponent(destino)}`);
    };
    try {
      if (!usuario || tokenExpirado(getToken())) {
        irParaLogin();
        return;
      }
      const dados = await buscarUsuario(usuario.idUsuario, { forcar: true });
      if (!dados || (dados.emailUsuario && dados.emailUsuario !== usuario.emailUsuario)) {
        irParaLogin();
        return;
      }
      router.push(destino);
    } catch (error) {
      // Sem resposta do servidor não há como confirmar: a própria página protegida decide.
      if (error instanceof NetworkError) router.push(destino);
      else irParaLogin();
    } finally {
      verificando.current = false;
    }
  }

  let acoes;
  if (isLoading || !isAuthenticated) {
    acoes = (
      <div className={isLoading ? "hx-carregando" : undefined}>
        <div className="hx-final-botoes">
          <Link href="/auth/cadastro" prefetch={false} className="hx-cta hx-cta--cheio">
            Criar minha conta
          </Link>
          <Link href="/auth/login?redirect=/projetos" prefetch={false} className="hx-cta hx-cta--linha">
            Já tenho conta
          </Link>
        </div>
        <p className="hx-final-link">
          <Link href="/auth/login?redirect=/feed" prefetch={false}>Ver o que estão lançando</Link>
          <span className="hx-final-nota"> — é preciso entrar na sua conta.</span>
        </p>
      </div>
    );
  } else if (isAdmin) {
    acoes = (
      <div className="hx-final-botoes">
        <Link href="/admin" className="hx-cta hx-cta--cheio">
          Ir para o painel
        </Link>
      </div>
    );
  } else {
    acoes = (
      <div className="hx-final-botoes">
        <Link href="/projetos" onClick={(e) => abrirComSessao(e, "/projetos")} className="hx-cta hx-cta--cheio">
          Criar um projeto
        </Link>
        <Link href="/feed#criar-post" onClick={(e) => abrirComSessao(e, "/feed#criar-post")} className="hx-cta hx-cta--linha">
          Publicar no feed
        </Link>
      </div>
    );
  }

  return (
    <section id="comecar" tabIndex={-1} aria-labelledby="hx-final-titulo" className="hx-final">
      <div className="hx-final-transicao" aria-hidden="true" />
      <div className="hx-final-conteudo">
        <Image src="/home/logo-mark.png" alt="" width={475} height={584} sizes="56px" className="hx-final-logo" />
        <div id="hx-final-titulo">
          <TituloAnimado texto={TEXTOS.final.titulo} className="hx-final-titulo" />
        </div>
        <p className="hx-final-apoio">{TEXTOS.final.apoio}</p>
        {acoes}
        <p className="hx-final-leitura">
          Prefere ler com calma? <Link href={ROTA_SEM_ANIMACAO} prefetch={false}>Veja como o PitcherX funciona</Link>
        </p>
      </div>
      <footer className="hx-rodape">
        <span>© 2026 PitcherX</span>
      </footer>
    </section>
  );
}
