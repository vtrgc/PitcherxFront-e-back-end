"use client";

import { Tag } from "lucide-react";
import CrudTermoSimples, { TermoSimples } from "../../components/admin/CrudTermoSimples";
import { listarTermosPostagem, criarTermoPostagem, atualizarTermoPostagem, excluirTermoPostagem } from "../../services/termoPostagem.service";

/** Termos de postagem (/termo-postagem): regras exibidas a quem publica no feed. */
async function listarTermos(): Promise<TermoSimples[]> {
  return ((await listarTermosPostagem()) ?? []).map((t) => ({ id: t.idTermoPostagem, titulo: t.tituloTermoPostagem, descricao: t.descricaoTermoPostagem }));
}

const criarTermo = (d: { titulo: string; descricao: string }) => criarTermoPostagem({ tituloTermoPostagem: d.titulo, descricaoTermoPostagem: d.descricao });
const atualizarTermo = (id: number, d: { titulo: string; descricao: string }) => atualizarTermoPostagem(id, { tituloTermoPostagem: d.titulo, descricaoTermoPostagem: d.descricao });

export default function AdminTermosPostagemPage() {
  return (
    <CrudTermoSimples
      titulo="Termos de postagem"
      descricao="Regras exibidas a quem publica no feed."
      icone={Tag}
      nomeItem="termo de postagem"
      listar={listarTermos}
      criar={criarTermo}
      atualizar={atualizarTermo}
      excluir={excluirTermoPostagem}
    />
  );
}
