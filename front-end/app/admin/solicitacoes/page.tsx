"use client";

import Link from "next/link";
import { useState } from "react";
import { UserPlus } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { ChipStatusSolicitacao } from "../../components/projeto/SolicitacoesVinculo";
import { cls } from "../../components/ui/estilos";
import { mapComLimite } from "../../lib/api";
import { formatarData } from "../../lib/date";
import { listarProjetos } from "../../services/projeto.service";
import { listarSolicitacoesDoProjeto } from "../../services/solicitacaoVinculo.service";
import { rotuloVinculo } from "../../types/ProjetoUsuario";
import { ROTULO_STATUS_SOLICITACAO, SolicitacaoVinculo } from "../../types/SolicitacaoVinculo";

/**
 * Acompanhamento das solicitações de participação (sócio/investidor) de todos os projetos.
 * Não há listagem geral na API: as solicitações são lidas projeto a projeto
 * (GET /solicitacao-vinculo/projeto/{id}). Aprovar e recusar é exclusivo do criador do projeto.
 */
async function listarTodas(): Promise<SolicitacaoVinculo[]> {
  const projetos = (await listarProjetos()) ?? [];
  const resultados = await mapComLimite(projetos, 4, (p) => listarSolicitacoesDoProjeto(p.idProjeto));
  const falhas = resultados.filter((r) => r.status === "rejected").length;
  if (falhas > 0 && falhas === resultados.length) throw (resultados[0] as PromiseRejectedResult).reason;
  return resultados.flatMap((r) => (r.status === "fulfilled" ? (r.value ?? []) : []));
}

export default function AdminSolicitacoesPage() {
  const [filtroStatus, setFiltroStatus] = useState("");

  return (
    <CrudAdmin<SolicitacaoVinculo, Record<string, string>>
      titulo="Solicitações de vínculo"
      descricao="Pedidos para participar de projetos como sócio ou investidor. Quem responde é o criador de cada projeto."
      icone={UserPlus}
      rotuloSingular="solicitação"
      rotuloPlural="solicitações"
      feminino
      listar={listarTodas}
      idDe={(s) => s.idSolicitacaoVinculo}
      textoBusca={(s) => [s.nomeSolicitante, s.emailSolicitante, s.nomeProjeto, rotuloVinculo(s.nomeTipoVinculoDesejado)]}
      placeholderBusca="Buscar por pessoa, e-mail ou projeto"
      filtros={
        <select aria-label="Filtrar por situação" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
          <option value="">Todas as situações</option>
          {Object.entries(ROTULO_STATUS_SOLICITACAO).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      }
      filtrar={filtroStatus ? (s) => s.status === filtroStatus : undefined}
      chaveFiltro={filtroStatus}
      renderItem={(s) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/perfil/${s.solicitanteId}`} className="font-display text-[14.5px] font-semibold text-ink-900 hover:underline">
              {s.nomeSolicitante}
            </Link>
            <ChipStatusSolicitacao status={s.status} />
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-ink-600 break-words">
            {s.emailSolicitante} · projeto{" "}
            <Link href={`/projetos/${s.projetoId}`} className="font-semibold text-brand-700 hover:underline">
              {s.nomeProjeto}
            </Link>
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Vínculo registrado: {rotuloVinculo(s.nomeTipoVinculoDesejado)} · enviado em {formatarData(s.dataSolicitacao)}
            {s.dataResposta && ` · respondido em ${formatarData(s.dataResposta)}`}
          </p>
        </>
      )}
      campos={[]}
      vazio={{}}
      paraFormulario={() => ({})}
      salvar={() => Promise.resolve()}
      podeEscrever={false}
    />
  );
}
