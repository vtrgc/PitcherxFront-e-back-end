"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";

import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { mensagemErro } from "../../lib/api";
import { aceitarTermosVinculo, listarTermosVinculoDoProjeto } from "../../services/termoVinculo.service";
import { TermoVinculo } from "../../types/TermoVinculo";

/**
 * Regra do backend: só vê os detalhes de um projeto quem tem vínculo com ele. Quem chega pela
 * primeira vez aceita os termos de vínculo definidos pelo criador (POST
 * /termo-vinculo/projeto/{id}/aceitar) e passa a ser VISUALIZADOR. Os termos obrigatórios
 * precisam estar marcados; os opcionais ficam a critério da pessoa.
 */
export default function PortaoTermosVinculo({ projetoId, onAceito }: { projetoId: number; onAceito: () => void | Promise<void> }) {
  const [termos, setTermos] = useState<TermoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento("");
    try {
      const lista = (await listarTermosVinculoDoProjeto(projetoId)) ?? [];
      setTermos([...lista].sort((a, b) => Number(!!b.obrigatorio) - Number(!!a.obrigatorio) || a.idTermoVinculo - b.idTermoVinculo));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os termos de vínculo deste projeto."));
    } finally {
      setCarregando(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const obrigatoriosPendentes = termos.filter((t) => t.obrigatorio && !marcados.has(t.idTermoVinculo));

  function alternar(id: number) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function aceitar() {
    if (obrigatoriosPendentes.length > 0) {
      setErro("Marque todos os termos obrigatórios para continuar.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      await aceitarTermosVinculo(projetoId, [...marcados]);
      await onAceito();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível registrar o aceite dos termos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className={`${cls.card} mt-8 max-w-3xl p-5 sm:p-6`} aria-labelledby="titulo-portao-termos">
      <p className={cls.eyebrow}>
        <Lock size={14} aria-hidden="true" /> Acesso ao projeto
      </p>
      <h2 id="titulo-portao-termos" className={`${cls.h2} mt-2`}>
        Aceite os termos de vínculo para ver o projeto
      </h2>
      <p className={`${cls.texto} mt-1.5`}>
        Os detalhes, a equipe, os dados financeiros e a galeria ficam disponíveis para quem aceita as condições definidas pelo criador.
        Depois do aceite você passa a acompanhar o projeto como visualizador e pode pedir para participar como sócio ou investidor.
      </p>

      {carregando ? (
        <div className="mt-5 space-y-3" aria-label="Carregando termos">
          <div className={`${cls.skeleton} h-5 w-2/3 rounded-lg`} />
          <div className={`${cls.skeleton} h-4 w-full rounded-lg`} />
        </div>
      ) : erroCarregamento ? (
        <Alerta className="mt-5" onTentarNovamente={carregar}>
          {erroCarregamento}
        </Alerta>
      ) : (
        <form
          noValidate
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!enviando) aceitar();
          }}
        >
          {termos.length === 0 ? (
            <p className="rounded-xl bg-ink-25 px-4 py-3 text-[13.5px] text-ink-600">
              O criador não definiu termos específicos para este projeto. Confirme abaixo para liberar o acesso.
            </p>
          ) : (
            <fieldset>
              <legend className="sr-only">Termos de vínculo</legend>
              <ul className="space-y-2.5">
                {termos.map((termo) => {
                  const marcado = marcados.has(termo.idTermoVinculo);
                  return (
                    <li key={termo.idTermoVinculo}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                          marcado ? "border-brand-300 bg-brand-50/50" : "border-ink-100 hover:border-ink-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={marcado}
                          disabled={enviando}
                          onChange={() => alternar(termo.idTermoVinculo)}
                        />
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 ${
                            marcado ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 bg-white"
                          }`}
                        >
                          {marcado && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-semibold text-ink-900 break-words">{termo.tituloTermoVinculo}</span>
                            <span className={termo.obrigatorio ? cls.chip : cls.chipInativo}>{termo.obrigatorio ? "Obrigatório" : "Opcional"}</span>
                          </span>
                          <span className="mt-1 block whitespace-pre-line break-words text-[13px] leading-relaxed text-ink-600">
                            {termo.descricaoTermoVinculo}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {erro && <Alerta className="mt-4">{erro}</Alerta>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={enviando || obrigatoriosPendentes.length > 0} className={cls.btnPrimario}>
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} aria-hidden="true" />}
              {termos.length === 0 ? "Confirmar e acessar" : "Aceitar e acessar o projeto"}
            </button>
            {obrigatoriosPendentes.length > 0 && (
              <span className="text-[12.5px] text-ink-500">
                Falta{obrigatoriosPendentes.length === 1 ? "" : "m"} {obrigatoriosPendentes.length} termo
                {obrigatoriosPendentes.length === 1 ? "" : "s"} obrigatório{obrigatoriosPendentes.length === 1 ? "" : "s"}.
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
