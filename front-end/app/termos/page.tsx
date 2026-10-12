"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Link2, ScrollText, Tag } from "lucide-react";

import PageShell, { CarregandoSessao } from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { mensagemErro } from "../lib/api";
import { listarTermosPostagem } from "../services/termoPostagem.service";
import { listarTermosVinculo } from "../services/termoVinculo.service";
import { listarProjetos } from "../services/projeto.service";

type Aba = "postagem" | "vinculo";
interface Item {
  id: number;
  titulo: string;
  descricao: string;
  projeto?: { id: number; nome: string } | null;
  obrigatorio?: boolean;
}

/**
 * Termos da plataforma (somente leitura): regras de publicação (GET /termo-postagem) e
 * condições de vínculo a projetos (GET /termo-vinculo). Os termos de vínculo pertencem a cada
 * projeto: o criador os define na página do projeto e quem quer acessá-lo precisa aceitá-los.
 */
export default function TermosPage() {
  return (
    <PageShell>
      <Suspense fallback={<CarregandoSessao />}>
        <Termos />
      </Suspense>
    </PageShell>
  );
}

function Termos() {
  const params = useSearchParams();
  const aba: Aba = params.get("aba") === "vinculo" ? "vinculo" : "postagem";
  const [itens, setItens] = useState<Record<Aba, Item[]>>({ postagem: [], vinculo: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<Aba>(aba);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [postagem, vinculo, projetos] = await Promise.all([
        listarTermosPostagem(),
        listarTermosVinculo(),
        listarProjetos().catch(() => []),
      ]);
      const nomes = new Map(projetos.map((p) => [p.idProjeto, p.nomeProjeto]));
      setItens({
        postagem: (postagem ?? []).map((t) => ({ id: t.idTermoPostagem, titulo: t.tituloTermoPostagem, descricao: t.descricaoTermoPostagem })),
        vinculo: (vinculo ?? [])
          .map((t) => ({
            id: t.idTermoVinculo,
            titulo: t.tituloTermoVinculo,
            descricao: t.descricaoTermoVinculo,
            obrigatorio: !!t.obrigatorio,
            projeto: t.projetoId ? { id: t.projetoId, nome: nomes.get(t.projetoId) ?? `Projeto #${t.projetoId}` } : null,
          }))
          .sort((a, b) => (a.projeto?.nome ?? "").localeCompare(b.projeto?.nome ?? "", "pt-BR") || a.id - b.id),
      });
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar os termos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = itens[abaAtiva];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <p className={cls.eyebrow}>
          <ScrollText size={14} aria-hidden="true" /> Regras da comunidade
        </p>
        <h1 className={cls.h1}>Termos do PitcherX</h1>
      </div>

      <div role="tablist" aria-label="Tipo de termo" className="flex gap-2">
        {(
          [
            { id: "postagem", rotulo: "Publicações", icone: Tag },
            { id: "vinculo", rotulo: "Vínculos em projetos", icone: Link2 },
          ] as const
        ).map(({ id, rotulo, icone: Icone }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={abaAtiva === id}
            onClick={() => setAbaAtiva(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              abaAtiva === id ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
            }`}
          >
            <Icone size={13} aria-hidden="true" /> {rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "vinculo" && (
        <Alerta variante="info">
          Cada projeto define os próprios termos de vínculo. Para acessar um projeto, abra a página dele e aceite os termos obrigatórios.
        </Alerta>
      )}

      {erro && <Alerta onTentarNovamente={carregar}>{erro}</Alerta>}

      <div role="tabpanel" className={`${cls.card} overflow-hidden`}>
        {carregando ? (
          <div className="space-y-3 p-6" aria-label="Carregando termos">
            <div className={`${cls.skeleton} h-5 w-2/3 rounded-lg`} />
            <div className={`${cls.skeleton} h-4 w-full rounded-lg`} />
          </div>
        ) : erro ? null : lista.length === 0 ? (
          <EmptyState icon={ScrollText} title="Nenhum termo publicado ainda" description="Quando a equipe do PitcherX publicar termos, eles aparecem aqui." />
        ) : (
          <ol className="divide-y divide-ink-100">
            {lista.map((t, i) => (
              <li key={t.id} className="px-5 py-5 sm:px-6">
                <h2 className="font-display text-[15.5px] font-bold text-ink-900 break-words">
                  {i + 1}. {t.titulo}
                </h2>
                {t.projeto !== undefined && (
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-500">
                    {t.projeto ? (
                      <Link href={`/projetos/${t.projeto.id}`} className="font-semibold text-brand-700 hover:underline">
                        {t.projeto.nome}
                      </Link>
                    ) : (
                      "Termo geral"
                    )}
                    <span className={t.obrigatorio ? cls.chip : cls.chipInativo}>{t.obrigatorio ? "Obrigatório" : "Opcional"}</span>
                  </p>
                )}
                <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-600">{t.descricao}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
