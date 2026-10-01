import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  FileSignature,
  FileText,
  FolderKanban,
  IdCard,
  Info,
  Newspaper,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Cabecalho from "./Cabecalho";
import CartoesApp from "./CartoesApp";
import AcoesSessao from "./AcoesSessao";
import LinkAnimada from "./LinkAnimada";
import Imagem from "./Imagem";
import { IMAGENS } from "./imagens";
import { CHAMADO, FAIXA, FERRAMENTAS, HERO, PAPEIS, PASSOS, PERGUNTAS } from "./textos";
import { COMENTARIO, INTERESSADO } from "../home/demo/dados";

function Rotulo({ children, id }: { children: string; id?: string }) {
  return (
    <p className="cf-rotulo" id={id}>
      <span aria-hidden="true" className="cf-rotulo-ponto" />
      {children}
    </p>
  );
}

// ------------------------------------------------------------------ hero
export function Hero() {
  return (
    <section className="cf-hero" aria-labelledby="cf-titulo">
      <Imagem imagem={IMAGENS.telhado} sizes="100vw" prioridade decorativa className="cf-hero-foto" />
      <div className="cf-hero-veu" aria-hidden="true" />
      <Cabecalho />
      <div className="cf-hero-conteudo" id="conteudo">
        <h1 id="cf-titulo" className="cf-hero-titulo">
          {HERO.titulo[0]} <span className="cf-quebra">{HERO.titulo[1]}</span>
        </h1>
        <p className="cf-hero-apoio">{HERO.apoio}</p>
        <AcoesSessao secundario="animada" tema="escuro" />
      </div>
      <CartoesApp nota={HERO.nota} />
    </section>
  );
}

// ------------------------------------------------------------------ faixa de recursos
const ICONES_FAIXA: LucideIcon[] = [Newspaper, Compass, FolderKanban, Users, FileText, FileSignature, IdCard];

