"use client";

import { Award } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { Especialidade } from "../../types/PerfilUsuario";
import {
  listarEspecialidades,
  criarEspecialidade,
  atualizarEspecialidade,
  excluirEspecialidade,
  listarPerfisUsuario,
} from "../../services/perfilUsuario.service";
import { LIMITES, mesmoNome } from "../../lib/limites";

/** Especialidades (EspecialidadeRequestDTO: nomeEspecialidade). */
export default function AdminEspecialidadesPage() {
  return (
    <CrudAdmin<Especialidade, { nomeEspecialidade: string }>
      titulo="Especialidades"
      descricao="Especialidades escolhidas pelos usuários no perfil profissional."
      icone={Award}
      rotuloSingular="especialidade"
      rotuloPlural="especialidades"
      feminino
      listar={listarEspecialidades}
      idDe={(e) => e.idEspecialidade}
      textoBusca={(e) => [e.nomeEspecialidade]}
      placeholderBusca="Buscar especialidade"
      ordenar={(a, b) => a.nomeEspecialidade.localeCompare(b.nomeEspecialidade, "pt-BR")}
      renderItem={(e) => <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{e.nomeEspecialidade}</h3>}
      campos={[{ nome: "nomeEspecialidade", rotulo: "Nome da especialidade", maxLength: LIMITES.nomeEspecialidade, placeholder: "Ex.: Desenvolvedor(a) Front-end" }]}
      vazio={{ nomeEspecialidade: "" }}
      paraFormulario={(e) => ({ nomeEspecialidade: e.nomeEspecialidade })}
      validar={(f, itens, id) => {
        if (!f.nomeEspecialidade.trim()) return "Preencha o nome da especialidade.";
        // nome_especialidade é UNIQUE no banco: um nome repetido seria recusado com erro 500.
        if (itens.some((e) => e.idEspecialidade !== id && mesmoNome(e.nomeEspecialidade, f.nomeEspecialidade))) return "Já existe uma especialidade com esse nome.";
        return null;
      }}
      salvar={(f, id) => {
        const dados = { nomeEspecialidade: f.nomeEspecialidade.trim() };
        return id ? atualizarEspecialidade(id, dados) : criarEspecialidade(dados);
      }}
      erroSalvar="Não foi possível salvar a especialidade. Verifique se o nome já não está em uso."
      rotuloExcluir={(e) => e.nomeEspecialidade}
      antesDeExcluir={async (e) => {
        // perfil_usuario.especialidade_id tem ON DELETE CASCADE: excluir uma especialidade em
        // uso APAGARIA os perfis profissionais de quem a escolheu.
        const emUso = ((await listarPerfisUsuario()) ?? []).filter((p) => p.especialidade?.idEspecialidade === e.idEspecialidade).length;
        return emUso > 0
          ? `Esta especialidade está em uso por ${emUso} perfil${emUso === 1 ? "" : "s"}. Excluí-la apagaria esses perfis profissionais; renomeie-a em vez de excluir.`
          : null;
      }}
      excluir={(e) => excluirEspecialidade(e.idEspecialidade)}
    />
  );
}
