"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { cls } from "../../components/ui/estilos";
import { SubArea } from "../../types/SubArea";
import { Area } from "../../types/Area";
import { listarSubAreas, criarSubArea, atualizarSubArea, excluirSubArea } from "../../services/subArea.service";
import { listarAreas } from "../../services/area.service";
import { LIMITES } from "../../lib/limites";

/** Subáreas (SubAreaRequestDTO: nomeSubArea, descricaoSubArea, idArea — todos obrigatórios). */
export default function AdminSubAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [filtroArea, setFiltroArea] = useState("");

  useEffect(() => {
    listarAreas()
      .then((lista) => setAreas([...(lista ?? [])].sort((a, b) => a.nomeArea.localeCompare(b.nomeArea, "pt-BR"))))
      .catch(() => setAreas([]));
  }, []);

  const opcoesArea = useMemo(() => areas.map((a) => ({ valor: String(a.idArea), rotulo: a.nomeArea })), [areas]);

  return (
    <CrudAdmin<SubArea, { nomeSubArea: string; descricaoSubArea: string; idArea: string }>
      titulo="Subáreas"
      descricao="Especializações dentro de cada área."
      icone={LayoutGrid}
      rotuloSingular="subárea"
      rotuloPlural="subáreas"
      feminino
      listar={listarSubAreas}
      idDe={(s) => s.idSubArea}
      textoBusca={(s) => [s.nomeSubArea, s.descricaoSubArea, s.area?.nomeArea]}
      placeholderBusca="Buscar por nome, descrição ou área"
      ordenar={(a, b) => a.nomeSubArea.localeCompare(b.nomeSubArea, "pt-BR")}
      filtros={
        <select aria-label="Filtrar por área" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
          <option value="">Todas as áreas</option>
          {opcoesArea.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      }
      filtrar={filtroArea ? (s) => String(s.area?.idArea) === filtroArea : undefined}
      chaveFiltro={filtroArea}
      renderItem={(s) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{s.nomeSubArea}</h3>
            {s.area?.nomeArea && <span className={cls.chip}>{s.area.nomeArea}</span>}
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 break-words">{s.descricaoSubArea}</p>
        </>
      )}
      campos={[
        { nome: "nomeSubArea", rotulo: "Nome da subárea", maxLength: LIMITES.nomeSubArea },
        {
          nome: "idArea",
          rotulo: "Área",
          tipo: "select",
          opcoes: opcoesArea,
          ajuda: areas.length === 0 ? "Cadastre uma área antes de criar subáreas." : undefined,
        },
        { nome: "descricaoSubArea", rotulo: "Descrição", tipo: "textarea" },
      ]}
      vazio={{ nomeSubArea: "", descricaoSubArea: "", idArea: "" }}
      paraFormulario={(s) => ({ nomeSubArea: s.nomeSubArea, descricaoSubArea: s.descricaoSubArea, idArea: s.area?.idArea ? String(s.area.idArea) : "" })}
      validar={(f) => (!f.nomeSubArea.trim() || !f.descricaoSubArea.trim() || !f.idArea ? "Preencha nome, descrição e selecione a área." : null)}
      salvar={(f, id) => {
        const dados = { nomeSubArea: f.nomeSubArea.trim(), descricaoSubArea: f.descricaoSubArea.trim(), idArea: Number(f.idArea) };
        return id ? atualizarSubArea(id, dados) : criarSubArea(dados);
      }}
      rotuloExcluir={(s) => s.nomeSubArea}
      excluir={(s) => excluirSubArea(s.idSubArea)}
    />
  );
}
