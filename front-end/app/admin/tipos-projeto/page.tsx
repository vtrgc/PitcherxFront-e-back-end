"use client";

import { Tags } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { TipoProjeto } from "../../types/TipoProjeto";
import { listarTiposProjeto, criarTipoProjeto, atualizarTipoProjeto, excluirTipoProjeto } from "../../services/tipoProjeto.service";
import { listarProjetos } from "../../services/projeto.service";
import { LIMITES, mesmoNome } from "../../lib/limites";

/** Tipos de projeto (POST/PUT/DELETE /tipo-projeto exigem ADMIN). */
export default function AdminTiposProjetoPage() {
  return (
    <CrudAdmin<TipoProjeto, { nomeTipoProjeto: string; descricaoTipoProjeto: string }>
      titulo="Tipos de projeto"
      descricao="Categorias usadas ao publicar um novo projeto."
      icone={Tags}
      rotuloSingular="tipo de projeto"
      rotuloPlural="tipos de projeto"
      listar={listarTiposProjeto}
      idDe={(t) => t.idTipoProjeto}
      textoBusca={(t) => [t.nomeTipoProjeto, t.descricaoTipoProjeto]}
      placeholderBusca="Buscar por nome ou descrição"
      ordenar={(a, b) => a.nomeTipoProjeto.localeCompare(b.nomeTipoProjeto, "pt-BR")}
      renderItem={(t) => (
        <>
          <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{t.nomeTipoProjeto}</h3>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 break-words">{t.descricaoTipoProjeto}</p>
        </>
      )}
      campos={[
        { nome: "nomeTipoProjeto", rotulo: "Nome", maxLength: LIMITES.nomeTipoProjeto, placeholder: "Ex.: Startup", largo: true },
        { nome: "descricaoTipoProjeto", rotulo: "Descrição", tipo: "textarea" },
      ]}
      vazio={{ nomeTipoProjeto: "", descricaoTipoProjeto: "" }}
      paraFormulario={(t) => ({ nomeTipoProjeto: t.nomeTipoProjeto, descricaoTipoProjeto: t.descricaoTipoProjeto })}
      validar={(f, itens, id) => {
        if (!f.nomeTipoProjeto.trim() || !f.descricaoTipoProjeto.trim()) return "Preencha nome e descrição.";
        // nome_tipo_projeto é UNIQUE no banco: um nome repetido seria recusado com erro 500.
        if (itens.some((t) => t.idTipoProjeto !== id && mesmoNome(t.nomeTipoProjeto, f.nomeTipoProjeto))) return "Já existe um tipo de projeto com esse nome.";
        return null;
      }}
      salvar={(f, id) => {
        const dados = { nomeTipoProjeto: f.nomeTipoProjeto.trim(), descricaoTipoProjeto: f.descricaoTipoProjeto.trim() };
        return id ? atualizarTipoProjeto(id, dados) : criarTipoProjeto(dados);
      }}
      erroSalvar="Não foi possível salvar o tipo de projeto. Verifique se o nome já não está em uso."
      rotuloExcluir={(t) => t.nomeTipoProjeto}
      antesDeExcluir={async (t) => {
        // projeto.tipo_projeto_id tem ON DELETE CASCADE: excluir um tipo em uso APAGARIA os projetos.
        const emUso = ((await listarProjetos()) ?? []).filter((p) => p.tipoProjetoId === t.idTipoProjeto).length;
        return emUso > 0
          ? `O tipo "${t.nomeTipoProjeto}" é usado por ${emUso} projeto${emUso === 1 ? "" : "s"}. Excluí-lo apagaria esses projetos; edite o tipo em vez de excluir.`
          : null;
      }}
      excluir={(t) => excluirTipoProjeto(t.idTipoProjeto)}
    />
  );
}
