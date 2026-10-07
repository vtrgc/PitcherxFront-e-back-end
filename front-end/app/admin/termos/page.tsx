"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSignature } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { cls } from "../../components/ui/estilos";
import { Termo } from "../../types/Termo";
import { Contrato } from "../../types/Contrato";
import { listarTermos, criarTermo, atualizarTermo, excluirTermo } from "../../services/termo.service";
import { listarContratos } from "../../services/contrato.service";
import { LIMITES } from "../../lib/limites";

/** Termos de contrato (TermoRequestDTO: tituloTermo, descricaoTermo, contratoId — todos obrigatórios). */
export default function AdminTermosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [filtroContrato, setFiltroContrato] = useState("");

  useEffect(() => {
    listarContratos()
      .then((lista) => setContratos(lista ?? []))
      .catch(() => setContratos([]));
  }, []);

  const titulos = useMemo(() => new Map(contratos.map((c) => [c.idContrato, c.tituloContrato])), [contratos]);
  const opcoesContrato = useMemo(
    () => contratos.map((c) => ({ valor: String(c.idContrato), rotulo: `#${c.idContrato} — ${c.tituloContrato}` })),
    [contratos]
  );

  return (
    <CrudAdmin<Termo, { tituloTermo: string; descricaoTermo: string; contratoId: string }>
      titulo="Termos de contrato"
      descricao="Cláusulas vinculadas a um contrato específico."
      icone={FileSignature}
      rotuloSingular="termo"
      rotuloPlural="termos"
      listar={listarTermos}
      idDe={(t) => t.idTermo}
      textoBusca={(t) => [t.tituloTermo, t.descricaoTermo, titulos.get(t.contratoId)]}
      placeholderBusca="Buscar por título, descrição ou contrato"
      filtros={
        <select aria-label="Filtrar por contrato" value={filtroContrato} onChange={(e) => setFiltroContrato(e.target.value)} className={`${cls.input} !w-auto !max-w-[16rem] !py-2.5 !bg-white`}>
          <option value="">Todos os contratos</option>
          {opcoesContrato.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      }
      filtrar={filtroContrato ? (t) => String(t.contratoId) === filtroContrato : undefined}
      chaveFiltro={filtroContrato}
      renderItem={(t) => (
        <>
          <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{t.tituloTermo}</h3>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 whitespace-pre-line break-words">{t.descricaoTermo}</p>
          <Link href={`/contratos/${t.contratoId}`} className="mt-1.5 inline-block text-[12.5px] font-medium text-brand-700 hover:underline">
            Contrato: {titulos.get(t.contratoId) ?? `#${t.contratoId}`}
          </Link>
        </>
      )}
      campos={[
        { nome: "tituloTermo", rotulo: "Título do termo", maxLength: LIMITES.tituloTermo },
        {
          nome: "contratoId",
          rotulo: "Contrato",
          tipo: "select",
          opcoes: opcoesContrato,
          ajuda: contratos.length === 0 ? "Nenhum contrato cadastrado: os termos precisam de um contrato." : undefined,
        },
        { nome: "descricaoTermo", rotulo: "Descrição", tipo: "textarea", maxLength: LIMITES.descricaoTermo },
      ]}
      vazio={{ tituloTermo: "", descricaoTermo: "", contratoId: "" }}
      paraFormulario={(t) => ({ tituloTermo: t.tituloTermo, descricaoTermo: t.descricaoTermo, contratoId: String(t.contratoId) })}
      validar={(f) => {
        if (!f.tituloTermo.trim() || !f.descricaoTermo.trim() || !f.contratoId) return "Preencha título, descrição e selecione o contrato.";
        // titulo_termo e descricao_termo são VARCHAR(255) no banco.
        if (f.tituloTermo.trim().length > LIMITES.tituloTermo || f.descricaoTermo.trim().length > LIMITES.descricaoTermo)
          return `Título e descrição podem ter no máximo ${LIMITES.descricaoTermo} caracteres cada.`;
        return null;
      }}
      salvar={(f, id) => {
        const dados = { tituloTermo: f.tituloTermo.trim(), descricaoTermo: f.descricaoTermo.trim(), contratoId: Number(f.contratoId) };
        return id ? atualizarTermo(id, dados) : criarTermo(dados);
      }}
      rotuloExcluir={(t) => t.tituloTermo}
      excluir={(t) => excluirTermo(t.idTermo)}
    />
  );
}
