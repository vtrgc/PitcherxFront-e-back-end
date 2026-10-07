"use client";

import { AlertTriangle, CircleDollarSign, PieChart, Target, TrendingUp, Wallet } from "lucide-react";
import { FichaProjeto, resumoFinanceiro } from "../../lib/fichaProjeto";
import { formatarPercentual } from "../../lib/perfil";
import { cls } from "../ui/estilos";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v % 1 === 0 ? 0 : 2 });
}

/**
 * Meta financeira, progresso da captação, participação oferecida e uso dos recursos.
 * Mostra SOMENTE o que o criador informou (ficha do projeto); o restante aparece como
 * "não informado" — nenhum valor é estimado.
 */
export default function PainelFinanceiro({
  ficha,
  podeEditar,
  onEditar,
}: {
  ficha: FichaProjeto | null | undefined;
  podeEditar: boolean;
  onEditar?: () => void;
}) {
  const r = resumoFinanceiro(ficha);
  const temFinanceiro = r.meta !== null || r.captado !== null || !!ficha?.investimentoMinimo;
  const participacao = ficha?.participacao ?? null;

  return (
    <div className="space-y-6">
      <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-meta">
        <h2 id="titulo-meta" className={cls.eyebrow}>
          <Target size={14} aria-hidden="true" /> Meta financeira
        </h2>

        {temFinanceiro ? (
          <>
            <dl className="mt-4 grid grid-cols-1 gap-3 min-[460px]:grid-cols-3">
              <Valor icone={Target} rotulo="Meta" valor={r.meta !== null ? moeda(r.meta) : "Não informada"} destaque />
              <Valor icone={Wallet} rotulo="Arrecadado" valor={r.captado !== null ? moeda(r.captado) : "Não informado"} />
              <Valor icone={TrendingUp} rotulo="Restante" valor={r.restante !== null ? moeda(r.restante) : "—"} />
            </dl>

            {r.percentual !== null ? (
              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-ink-700">Progresso da captação</span>
                  <span className="font-display text-[1.35rem] font-extrabold text-brand-700">{formatarPercentual(r.percentual, 1)}</span>
                </div>
                <div
                  className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-100"
                  role="progressbar"
                  aria-label="Progresso da captação"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.round(r.percentual * 10) / 10)}
                  aria-valuetext={`${formatarPercentual(r.percentual, 1)} da meta`}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${r.metaAtingida ? "bg-emerald-500" : "bg-brand-gradient"}`}
                    style={{ width: `${Math.min(100, r.percentual)}%` }}
                  />
                </div>
                <p className="mt-2 text-[12.5px] text-ink-500">
                  {r.metaAtingida
                    ? "Meta atingida."
                    : `${moeda(r.captado ?? 0)} de ${moeda(r.meta ?? 0)} — faltam ${moeda(r.restante ?? 0)}.`}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[12.5px] text-ink-500">
                {r.meta !== null ? "O valor arrecadado não foi informado, por isso o progresso não é exibido." : "Sem meta informada, não há progresso para calcular."}
              </p>
            )}

            {ficha?.investimentoMinimo !== undefined && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-ink-25 px-3 py-2.5 text-[13px] text-ink-700">
                <CircleDollarSign size={15} className="text-brand-600" aria-hidden="true" />
                Investimento mínimo por aporte: <strong className="font-semibold">{moeda(ficha.investimentoMinimo)}</strong>
              </p>
            )}
          </>
        ) : (
          <SemDados texto="O criador ainda não informou a meta financeira deste projeto." podeEditar={podeEditar} onEditar={onEditar} />
        )}

        {ficha?.risco && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-amber-700">Risco do projeto</h3>
              <p className="mt-0.5 whitespace-pre-line break-words text-[14px] leading-6 text-ink-800">{ficha.risco}</p>
            </div>
          </div>
        )}

        {ficha?.usoRecursos && (
          <div className="mt-5 border-t border-ink-100 pt-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">Uso dos recursos</h3>
            <p className="mt-1 whitespace-pre-line break-words text-[14px] leading-6 text-ink-700">{ficha.usoRecursos}</p>
          </div>
        )}
      </section>

      <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-participacao">
        <h2 id="titulo-participacao" className={cls.eyebrow}>
          <PieChart size={14} aria-hidden="true" /> Aquisição / participação
        </h2>
        {participacao !== null ? (
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <Rosca percentual={participacao} />
            <div className="min-w-0">
              <p className="text-[13px] text-ink-500">Participação disponível</p>
              <p className="font-display text-[1.75rem] font-extrabold leading-tight text-ink-900">{formatarPercentual(participacao)}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-ink-500">
                do projeto oferecido{r.meta !== null ? ` em troca da meta de ${moeda(r.meta)}` : " a investidores"}.
              </p>
            </div>
          </div>
        ) : (
          <SemDados texto="A participação oferecida não foi informada." podeEditar={podeEditar} onEditar={onEditar} />
        )}
      </section>
    </div>
  );
}

function Valor({ icone: Icone, rotulo, valor, destaque = false }: { icone: typeof Target; rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-ink-100 px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-400">
        <Icone size={12} aria-hidden="true" /> {rotulo}
      </dt>
      <dd className={`mt-1 break-words font-display font-extrabold leading-tight ${destaque ? "text-[1.15rem] text-ink-900" : "text-[1.05rem] text-ink-800"}`}>
        {valor}
      </dd>
    </div>
  );
}

function Rosca({ percentual }: { percentual: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percentual));
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-ink-100" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(p / 100) * c} ${c}`}
        className="text-accent-500"
      />
    </svg>
  );
}

function SemDados({ texto, podeEditar, onEditar }: { texto: string; podeEditar: boolean; onEditar?: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-ink-200 px-4 py-5 text-center">
      <p className="text-[13px] text-ink-500">{texto}</p>
      {podeEditar && onEditar && (
        <button type="button" onClick={onEditar} className="mt-2 text-[13px] font-semibold text-brand-700 hover:underline">
          Adicionar dados financeiros
        </button>
      )}
    </div>
  );
}
