"use client";

import { useCallback, useMemo, useState } from "react";
import { HandCoins, Loader2, Trash2 } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import { formatarMoeda } from "../../lib/validacao";
import { Proposta } from "../../types/Proposta";
import { ContraProposta } from "../../types/ContraProposta";
import { excluirProposta, listarPropostas } from "../../services/proposta.service";
import { excluirContraProposta, listarContraPropostas } from "../../services/contraProposta.service";

/**
 * Moderação de propostas e contrapropostas.
 *
 * GET/DELETE /proposta não têm @PreAuthorize (qualquer usuário autenticado); DELETE
 * /contra-proposta aceita ADMIN. No banco, excluir a proposta apaga as contrapropostas
 * (ON DELETE CASCADE). O modelo não guarda autor nem projeto da proposta, por isso a tela
 * mostra apenas descrição e valor.
 */
export default function AdminPropostasPage() {
  const { notificar, confirmar } = useFeedback();
  const [contras, setContras] = useState<ContraProposta[]>([]);
  const [excluindoContra, setExcluindoContra] = useState<number | null>(null);
  const [filtroContra, setFiltroContra] = useState("");

  // Propostas e contrapropostas são carregadas juntas (a contagem aparece em cada proposta).
  const listar = useCallback(async () => {
    const [propostas, contrapropostas] = await Promise.all([listarPropostas(), listarContraPropostas().catch(() => [] as ContraProposta[])]);
    setContras(contrapropostas ?? []);
    return propostas ?? [];
  }, []);

  const porProposta = useMemo(() => {
    const mapa = new Map<number, ContraProposta[]>();
    for (const c of contras) mapa.set(c.propostaId, [...(mapa.get(c.propostaId) ?? []), c]);
    return mapa;
  }, [contras]);

  async function removerContra(c: ContraProposta) {
    if (!(await confirmar("Excluir esta contraproposta? Essa ação não pode ser desfeita.", { titulo: "Excluir contraproposta", confirmarLabel: "Excluir", perigo: true }))) return;
    setExcluindoContra(c.idContraProposta);
    try {
      await excluirContraProposta(c.idContraProposta);
      setContras((lista) => lista.filter((x) => x.idContraProposta !== c.idContraProposta));
      notificar("Contraproposta excluída.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a contraproposta."));
    } finally {
      setExcluindoContra(null);
    }
  }

  const filtrar = useMemo(() => {
    if (!filtroContra) return undefined;
    return (p: Proposta) => (filtroContra === "com" ? (porProposta.get(p.idProposta)?.length ?? 0) > 0 : !porProposta.has(p.idProposta));
  }, [filtroContra, porProposta]);

  return (
    <CrudAdmin<Proposta, Record<string, string>>
      titulo="Propostas"
      descricao="Propostas de negócio e as contrapropostas recebidas. Excluir uma proposta também remove as contrapropostas dela."
      icone={HandCoins}
      rotuloSingular="proposta"
      rotuloPlural="propostas"
      feminino
      listar={listar}
      idDe={(p) => p.idProposta}
      textoBusca={(p) => [p.idProposta, p.descricaoProposta, p.valorProposta, ...(porProposta.get(p.idProposta) ?? []).map((c) => c.descricaoContraProposta)]}
      placeholderBusca="Buscar na descrição da proposta ou das contrapropostas"
      filtros={
        <select aria-label="Filtrar por contrapropostas" value={filtroContra} onChange={(e) => setFiltroContra(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
          <option value="">Todas</option>
          <option value="com">Com contrapropostas</option>
          <option value="sem">Sem contrapropostas</option>
        </select>
      }
      filtrar={filtrar}
      chaveFiltro={filtroContra}
      renderItem={(p) => {
        const lista = porProposta.get(p.idProposta) ?? [];
        return (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[14.5px] font-semibold text-ink-900">Proposta #{p.idProposta}</h3>
              <span className={cls.chip}>{p.valorProposta !== null && p.valorProposta !== undefined ? formatarMoeda(p.valorProposta) : "Sem valor"}</span>
              <span className="text-[12px] text-ink-400">
                {lista.length} contraproposta{lista.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-[0.8125rem] text-ink-600 whitespace-pre-line break-words">{p.descricaoProposta}</p>
            {lista.length > 0 && (
              <details className="mt-2 group">
                <summary className="cursor-pointer text-[12.5px] font-semibold text-brand-700 hover:underline">Ver contrapropostas</summary>
                <ul className="mt-2 space-y-2 border-l-2 border-brand-100 pl-3">
                  {lista.map((c) => (
                    <li key={c.idContraProposta} className="flex items-start justify-between gap-3 rounded-lg bg-ink-25 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-ink-700">
                          #{c.idContraProposta} ·{" "}
                          {c.valorContraProposta !== null && c.valorContraProposta !== undefined ? formatarMoeda(c.valorContraProposta) : "Sem valor"}
                        </p>
                        <p className="text-[12.5px] text-ink-600 whitespace-pre-line break-words">{c.descricaoContraProposta}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerContra(c)}
                        disabled={excluindoContra === c.idContraProposta}
                        className={cls.btnIconePerigo}
                        aria-label={`Excluir contraproposta #${c.idContraProposta}`}
                      >
                        {excluindoContra === c.idContraProposta ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        );
      }}
      campos={[]}
      vazio={{}}
      paraFormulario={() => ({})}
      salvar={async () => undefined}
      podeEscrever={false}
      rotuloExcluir={(p) => `Proposta #${p.idProposta}`}
      excluir={(p) => excluirProposta(p.idProposta)}
    />
  );
}
