"use client";

import { Link2 } from "lucide-react";
import CrudTermoSimples, { TermoSimples } from "../../components/admin/CrudTermoSimples";
import { listarTermosVinculo, criarTermoVinculo, atualizarTermoVinculo, excluirTermoVinculo } from "../../services/termoVinculo.service";

/** Termos de vínculo (/termo-vinculo): condições exibidas ao vincular pessoas a projetos. */
async function listarTermos(): Promise<TermoSimples[]> {
  return ((await listarTermosVinculo()) ?? []).map((t) => ({ id: t.idTermoVinculo, titulo: t.tituloTermoVinculo, descricao: t.descricaoTermoVinculo }));
}

const criarTermo = (d: { titulo: string; descricao: string }) => criarTermoVinculo({ tituloTermoVinculo: d.titulo, descricaoTermoVinculo: d.descricao });
const atualizarTermo = (id: number, d: { titulo: string; descricao: string }) => atualizarTermoVinculo(id, { tituloTermoVinculo: d.titulo, descricaoTermoVinculo: d.descricao });

export default function AdminTermosVinculoPage() {
  return (
    <CrudTermoSimples
      titulo="Termos de vínculo"
      descricao="Condições exibidas ao vincular pessoas a projetos."
      icone={Link2}
      listar={listarTermos}
      criar={criarTermo}
      atualizar={atualizarTermo}
      excluir={excluirTermoVinculo}
    />
  );
}
