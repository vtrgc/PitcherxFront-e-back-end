"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { mensagemErro } from "../../lib/api";
import { correspondeBusca } from "../../lib/listagem";
import { listarRiscosProjeto } from "../../services/riscoProjeto.service";
import { RiscoProjeto } from "../../types/RiscoProjeto";

/**
 * Seleção dos riscos do projeto a partir do catálogo GET /risco-projeto (mantido pela
 * administração). O ProjetoRequestDTO exige a lista (`riscoProjetoIds`), que pode ser vazia.
 */
export default function SeletorRiscos({
  selecionados,
  onChange,
  desabilitado = false,
}: {
  selecionados: number[];
  onChange: (ids: number[]) => void;
  desabilitado?: boolean;
}) {
  const [catalogo, setCatalogo] = useState<RiscoProjeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const lista = (await listarRiscosProjeto()) ?? [];
      setCatalogo([...lista].sort((a, b) => a.nomeRisco.localeCompare(b.nomeRisco, "pt-BR")));
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar a lista de riscos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const porId = useMemo(() => new Map(catalogo.map((r) => [r.idRiscoProjeto, r])), [catalogo]);
  const visiveis = useMemo(() => catalogo.filter((r) => correspondeBusca(busca, r.nomeRisco, r.descricaoRisco)), [catalogo, busca]);

  function alternar(id: number) {
    onChange(selecionados.includes(id) ? selecionados.filter((x) => x !== id) : [...selecionados, id]);
  }

  return (
    <div>
      <p className={`${cls.label} flex items-center gap-1.5`}>
        <AlertTriangle size={14} aria-hidden="true" /> Riscos do projeto
      </p>
      <p className="mb-2 text-[12.5px] text-ink-500">Marque os riscos que se aplicam. Eles aparecem na página do projeto para quem avalia a ideia.</p>

      {selecionados.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Riscos selecionados">
          {selecionados.map((id) => (
            <li key={id}>
              <button
                type="button"
                disabled={desabilitado}
                onClick={() => alternar(id)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                aria-label={`Remover risco ${porId.get(id)?.nomeRisco ?? id}`}
              >
                {porId.get(id)?.nomeRisco ?? `Risco #${id}`}
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {carregando ? (
        <p className="flex items-center gap-2 text-[13px] text-ink-500">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Carregando riscos...
        </p>
      ) : erro ? (
        <Alerta onTentarNovamente={carregar}>{erro}</Alerta>
      ) : catalogo.length === 0 ? (
        <p className="rounded-xl bg-ink-25 px-3 py-2.5 text-[13px] text-ink-500">Nenhum risco cadastrado pela administração ainda.</p>
      ) : (
        <>
          <label htmlFor="proj-busca-risco" className="sr-only">
            Buscar risco
          </label>
          <input
            id="proj-busca-risco"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar risco"
            className={`${cls.input} !py-2 !text-[13px]`}
          />
          <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-ink-100" role="group" aria-label="Catálogo de riscos">
            {visiveis.length === 0 ? (
              <p className="px-3 py-3 text-[13px] text-ink-500">Nenhum risco encontrado.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {visiveis.map((r) => {
                  const marcado = selecionados.includes(r.idRiscoProjeto);
                  return (
                    <li key={r.idRiscoProjeto}>
                      <label className={`flex cursor-pointer items-start gap-2.5 px-3 py-2.5 hover:bg-ink-25 ${desabilitado ? "cursor-not-allowed opacity-60" : ""}`}>
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={marcado}
                          disabled={desabilitado}
                          onChange={() => alternar(r.idRiscoProjeto)}
                        />
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 ${
                            marcado ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 bg-white"
                          }`}
                        >
                          {marcado && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-ink-800">{r.nomeRisco}</span>
                          {r.descricaoRisco && <span className="block text-[12.5px] leading-5 text-ink-500">{r.descricaoRisco}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
