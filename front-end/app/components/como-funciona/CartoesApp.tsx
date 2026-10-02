import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  Heart,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { CRIADORA, EQUIPE_FINAL, INTERESSADO, PROJETO, PUBLICACAO } from "../home/demo/dados";

/**
 * Cartões do hero: recortes das telas reais do PitcherX (perfil, projeto, publicação, equipe e
 * Explorar), com os mesmos dados fictícios da experiência animada. São decorativos: a figura
 * inteira tem uma descrição em texto (figcaption). Ao passar o mouse, a tela cresce e mostra um
 * detalhe a mais (bloco `.extra`).
 */

function Extra({ children }: { children: ReactNode }) {
  return (
    <div className="extra">
      <div>{children}</div>
    </div>
  );
}
function Avatar({ nome, tom = "roxo" }: { nome: string; tom?: "roxo" | "areia" }) {
  const iniciais = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return <span className={`cf-ui-avatar cf-ui-avatar--${tom}`}>{iniciais}</span>;
}

export default function CartoesApp({ nota }: { nota: string }) {
  return (
    <figure className="cf-cartoes">
      <div className="cf-cartoes-fila" aria-hidden="true">
        {/* 1 · perfil */}
        <div className="slot">
          <div className="cf-ui cf-ui--l2">
            <div className="cf-ui-capa" />
            <div className="cf-ui-corpo">
              <Avatar nome={CRIADORA.nome} />
              <p className="cf-ui-nome">{CRIADORA.nome}</p>
              <p className="cf-ui-sub">{CRIADORA.especialidade}</p>
              <p className="cf-ui-meta">
                <MapPin size={10} /> São Paulo, Brasil
              </p>
              <Extra>
                <p className="cf-ui-sub">Conecta escolas, bairro e quem quer apoiar projetos de impacto local.</p>
              </Extra>
              <div className="cf-ui-contagem">
                <span>
                  <b>{CRIADORA.publicacoes}</b> publicação
                </span>
                <span>
                  <b>{CRIADORA.projetos}</b> projeto
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2 · projeto */}
        <div className="slot">
          <div className="cf-ui cf-ui--l1">
            <div className="cf-ui-faixa" />
            <div className="cf-ui-corpo">
              <div className="cf-ui-linha">
                <span className="cf-ui-chip">{PROJETO.tipo}</span>
                <span className="cf-ui-chip cf-ui-chip--ok">Ativo</span>
              </div>
              <p className="cf-ui-titulo">{PROJETO.nome}</p>
              <p className="cf-ui-texto cf-ui-texto--2">{PROJETO.descricao}</p>
              <p className="cf-ui-meta">
                <CalendarDays size={10} /> {PROJETO.inicio} – {PROJETO.fim}
              </p>
            </div>
          </div>
        </div>

        {/* 3 · publicação (centro) */}
        <div className="slot">
          <div className="cf-ui cf-ui--centro">
            <div className="cf-ui-corpo">
              <div className="cf-ui-autor">
                <Avatar nome={CRIADORA.nome} />
                <div>
                  <p className="cf-ui-nome">
                    {CRIADORA.nome} <span className="cf-ui-handle">@{CRIADORA.handle}</span>
                  </p>
                  <p className="cf-ui-sub">{PUBLICACAO.data}</p>
                </div>
              </div>
              <p className="cf-ui-titulo">{PUBLICACAO.titulo}</p>
              <p className="cf-ui-texto cf-ui-texto--3">{PUBLICACAO.texto}</p>
              <div className="cf-ui-acoes-post">
                <Heart size={13} />
                <MessageCircle size={13} />
                <Share2 size={13} />
              </div>
            </div>
          </div>
        </div>

        {/* 4 · equipe */}
        <div className="slot">
          <div className="cf-ui cf-ui--r1">
            <div className="cf-ui-corpo">
              <p className="cf-ui-rotulo">
                <Users size={10} /> Equipe do projeto
              </p>
              {[
                { nome: CRIADORA.nome, papel: "Criador", tom: "roxo" as const },
                { nome: INTERESSADO.nome, papel: "Investidor", tom: "areia" as const },
              ].map((m) => (
                <div key={m.nome} className="cf-ui-membro">
                  <Avatar nome={m.nome} tom={m.tom} />
                  <p className="cf-ui-nome">{m.nome}</p>
                  <span className="cf-ui-chip">{m.papel}</span>
                </div>
              ))}
              <Extra>
                <p className="cf-ui-meta">
                  {INTERESSADO.nome.split(" ")[0]} entrou na equipe em {EQUIPE_FINAL[1].desde}
                </p>
              </Extra>
            </div>
          </div>
        </div>

        {/* 5 · explorar */}
        <div className="slot">
          <div className="cf-ui cf-ui--r2">
            <div className="cf-ui-corpo">
              <div className="cf-ui-abas">
                <span>
                  <Users size={10} /> Pessoas
                </span>
                <span className="cf-ui-aba-ativa">
                  <Briefcase size={10} /> Projetos
                </span>
              </div>
              <div className="cf-ui-campo">
                <Search size={10} /> Buscar projetos
              </div>
              <div className="cf-ui-campo cf-ui-campo--select">
                {PROJETO.tipo} <ChevronDown size={10} />
              </div>
              <p className="cf-ui-resultado">{PROJETO.nome}</p>
              <Extra>
                <p className="cf-ui-sub">
                  Criado por {CRIADORA.nome} · {PROJETO.tipo}
                </p>
              </Extra>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="cf-cartoes-nota">
        <span className="cf-sr">
          Telas do PitcherX: perfil de uma criadora, página de um projeto, uma publicação no feed, a equipe do projeto
          com os papéis Criador e Investidor, e a busca de projetos no Explorar.{" "}
        </span>
        {nota}
      </figcaption>
    </figure>
  );
}
