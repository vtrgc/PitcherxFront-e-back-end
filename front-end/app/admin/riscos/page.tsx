"use client";

import { AlertTriangle } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { listarProjetos } from "../../services/projeto.service";
import { atualizarRiscoProjeto, criarRiscoProjeto, excluirRiscoProjeto, listarRiscosProjeto } from "../../services/riscoProjeto.service";
import { mesmoNome } from "../../lib/limites";
import { RiscoProjeto } from "../../types/RiscoProjeto";

/**
 * Catálogo de riscos (/risco-projeto): os criadores escolhem nesta lista ao publicar um projeto.
 * POST/PUT/DELETE exigem ADMIN; o nome é único e o servidor recusa excluir risco em uso (409).
 */
export default function AdminRiscosPage() {
  return (
    <CrudAdmin<RiscoProjeto, { nomeRisco: string; descricaoRisco: string }>
      titulo="Riscos de projeto"
      descricao="Catálogo de riscos que os criadores marcam ao publicar ou editar um projeto."
      icone={AlertTriangle}
      rotuloSingular="risco"
      rotuloPlural="riscos"
      listar={listarRiscosProjeto}
      idDe={(r) => r.idRiscoProjeto}
      textoBusca={(r) => [r.nomeRisco, r.descricaoRisco]}
      placeholderBusca="Buscar por nome ou descrição"
      ordenar={(a, b) => a.nomeRisco.localeCompare(b.nomeRisco, "pt-BR")}
      renderItem={(r) => (
        <>
          <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{r.nomeRisco}</h3>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 break-words">{r.descricaoRisco || "Sem descrição."}</p>
        </>
      )}
      campos={[
        { nome: "nomeRisco", rotulo: "Nome", maxLength: 255, placeholder: "Ex.: Atraso no cronograma", largo: true },
        { nome: "descricaoRisco", rotulo: "Descrição (opcional)", tipo: "textarea", maxLength: 2000 },
      ]}
      vazio={{ nomeRisco: "", descricaoRisco: "" }}
      paraFormulario={(r) => ({ nomeRisco: r.nomeRisco, descricaoRisco: r.descricaoRisco ?? "" })}
      validar={(f, itens, id) => {
        if (!f.nomeRisco.trim()) return "Informe o nome do risco.";
        if (itens.some((r) => r.idRiscoProjeto !== id && mesmoNome(r.nomeRisco, f.nomeRisco))) return "Já existe um risco com esse nome.";
        return null;
      }}
      salvar={(f, id) => {
        const dados = { nomeRisco: f.nomeRisco.trim(), descricaoRisco: f.descricaoRisco.trim() || null };
        return id ? atualizarRiscoProjeto(id, dados) : criarRiscoProjeto(dados);
      }}
      rotuloExcluir={(r) => r.nomeRisco}
      antesDeExcluir={async (r) => {
        const emUso = ((await listarProjetos()) ?? []).filter((p) => p.riscos?.some((x) => x.idRiscoProjeto === r.idRiscoProjeto)).length;
        return emUso > 0
          ? `O risco "${r.nomeRisco}" está marcado em ${emUso} projeto${emUso === 1 ? "" : "s"}. O servidor não permite excluir riscos em uso; edite o nome ou a descrição.`
          : null;
      }}
      excluir={(r) => excluirRiscoProjeto(r.idRiscoProjeto)}
    />
  );
}
