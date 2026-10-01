"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, ScrollText, Tag } from "lucide-react";

import PageShell, { CarregandoSessao } from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { mensagemErro } from "../lib/api";
import { listarTermosPostagem } from "../services/termoPostagem.service";
import { listarTermosVinculo } from "../services/termoVinculo.service";

type Aba = "postagem" | "vinculo";
interface Item {
  id: number;
  titulo: string;
  descricao: string;
}

/**
 * Termos da plataforma (somente leitura): regras de publicação (GET /termo-postagem) e
 * condições de vínculo a projetos (GET /termo-vinculo). A gestão fica na área administrativa.
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
      const [postagem, vinculo] = await Promise.all([listarTermosPostagem(), listarTermosVinculo()]);
      setItens({
        postagem: (postagem ?? []).map((t) => ({ id: t.idTermoPostagem, titulo: t.tituloTermoPostagem, descricao: t.descricaoTermoPostagem })),
        vinculo: (vinculo ?? []).map((t) => ({ id: t.idTermoVinculo, titulo: t.tituloTermoVinculo, descricao: t.descricaoTermoVinculo })),
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
                <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-600">{t.descricao}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
