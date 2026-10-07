"use client";

import { LayoutGrid } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { Area } from "../../types/Area";
import { listarAreas, criarArea, atualizarArea, excluirArea } from "../../services/area.service";
import { listarSubAreas } from "../../services/subArea.service";
import { LIMITES, mesmoNome } from "../../lib/limites";

/** Áreas (AreaRequestDTO: nomeArea, descricaoArea — ambos obrigatórios). */
export default function AdminAreasPage() {
  return (
    <CrudAdmin<Area, { nomeArea: string; descricaoArea: string }>
      titulo="Áreas"
      descricao="Grandes áreas de atuação usadas para organizar o conteúdo."
      icone={LayoutGrid}
      rotuloSingular="área"
      rotuloPlural="áreas"
      feminino
      listar={listarAreas}
      idDe={(a) => a.idArea}
      textoBusca={(a) => [a.nomeArea, a.descricaoArea]}
      placeholderBusca="Buscar por nome ou descrição"
      ordenar={(a, b) => a.nomeArea.localeCompare(b.nomeArea, "pt-BR")}
      renderItem={(a) => (
        <>
          <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{a.nomeArea}</h3>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 break-words">{a.descricaoArea}</p>
        </>
      )}
      campos={[
        { nome: "nomeArea", rotulo: "Nome da área", maxLength: LIMITES.nomeArea, placeholder: "Ex.: Tecnologia", largo: true },
        { nome: "descricaoArea", rotulo: "Descrição", tipo: "textarea", placeholder: "O que esta área reúne" },
      ]}
      vazio={{ nomeArea: "", descricaoArea: "" }}
      paraFormulario={(a) => ({ nomeArea: a.nomeArea, descricaoArea: a.descricaoArea })}
      validar={(f, itens, id) => {
        if (!f.nomeArea.trim() || !f.descricaoArea.trim()) return "Preencha nome e descrição.";
        // nome_area é UNIQUE no banco: um nome repetido seria recusado com erro 500.
        if (itens.some((a) => a.idArea !== id && mesmoNome(a.nomeArea, f.nomeArea))) return "Já existe uma área com esse nome.";
        return null;
      }}
      salvar={(f, id) => {
        const dados = { nomeArea: f.nomeArea.trim(), descricaoArea: f.descricaoArea.trim() };
        return id ? atualizarArea(id, dados) : criarArea(dados);
      }}
      erroSalvar="Não foi possível salvar a área. Verifique se o nome já não está em uso."
      rotuloExcluir={(a) => a.nomeArea}
      antesDeExcluir={async (a) => {
        // Subáreas referenciam a área (sem cascade): o servidor recusaria a exclusão com erro 500.
        const emUso = ((await listarSubAreas()) ?? []).filter((s) => s.area?.idArea === a.idArea).length;
        return emUso > 0
          ? `Esta área tem ${emUso} subárea${emUso === 1 ? "" : "s"} vinculada${emUso === 1 ? "" : "s"}. Exclua ou mova as subáreas antes de excluir a área.`
          : null;
      }}
      excluir={(a) => excluirArea(a.idArea)}
    />
  );
}
