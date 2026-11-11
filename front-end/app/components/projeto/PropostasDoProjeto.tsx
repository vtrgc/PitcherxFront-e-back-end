"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, HandCoins, Loader2, X } from "lucide-react";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { ChipStatusNegociacao } from "./ChipsNegociacao";
import { mensagemErro } from "../../lib/api";
import { formatarMoeda } from "../../lib/validacao";
import { aceitarProposta, listarPropostasDoProjeto, recusarProposta } from "../../services/proposta.service";
import { Proposta } from "../../types/Proposta";

/**
 * Propostas recebidas pelo projeto (GET /proposta/projeto/{id}). O criador aceita (o autor vira
 * SÓCIO e o valor entra no arrecadado) ou recusa; contrapropostas ficam na página da proposta.
 */
export default function PropostasDoProjeto({
  projetoId,
  ehCriador,
  onMudanca,
}: {
  projetoId: number;
  ehCriador: boolean;
  /** Após aceitar: equipe e valores do projeto mudam no backend. */
  onMudanca?: () => void;
}) {
  const { notificar, confirmar } = useFeedback();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      setPropostas([...((await listarPropostasDoProjeto(projetoId)) ?? [])].sort((a, b) => b.idProposta - a.idProposta));
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar as propostas deste projeto."));
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function decidir(p: Proposta, aceitar: boolean) {
    const ok = await confirmar(
      aceitar
        ? `Aceitar a proposta #${p.idProposta} (${formatarMoeda(p.valorProposta)})? O autor passa a ser sócio do projeto e o valor é somado ao arrecadado.`
        : `Recusar a proposta #${p.idProposta}?`,
      { titulo: aceitar ? "Aceitar proposta" : "Recusar proposta", confirmarLabel: aceitar ? "Aceitar" : "Recusar", perigo: !aceitar }
    );
    if (!ok) return;
    setProcessando(p.idProposta);
    try {
      const atualizada = aceitar ? await aceitarProposta(p.idProposta) : await recusarProposta(p.idProposta);
      setPropostas((l) => l.map((x) => (x.idProposta === p.idProposta ? { ...x, ...atualizada } : x)));
      notificar(aceitar ? "Proposta aceita." : "Proposta recusada.", "sucesso");
      if (aceitar) onMudanca?.();
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível registrar a decisão."));
    } finally {
      setProcessando(null);
    }
  }

  return (
    <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-propostas-projeto">
      <h2 id="titulo-propostas-projeto" className={cls.eyebrow}>
        <HandCoins size={14} aria-hidden="true" /> Propostas recebidas
      </h2>
      {loading ? (
        <div className={`${cls.skeleton} mt-4 h-16 w-full rounded-xl`} aria-label="Carregando propostas" />
      ) : erro ? (
        <Alerta className="mt-4" onTentarNovamente={carregar}>
          {erro}
        </Alerta>
      ) : propostas.length === 0 ? (
        <p className="mt-5 text-[0.8125rem] text-ink-500">Nenhuma proposta recebida ainda.</p>
      ) : (
        <ul className="mt-3">
          {propostas.map((p) => {
            const pendente = (p.statusProposta ?? "PENDENTE") === "PENDENTE";
            return (
              <li key={p.idProposta} className={`${cls.linha} flex flex-wrap items-start justify-between gap-3`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cls.chip}>#{p.idProposta}</span>
                    <span className="text-[14px] font-bold text-ink-900">{formatarMoeda(p.valorProposta)}</span>
                    <ChipStatusNegociacao status={p.statusProposta} />
                  </div>
                  <p className={`${cls.texto} mt-2 line-clamp-3 break-words !text-[14px]`}>{p.descricaoProposta}</p>
                  <Link href={`/propostas/${p.idProposta}`} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
                    {ehCriador ? "Negociar / contrapropor" : "Ver proposta"} <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </div>
                {ehCriador && pendente && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => decidir(p, true)} disabled={processando !== null} className={`${cls.btnPrimario} !text-[13px]`}>
                      {processando === p.idProposta ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                      Aceitar
                    </button>
                    <button type="button" onClick={() => decidir(p, false)} disabled={processando !== null} className={`${cls.btnPerigo} !text-[13px]`}>
                      <X size={15} aria-hidden="true" /> Recusar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
