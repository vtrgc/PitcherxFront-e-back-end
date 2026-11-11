"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Sparkles, Users } from "lucide-react";
import { cls } from "../ui/estilos";
import { useAuth } from "../../context/AuthContext";
import { formatarMoeda } from "../../lib/validacao";
import { listarRecomendacoes } from "../../services/recomendacao.service";
import { ProjetoRecomendado } from "../../types/Recomendacao";

/**
 * "Recomendados para você" — GET /recomendacoes/projetos/{userId} (até 10, por relevância
 * com a área de atuação do perfil). Some quando não há recomendações ou a chamada falha.
 */
export default function Recomendacoes({ className = "" }: { className?: string }) {
  const { usuario, isAdmin } = useAuth();
  const idUsuario = usuario?.idUsuario;
  const [itens, setItens] = useState<ProjetoRecomendado[] | null>(null);

  useEffect(() => {
    if (!idUsuario || isAdmin) return;
    let ativo = true;
    listarRecomendacoes(idUsuario)
      .then((l) => ativo && setItens(l))
      .catch(() => ativo && setItens([]));
    return () => {
      ativo = false;
    };
  }, [idUsuario, isAdmin]);

  if (isAdmin || (itens !== null && itens.length === 0)) return null;

  return (
    <section className={className} aria-labelledby="recomendacoes-titulo">
      <h2 id="recomendacoes-titulo" className={cls.eyebrow}>
        <Sparkles size={14} className="text-accent-500" aria-hidden="true" /> Projetos recomendados para você
      </h2>
      <div className="scrollbar-none -mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {itens === null
          ? [0, 1, 2].map((i) => <div key={i} className={`${cls.skeleton} h-32 w-64 shrink-0 rounded-2xl`} />)
          : itens.map((p) => (
              <Link
                key={p.idProjeto}
                href={`/projetos/${p.idProjeto}`}
                className={`${cls.card} flex w-64 shrink-0 snap-start flex-col p-4 hover:border-brand-200 hover:shadow-[0_6px_18px_-10px_rgba(107,33,224,0.35)]`}
              >
                <h3 className="line-clamp-1 font-display text-[14.5px] font-bold text-ink-900">{p.nomeProjeto}</h3>
                {p.nomeCriador && <p className="mt-0.5 truncate text-[12px] text-ink-500">por {p.nomeCriador}</p>}
                {p.descricaoProjeto && <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-ink-600">{p.descricaoProjeto}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[12px] text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={13} aria-hidden="true" /> {(p.visualizacoes ?? 0).toLocaleString("pt-BR")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} aria-hidden="true" /> {(p.seguidores ?? 0).toLocaleString("pt-BR")}
                  </span>
                  {typeof p.metaFinanceira === "number" && p.metaFinanceira > 0 && (
                    <span className="font-semibold text-ink-700">Meta {formatarMoeda(p.metaFinanceira)}</span>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