export function Faixa() {
  return (
    <section className="cf-faixa" aria-labelledby="cf-faixa-titulo">
      <h2 id="cf-faixa-titulo" className="cf-sr">
        {FAIXA.titulo}
      </h2>
      <ul>
        {FAIXA.itens.map((item, i) => {
          const Icone = ICONES_FAIXA[i];
          return (
            <li key={item}>
              <Icone size={17} strokeWidth={1.8} aria-hidden="true" />
              {item}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ como funciona (grade)
export function Passos() {
  const { projeto, publicacao, descoberta, equipe } = PASSOS.itens;
  return (
    <section id="como-funciona" className="cf-secao" aria-labelledby="cf-passos-titulo">
      <div className="cf-cabeca cf-cabeca--centro">
        <Rotulo>{PASSOS.rotulo}</Rotulo>
        <h2 id="cf-passos-titulo" className="cf-h2">
          {PASSOS.titulo.forte} <span className="cf-h2-suave">{PASSOS.titulo.suave}</span>
        </h2>
      </div>

      <ol className="cf-grade">
        <li className="cf-bloco cf-bloco--foto">
          <Imagem imagem={IMAGENS.caderno} sizes="(min-width: 1024px) 30vw, 100vw" className="cf-bloco-foto" />
          <div className="cf-bloco-caixa">
            <p className="cf-etiqueta">{projeto.etiqueta}</p>
            <h3 className="cf-h3">{projeto.titulo}</h3>
            <p className="cf-texto">{projeto.texto}</p>
          </div>
        </li>

        <li className="cf-bloco cf-bloco--cinza">
          <p className="cf-etiqueta">{publicacao.etiqueta}</p>
          <h3 className="cf-numero">
            {publicacao.numero}
            <span className="cf-sr"> caracteres</span>
          </h3>
          <p className="cf-texto">{publicacao.texto}</p>
          {/* recorte da interface: um comentário, como aparece no feed */}
          <div className="cf-mini-comentario" aria-hidden="true">
            <span className="cf-ui-avatar cf-ui-avatar--areia">RM</span>
            <div>
              <p className="cf-mini-nome">{INTERESSADO.nome}</p>
              <p className="cf-mini-texto">{COMENTARIO}</p>
              <p className="cf-mini-acoes">Curtir · Responder</p>
            </div>
          </div>
        </li>

        <li className="cf-bloco cf-bloco--lilas">
          <p className="cf-etiqueta">{descoberta.etiqueta}</p>
          <h3 className="cf-h3 cf-h3--grande">{descoberta.titulo}</h3>
          <p className="cf-texto">{descoberta.texto}</p>
        </li>

        <li className="cf-bloco cf-bloco--escuro">
          <p className="cf-etiqueta">{equipe.etiqueta}</p>
          <div className="cf-bloco-linha">
            <h3 className="cf-numero cf-numero--medio">{equipe.numero}</h3>
            <ul className="cf-papeis-lista" aria-label="Papéis na equipe">
              {["Criador", "Sócio", "Investidor", "Visualizador"].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <p className="cf-texto">{equipe.texto}</p>
        </li>
      </ol>
    </section>
  );
}

// ------------------------------------------------------------------ ferramentas
const ICONES_FERRAMENTAS: Record<string, LucideIcon> = { propostas: FileText, contratos: FileSignature, perfil: IdCard };

export function Ferramentas() {
  return (
    <section id="ferramentas" className="cf-secao" aria-labelledby="cf-ferramentas-titulo">
      <div className="cf-cabeca cf-cabeca--centro">
        <Rotulo>{FERRAMENTAS.rotulo}</Rotulo>
        <h2 id="cf-ferramentas-titulo" className="cf-h2">
          {FERRAMENTAS.titulo[0]} <span className="cf-quebra">{FERRAMENTAS.titulo[1]}</span>
        </h2>
        <p className="cf-apoio">{FERRAMENTAS.apoio}</p>
      </div>
      <div className="cf-painel">
        <ul className="cf-ferramentas">
          {FERRAMENTAS.itens.map((f) => {
            const Icone = ICONES_FERRAMENTAS[f.id];
            return (
              <li key={f.id} className="cf-ferramenta">
                <span className="cf-ferramenta-icone" aria-hidden="true">
                  <Icone size={16} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="cf-h4">{f.titulo}</h3>
                  <p className="cf-texto">{f.texto}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <Imagem imagem={IMAGENS.conversa} sizes="(min-width: 1024px) 28vw, 100vw" className="cf-ferramentas-foto" />
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ para quem é
export function Papeis() {
  return (
    <section id="para-quem" className="cf-secao" aria-labelledby="cf-papeis-titulo">
      <div className="cf-cabeca">
        <Rotulo>{PAPEIS.rotulo}</Rotulo>
        <h2 id="cf-papeis-titulo" className="cf-h2 cf-h2--esquerda">
          {PAPEIS.titulo}
        </h2>
      </div>
      <ol className="cf-colunas">
        {PAPEIS.itens.map((p, i) => (
          <li key={p.titulo} className="cf-coluna">
            <span className="cf-coluna-num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="cf-h4">{p.titulo}</h3>
            <p className="cf-texto">{p.texto}</p>
            <p className="cf-coluna-papel">
              Papel na equipe: <b>{p.papel}</b>
            </p>
          </li>
        ))}
      </ol>
      <p className="cf-nota">
        <Info size={16} aria-hidden="true" />
        {PAPEIS.nota}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ perguntas
export function Perguntas() {
  return (
    <section id="perguntas" className="cf-secao cf-perguntas" aria-labelledby="cf-perguntas-titulo">
      <div className="cf-cabeca">
        <Rotulo>{PERGUNTAS.rotulo}</Rotulo>
        <h2 id="cf-perguntas-titulo" className="cf-h2 cf-h2--esquerda">
          {PERGUNTAS.titulo}
        </h2>
      </div>
      <div className="cf-lista-perguntas">
        {PERGUNTAS.itens.map((q, i) => (
          <details key={q.p} className="cf-pergunta" open={i === 0}>
            <summary>
              {q.p}
              <Plus size={18} aria-hidden="true" className="cf-pergunta-icone" />
            </summary>
            <p className="cf-texto">
              {q.r}
              {i === PERGUNTAS.itens.length - 1 && (
                <>
                  {" "}
                  <LinkAnimada className="cf-link">Ver a experiência animada</LinkAnimada>
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ chamado final + rodapé
export function Chamado() {
  return (
    <section className="cf-chamado" aria-labelledby="cf-chamado-titulo">
      <div className="cf-chamado-esboco" aria-hidden="true" />
      <div className="cf-chamado-conteudo">
        <h2 id="cf-chamado-titulo" className="cf-h2 cf-h2--claro">
          {CHAMADO.titulo[0]} <span className="cf-quebra cf-h2-suave">{CHAMADO.titulo[1]}</span>
        </h2>
        <p className="cf-apoio cf-apoio--claro">{CHAMADO.apoio}</p>
        <AcoesSessao secundario="entrar" tema="escuro" />
      </div>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="cf-rodape">
      <div className="cf-rodape-marca">
        <Image src="/home/logo-mark.png" alt="" width={475} height={584} sizes="22px" className="cf-marca-simbolo" />
        <span>PitcherX</span>
      </div>
      <nav aria-label="Rodapé" className="cf-rodape-links">
        <Link href="/auth/login" prefetch={false}>
          Entrar
        </Link>
        <Link href="/auth/cadastro" prefetch={false}>
          Criar conta
        </Link>
        <LinkAnimada>Experiência animada</LinkAnimada>
      </nav>
      <p className="cf-rodape-copy">© 2026 PitcherX</p>
    </footer>
  );
}
