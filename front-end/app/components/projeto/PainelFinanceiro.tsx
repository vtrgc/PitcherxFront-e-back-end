"use client";

import { useState } from "react";
import { AlertTriangle, CircleDollarSign, Loader2, PieChart, RefreshCw, Save, Target, TrendingUp, Wallet, X } from "lucide-react";
import { FichaProjeto, VALOR_MAXIMO, resumoFinanceiro } from "../../lib/fichaProjeto";
import { formatarPercentual } from "../../lib/perfil";
import { parseValorMonetario } from "../../lib/validacao";
import { mensagemErro } from "../../lib/api";
import { RiscoProjeto } from "../../types/RiscoProjeto";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v % 1 === 0 ? 0 : 2 });
}

/**
 * Meta financeira, progresso da captação, riscos, participação oferecida e uso dos recursos.
 * Mostra SOMENTE o que o criador informou (ficha do projeto); o restante aparece como
 * "não informado" — nenhum valor é estimado.
 *
 * `onAtualizarValores` (criador): atualiza meta e valor arrecadado pelos PATCH próprios do
 * backend, sem reenviar o projeto inteiro.
 */
export default function PainelFinanceiro({
  ficha,
  riscos,
  podeEditar,
  onEditar,
  onAtualizarValores,
}: {
  ficha: FichaProjeto | null | undefined;
  riscos?: RiscoProjeto[] | null;
  podeEditar: boolean;
  onEditar?: () => void;
  onAtualizarValores?: (valores: { meta?: number; captado?: number }) => Promise<void>;
}) {
  const [atualizando, setAtualizando] = useState(false);
  const r = resumoFinanceiro(ficha);
  const temFinanceiro = r.meta !== null || r.captado !== null || !!ficha?.investimentoMinimo;
  const participacao = ficha?.participacao ?? null;

  return (
    <div className="space-y-6">
      <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-meta">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-meta" className={cls.eyebrow}>
            <Target size={14} aria-hidden="true" /> Meta financeira
          </h2>
          {podeEditar && onAtualizarValores && !atualizando && (
            <button type="button" onClick={() => setAtualizando(true)} className={`${cls.btnContorno} !py-1.5 !text-[12.5px]`}>
              <RefreshCw size={13} aria-hidden="true" /> Atualizar captação
            </button>
          )}
        </div>

        {atualizando && onAtualizarValores && (
          <FormValores meta={r.meta} captado={r.captado} onSalvar={onAtualizarValores} onFechar={() => setAtualizando(false)} />
        )}

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

        <div className="mt-5 border-t border-ink-100 pt-4">
          <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-amber-700">
            <AlertTriangle size={13} aria-hidden="true" /> Riscos do projeto
          </h3>
          {riscos && riscos.length > 0 ? (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {riscos.map((risco) => (
                <li key={risco.idRiscoProjeto} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-[13.5px] font-semibold text-ink-900">{risco.nomeRisco}</p>
                  {risco.descricaoRisco && <p className="mt-0.5 text-[12.5px] leading-5 text-ink-600">{risco.descricaoRisco}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[13px] text-ink-500">Nenhum risco informado pelo criador.</p>
          )}
        </div>

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

function paraTexto(v: number | null) {
  return v === null ? "" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false });
}

function lerValor(texto: string): number | null | "invalido" {
  let bruto = texto.replace(/R\$\s*/i, "").trim();
  if (!bruto) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(bruto)) bruto = bruto.replace(/\./g, "");
  const v = parseValorMonetario(bruto);
  if (v === null) return null;
  if (Number.isNaN(v) || v < 0 || v > VALOR_MAXIMO) return "invalido";
  return v;
}

function FormValores({
  meta,
  captado,
  onSalvar,
  onFechar,
}: {
  meta: number | null;
  captado: number | null;
  onSalvar: (valores: { meta?: number; captado?: number }) => Promise<void>;
  onFechar: () => void;
}) {
  const [textoMeta, setTextoMeta] = useState(paraTexto(meta));
  const [textoCaptado, setTextoCaptado] = useState(paraTexto(captado));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const novaMeta = lerValor(textoMeta);
    const novoCaptado = lerValor(textoCaptado);
    if (novaMeta === "invalido" || novoCaptado === "invalido") {
      setErro("Informe valores válidos (ex.: 150000 ou 150.000,00).");
      return;
    }
    if (novaMeta === null || novaMeta <= 0) {
      setErro("A meta financeira é obrigatória e deve ser maior que zero.");
      return;
    }
    const valores: { meta?: number; captado?: number } = {};
    if (novaMeta !== meta) valores.meta = novaMeta;
    if (novoCaptado !== null && novoCaptado !== captado) valores.captado = novoCaptado;
    if (valores.meta === undefined && valores.captado === undefined) {
      onFechar();
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onSalvar(valores);
      onFechar();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível atualizar os valores."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      noValidate
      className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!salvando) salvar();
      }}
    >
      {erro && <Alerta className="mb-3">{erro}</Alerta>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="patch-meta" className={cls.label}>
            Meta financeira (R$)
          </label>
          <input id="patch-meta" inputMode="decimal" value={textoMeta} maxLength={24} onChange={(e) => setTextoMeta(e.target.value)} className={cls.input} />
        </div>
        <div>
          <label htmlFor="patch-captado" className={cls.label}>
            Valor arrecadado (R$)
          </label>
          <input
            id="patch-captado"
            inputMode="decimal"
            value={textoCaptado}
            maxLength={24}
            onChange={(e) => setTextoCaptado(e.target.value)}
            className={cls.input}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={salvando} className={`${cls.btnPrimario} !text-[13px]`}>
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} aria-hidden="true" />}
          Salvar valores
        </button>
        <button type="button" onClick={onFechar} disabled={salvando} className={`${cls.btnSecundario} !text-[13px]`}>
          <X size={15} aria-hidden="true" /> Cancelar
        </button>
      </div>
    </form>
  );
}
