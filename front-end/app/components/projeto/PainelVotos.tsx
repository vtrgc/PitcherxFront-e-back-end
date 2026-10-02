"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Heart, Loader2, Users, Vote } from "lucide-react";
import { mensagemErro } from "../../lib/api";
import { formatarPercentual } from "../../lib/perfil";
import { Empresa, VotosEmpresas, votosDeEmpresas } from "../../services/empresa.service";
import Alerta from "../ui/Alerta";
import Avatar from "../ui/Avatar";
import { cls } from "../ui/estilos";

/**
 * Votos do projeto. O PitcherX não tem votação própria no backend: o voto é a CURTIDA do
 * projeto (tipo de conteúdo PROJETO). Os números vêm de:
 *  - total: GET /curtida/status (mesma contagem do botão Votar);
 *  - empresas: GET /curtida/status/{empresa}/4/{projeto} para cada empresa cadastrada.
 */
export default function PainelVotos({
  projetoId,
  totalVotos,
  carregandoTotal,
  empresas,
  carregandoEmpresas,
  erroEmpresas,
  versao,
  onTentarNovamente,
}: {
  projetoId: number;
  totalVotos: number;
  carregandoTotal: boolean;
  empresas: Empresa[];
  carregandoEmpresas: boolean;
  erroEmpresas: string;
  /** Muda quando o voto do usuário muda: recarrega os votos das empresas. */
  versao: string;
  onTentarNovamente: () => void;
}) {
  const [votos, setVotos] = useState<VotosEmpresas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (empresas.length === 0) {
      setVotos({ aFavor: [], consultadas: 0, falhas: 0 });
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      setVotos(await votosDeEmpresas(projetoId, empresas));
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível consultar os votos das empresas."));
    } finally {
      setCarregando(false);
    }
  }, [projetoId, empresas]);

  useEffect(() => {
    if (!carregandoEmpresas && !erroEmpresas) carregar();
  }, [carregar, carregandoEmpresas, erroEmpresas, versao]);

  const votosEmpresas = votos?.aFavor.length ?? 0;
  const votosPessoas = Math.max(0, totalVotos - votosEmpresas);
  const pctEmpresasNoTotal = totalVotos > 0 ? (votosEmpresas / totalVotos) * 100 : 0;
  const adesao = votos && votos.consultadas > 0 ? (votosEmpresas / votos.consultadas) * 100 : null;
  const carregandoTudo = carregandoTotal || carregandoEmpresas || carregando;

  return (
    <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-votos" aria-busy={carregandoTudo}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-votos" className={cls.eyebrow}>
          <Vote size={14} aria-hidden="true" /> Votos
        </h2>
        {carregandoTudo && <Loader2 size={15} className="animate-spin text-ink-400" aria-label="Atualizando votos" />}
      </div>
      <p className="mt-1 text-[12.5px] text-ink-500">Cada curtida no projeto conta como um voto de apoio.</p>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Numero icone={Heart} rotulo="Total" valor={carregandoTotal ? null : totalVotos} />
        <Numero icone={Building2} rotulo="Empresas" valor={votos && !carregandoEmpresas ? votosEmpresas : erroEmpresas || erro ? "—" : null} />
        <Numero icone={Users} rotulo="Pessoas" valor={votos && !carregandoTotal ? votosPessoas : erroEmpresas || erro ? "—" : null} />
      </dl>

      {totalVotos > 0 && votos && (
        <div className="mt-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
            <div className="h-full bg-brand-600" style={{ width: `${pctEmpresasNoTotal}%` }} />
            <div className="h-full bg-accent-400" style={{ width: `${100 - pctEmpresasNoTotal}%` }} />
          </div>
          <p className="mt-1.5 flex flex-wrap justify-between gap-2 text-[12px] text-ink-500">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" />
              Empresas: {formatarPercentual(pctEmpresasNoTotal, 1)}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
              Pessoas: {formatarPercentual(100 - pctEmpresasNoTotal, 1)}
            </span>
          </p>
        </div>
      )}

      {erroEmpresas ? (
        <Alerta className="mt-4" onTentarNovamente={onTentarNovamente}>
          {erroEmpresas}
        </Alerta>
      ) : erro ? (
        <Alerta className="mt-4" onTentarNovamente={carregar}>
          {erro}
        </Alerta>
      ) : votos && !carregandoEmpresas ? (
        <div className="mt-5 border-t border-ink-100 pt-4">
          <h3 className="text-[13px] font-semibold text-ink-800">Resultado entre as empresas</h3>
          {empresas.length === 0 ? (
            <p className="mt-1 text-[12.5px] text-ink-500">Ainda não há empresas cadastradas na plataforma.</p>
          ) : (
            <>
              <p className="mt-1 text-[13px] text-ink-600">
                {votosEmpresas} de {votos.consultadas} empresa{votos.consultadas === 1 ? "" : "s"} votaram neste projeto
                {adesao !== null && <strong className="font-semibold text-ink-900"> ({formatarPercentual(adesao, 1)} de adesão)</strong>}.
              </p>
              {votos.falhas > 0 && (
                <p className="mt-1 text-[12px] text-amber-700">
                  Não foi possível consultar {votos.falhas} empresa{votos.falhas === 1 ? "" : "s"}; elas ficaram fora do cálculo.
                </p>
              )}
              {votos.aFavor.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {votos.aFavor.map((e) => (
                    <li key={e.idUsuario}>
                      <Link
                        href={`/perfil/${e.idUsuario}`}
                        className="inline-flex items-center gap-2 rounded-full border border-ink-100 py-1 pl-1 pr-3 text-[12.5px] font-semibold text-ink-800 hover:border-brand-200 hover:text-brand-700"
                      >
                        <Avatar url={e.urlImagem} nome={e.nome} tamanho={24} />
                        {e.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Numero({ icone: Icone, rotulo, valor }: { icone: typeof Heart; rotulo: string; valor: number | string | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-ink-100 px-3 py-3 text-center">
      <dt className="flex items-center justify-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.03em] text-ink-400">
        <Icone size={12} className="hidden shrink-0 min-[420px]:block" aria-hidden="true" /> <span className="min-w-0 break-words">{rotulo}</span>
      </dt>
      <dd className="mt-1 font-display text-[1.35rem] font-extrabold leading-none text-ink-900">
        {valor === null ? <span className={`${cls.skeleton} mx-auto inline-block h-5 w-8 rounded`} aria-label="carregando" /> : typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor}
      </dd>
    </div>
  );
}
