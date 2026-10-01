"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useContadoresConexao, useMinhasConexoes } from "../hook/useConexao";
import { listarPerfisUsuario } from "../services/perfilUsuario.service";
import { PerfilUsuario } from "../types/PerfilUsuario";
import BotaoConexao from "./conexao/BotaoConexao";
import Avatar from "./ui/Avatar";
import { useUsuario } from "../hook/useUsuario";

const CONSULTA_XL = "(min-width: 1280px)";

/** true quando a coluna lateral (visível a partir de xl) está na tela. */
function useColunaVisivel() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(CONSULTA_XL);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(CONSULTA_XL).matches,
    () => false
  );
}

/** Coluna lateral das páginas sociais: resumo do perfil, rede e sugestões (dados reais da API). */
export default function PerfilCard() {
  const visivel = useColunaVisivel();
  const { usuario } = useAuth();

  return (
    <section aria-label="Seu perfil">
      <div className="flex items-center gap-3">
        <Avatar url={usuario?.urlImagemUsuario} nome={usuario?.nomeUsuario} tamanho={52} />
        <div className="min-w-0">
          <h2 className="font-display truncate text-[14.5px] font-bold text-ink-900">{usuario?.nomeUsuario}</h2>
          <p className="text-[0.75rem] text-ink-400 truncate">{usuario?.emailUsuario}</p>
        </div>
      </div>

      <Link
        href={usuario ? `/perfil/${usuario.idUsuario}` : "/perfil"}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 hover:text-brand-700"
      >
        Ver meu perfil público →
      </Link>

      {visivel && usuario && <Rede idUsuario={usuario.idUsuario} />}
    </section>
  );
}

function Rede({ idUsuario }: { idUsuario: number }) {
  const contadores = useContadoresConexao(idUsuario);
  const conexoes = useMinhasConexoes();
  const [perfis, setPerfis] = useState<PerfilUsuario[] | null>(null);

  useEffect(() => {
    let ativo = true;
    listarPerfisUsuario()
      .then((lista) => ativo && setPerfis(lista ?? []))
      .catch(() => ativo && setPerfis([]));
    return () => {
      ativo = false;
    };
  }, []);

  // Sugestões: pessoas com perfil profissional que eu ainda não sigo nem solicitei.
  const sugestoes = useMemo(() => {
    if (!perfis || conexoes.carregando) return [];
    return perfis
      .filter((p) => {
        const id = p.usuario.idUsuario;
        const rel = conexoes.relacaoCom(id);
        return id !== idUsuario && !rel.euSigo && !rel.solicitacaoEnviada;
      })
      .sort((a, b) => b.idPerfilUsuario - a.idPerfilUsuario)
      .slice(0, 4);
  }, [perfis, conexoes, idUsuario]);

  const pendentes = conexoes.recebidas.length;

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/conexoes?aba=seguidores" className="rounded-xl border border-ink-100 px-3 py-2.5 hover:border-brand-200">
          <span className="block font-display text-[1.1rem] font-extrabold text-ink-900">{contadores.seguidores ?? "—"}</span>
          <span className="block text-[12px] text-ink-500">Seguidores</span>
        </Link>
        <Link href="/conexoes?aba=seguindo" className="rounded-xl border border-ink-100 px-3 py-2.5 hover:border-brand-200">
          <span className="block font-display text-[1.1rem] font-extrabold text-ink-900">{contadores.seguindo ?? "—"}</span>
          <span className="block text-[12px] text-ink-500">Seguindo</span>
        </Link>
      </div>

      {pendentes > 0 && (
        <Link
          href="/conexoes?aba=recebidas"
          className="mt-3 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-100"
        >
          <Inbox size={16} aria-hidden="true" />
          {pendentes} solicitaç{pendentes === 1 ? "ão" : "ões"} para responder
        </Link>
      )}

      <div className="mt-7 h-px bg-ink-100" />

      <p className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-500">Pessoas para seguir</p>
      {perfis === null || conexoes.carregando ? (
        <div className="mt-3 space-y-3" aria-label="Carregando sugestões">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-ink-50" />
          ))}
        </div>
      ) : sugestoes.length === 0 ? (
        <p className="mt-2 text-[13px] leading-6 text-ink-500">
          Nenhuma sugestão agora.{" "}
          <Link href="/explorar" className="font-semibold text-brand-700 hover:underline">
            Explore a comunidade
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {sugestoes.map((p) => (
            <Sugestao key={p.idPerfilUsuario} perfil={p} conexoes={conexoes} />
          ))}
        </ul>
      )}
    </>
  );
}

function Sugestao({ perfil, conexoes }: { perfil: PerfilUsuario; conexoes: ReturnType<typeof useMinhasConexoes> }) {
  const id = perfil.usuario.idUsuario;
  const { usuario } = useUsuario(id);
  const pessoa = { id, nome: perfil.usuario.nomeUsuario };
  return (
    <li className="flex items-center gap-2.5">
      <Link href={`/perfil/${id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar url={usuario?.urlImagemUsuario} nome={perfil.usuario.nomeUsuario} tamanho={36} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ink-900 hover:underline">{perfil.usuario.nomeUsuario}</span>
          {perfil.especialidade && <span className="block truncate text-[11.5px] text-ink-400">{perfil.especialidade.nomeEspecialidade}</span>}
        </span>
      </Link>
      <BotaoConexao
        compacto
        relacao={conexoes.relacaoCom(id)}
        ocupado={conexoes.ocupado(id)}
        mostrarResposta={false}
        onSeguir={() => conexoes.seguir(pessoa)}
        onDeixarDeSeguir={() => conexoes.deixarDeSeguir(pessoa)}
        onCancelar={() => conexoes.cancelarSolicitacao(pessoa)}
      />
    </li>
  );
}
