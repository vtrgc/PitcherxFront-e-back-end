"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { cls } from "../../components/ui/estilos";
import { listarProjetos } from "../../services/projeto.service";
import { excluirTermoVinculo, listarTermosVinculo } from "../../services/termoVinculo.service";
import { Projeto } from "../../types/Projeto";
import { TermoVinculo } from "../../types/TermoVinculo";

/**
 * Termos de vínculo de todos os projetos (GET /termo-vinculo). Cada termo pertence a um projeto e
 * é cadastrado pelo criador na página do projeto (POST /termo-vinculo/projeto/{id}, roles
 * USUARIO/EMPRESA). Ao administrador o backend permite consultar e excluir (moderação).
 */
export default function AdminTermosVinculoPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [filtroProjeto, setFiltroProjeto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    listarProjetos()
      .then((lista) => setProjetos([...(lista ?? [])].sort((a, b) => a.nomeProjeto.localeCompare(b.nomeProjeto, "pt-BR"))))
      .catch(() => setProjetos([]));
  }, []);

  const nomeProjeto = useMemo(() => new Map(projetos.map((p) => [p.idProjeto, p.nomeProjeto])), [projetos]);

  return (
    <CrudAdmin<TermoVinculo, Record<string, string>>
      titulo="Termos de vínculo"
      descricao="Condições que cada projeto exige para liberar o acesso. Os criadores cadastram os termos na página do projeto."
      icone={Link2}
      rotuloSingular="termo"
      rotuloPlural="termos"
      listar={listarTermosVinculo}
      idDe={(t) => t.idTermoVinculo}
      textoBusca={(t) => [t.tituloTermoVinculo, t.descricaoTermoVinculo, t.projetoId ? nomeProjeto.get(t.projetoId) : ""]}
      placeholderBusca="Buscar por título, descrição ou projeto"
      filtros={
        <>
          <select
            aria-label="Filtrar por projeto"
            value={filtroProjeto}
            onChange={(e) => setFiltroProjeto(e.target.value)}
            className={`${cls.input} !w-auto !max-w-[16rem] !py-2.5 !bg-white`}
          >
            <option value="">Todos os projetos</option>
            {projetos.map((p) => (
              <option key={p.idProjeto} value={p.idProjeto}>
                {p.nomeProjeto}
              </option>
            ))}
          </select>
          <select aria-label="Filtrar por obrigatoriedade" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
            <option value="">Obrigatórios e opcionais</option>
            <option value="sim">Somente obrigatórios</option>
            <option value="nao">Somente opcionais</option>
          </select>
        </>
      }
      filtrar={
        filtroProjeto || filtroTipo
          ? (t) => (!filtroProjeto || String(t.projetoId) === filtroProjeto) && (!filtroTipo || !!t.obrigatorio === (filtroTipo === "sim"))
          : undefined
      }
      chaveFiltro={`${filtroProjeto}|${filtroTipo}`}
      renderItem={(t) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{t.tituloTermoVinculo}</h3>
            <span className={t.obrigatorio ? cls.chip : cls.chipInativo}>{t.obrigatorio ? "Obrigatório" : "Opcional"}</span>
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 whitespace-pre-line break-words">{t.descricaoTermoVinculo}</p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            Projeto:{" "}
            {t.projetoId ? (
              <Link href={`/projetos/${t.projetoId}`} className="font-semibold text-brand-700 hover:underline">
                {nomeProjeto.get(t.projetoId) ?? `#${t.projetoId}`}
              </Link>
            ) : (
              "termo antigo, sem projeto"
            )}
          </p>
        </>
      )}
      campos={[]}
      vazio={{}}
      paraFormulario={() => ({})}
      salvar={() => Promise.resolve()}
      podeEscrever={false}
      avisoSomenteLeitura="Os termos são definidos pelo criador de cada projeto. Como administrador, você pode consultar e excluir termos inadequados."
      rotuloExcluir={(t) => t.tituloTermoVinculo}
      excluir={(t) => excluirTermoVinculo(t.idTermoVinculo)}
    />
  );
}
