"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HandCoins, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";

import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import FormValorDescricao from "../components/FormValorDescricao";
import SearchBar from "../components/SearchBar";
import { CardGridSkeleton } from "../components/Skeleton";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { useAuth } from "../context/AuthContext";
import { mensagemErro } from "../lib/api";
import { formatarMoeda } from "../lib/validacao";
import { Proposta } from "../types/Proposta";
import { listarPropostas, criarProposta, atualizarProposta, excluirProposta } from "../services/proposta.service";

/**
 * Propostas. No backend, a entidade Proposta tem apenas descrição e valor: não há
 * vínculo com autor nem com projeto, e os endpoints não verificam dono. A interface
 * deixa isso explícito em vez de simular associações inexistentes.
 */
export default function PropostasPage() {
  const { isAuthenticated } = useAuth();
  const { notificar, confirmar } = useFeedback();

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Proposta | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setPropostas([...((await listarPropostas()) ?? [])].sort((a, b) => b.idProposta - a.idProposta));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as propostas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return termo ? propostas.filter((p) => p.descricaoProposta.toLowerCase().includes(termo)) : propostas;
  }, [propostas, busca]);

  async function salvar(descricao: string, valor: number | null) {
    const payload = { descricaoProposta: descricao, valorProposta: valor };
    if (editando) {
      await atualizarProposta(editando.idProposta, payload);
      notificar("Proposta atualizada.", "sucesso");
    } else {
      await criarProposta(payload);
      notificar("Proposta enviada.", "sucesso");
    }
    setMostrarForm(false);
    setEditando(null);
    await carregar();
  }

  async function excluir(proposta: Proposta) {
    const ok = await confirmar(`Excluir a proposta #${proposta.idProposta}?`, { titulo: "Excluir proposta", perigo: true });
    if (!ok) return;
    try {
      await excluirProposta(proposta.idProposta);
      notificar("Proposta excluída.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a proposta."));
    }
  }

  return (
    <PageShell area="usuario">
      <div className="pb-5 mb-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cls.eyebrow}>Negocie</p>
          <h1 className={cls.h1}>Propostas</h1>
          <p className={`${cls.texto} mt-1.5 max-w-md`}>Envie propostas de trabalho e acompanhe as contra-propostas.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setMostrarForm((v) => !v);
          }}
          aria-expanded={mostrarForm && !editando}
          className={`${cls.btnPrimario} !text-[13px]`}
        >
          <Plus size={15} aria-hidden="true" />
          Nova proposta
        </button>
      </div>

      <Alerta variante="info">
        Na versão atual da API, uma proposta guarda apenas descrição e valor — ela não registra autor nem projeto.
        Mencione na descrição a qual projeto ela se refere.
      </Alerta>

      {mostrarForm && (
        <section className={cls.composer} aria-labelledby="titulo-form-proposta">
          <h2 id="titulo-form-proposta" className={cls.h2}>
            {editando ? `Editar proposta #${editando.idProposta}` : "Nova proposta"}
          </h2>
          <FormValorDescricao
            key={editando?.idProposta ?? "nova"}
            idPrefixo="proposta"
            descricaoInicial={editando?.descricaoProposta}
            valorInicial={editando?.valorProposta}
            placeholder="Descreva sua proposta e o projeto a que ela se refere..."
            rotuloEnviar={editando ? "Salvar alterações" : "Enviar proposta"}
            onEnviar={salvar}
            onCancelar={() => {
              setMostrarForm(false);
              setEditando(null);
            }}
          />
        </section>
      )}

      <SearchBar value={busca} onChange={setBusca} onRefresh={carregar} loading={loading} placeholder="Pesquisar propostas..." />

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : erroCarregamento ? null : visiveis.length === 0 ? (
        <div className={cls.card}>
          <EmptyState
            icon={HandCoins}
            title={busca ? "Nenhuma proposta encontrada" : "Nenhuma proposta cadastrada"}
            description={busca ? "Tente outro termo." : "Crie a primeira proposta para começar a negociar."}
          />
        </div>
      ) : (
        <ul>
          {visiveis.map((proposta) => (
            <li key={proposta.idProposta} className={`${cls.linha} flex items-start justify-between gap-3`}>
              <Link href={`/propostas/${proposta.idProposta}`} className="group min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cls.chip}>#{proposta.idProposta}</span>
                  <span className="text-[14px] font-bold text-ink-900">{formatarMoeda(proposta.valorProposta)}</span>
                </div>
                <p className={`${cls.texto} mt-2 line-clamp-3 break-words`}>{proposta.descricaoProposta}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 group-hover:underline">
                  Ver contra-propostas
                  <ChevronRight size={14} aria-hidden="true" />
                </span>
              </Link>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditando(proposta);
                    setMostrarForm(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cls.btnIcone}
                  aria-label={`Editar proposta ${proposta.idProposta}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(proposta)}
                  className={cls.btnIconePerigo}
                  aria-label={`Excluir proposta ${proposta.idProposta}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
