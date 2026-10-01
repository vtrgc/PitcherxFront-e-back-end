"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Reply } from "lucide-react";

import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import FormValorDescricao from "../../components/FormValorDescricao";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { formatarMoeda } from "../../lib/validacao";
import { Proposta } from "../../types/Proposta";
import { ContraProposta } from "../../types/ContraProposta";
import { buscarProposta } from "../../services/proposta.service";
import {
  listarContraPropostas,
  criarContraProposta,
  atualizarContraProposta,
  excluirContraProposta,
} from "../../services/contraProposta.service";

export default function PropostaDetalhePage() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated } = useAuth();
  const { notificar, confirmar } = useFeedback();

  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [contraPropostas, setContraPropostas] = useState<ContraProposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [erroContras, setErroContras] = useState("");
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<ContraProposta | null>(null);

  const carregar = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setNaoEncontrada(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro("");
    setErroContras("");
    setNaoEncontrada(false);
    try {
      const [dadosProposta, rContras] = await Promise.all([
        buscarProposta(id),
        listarContraPropostas().then(
          (v) => ({ ok: true as const, v }),
          (e) => ({ ok: false as const, e })
        ),
      ]);
      setProposta(dadosProposta);
      if (rContras.ok) {
        setContraPropostas((rContras.v ?? []).filter((cp) => cp.propostaId === id).sort((a, b) => a.idContraProposta - b.idContraProposta));
      } else {
        setErroContras(mensagemErro(rContras.e, "Não foi possível carregar as contra-propostas."));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNaoEncontrada(true);
      else setErro(mensagemErro(error, "Não foi possível carregar a proposta."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  async function salvar(descricao: string, valor: number | null) {
    const payload = { descricaoContraProposta: descricao, valorContraProposta: valor, idProposta: id };
    if (editando) {
      await atualizarContraProposta(editando.idContraProposta, payload);
      notificar("Contra-proposta atualizada.", "sucesso");
    } else {
      await criarContraProposta(payload);
      notificar("Contra-proposta enviada.", "sucesso");
    }
    setMostrarForm(false);
    setEditando(null);
    await carregar();
  }

  async function excluir(cp: ContraProposta) {
    if (!(await confirmar("Excluir esta contra-proposta?", { titulo: "Excluir contra-proposta", perigo: true }))) return;
    try {
      await excluirContraProposta(cp.idContraProposta);
      setContraPropostas((atual) => atual.filter((c) => c.idContraProposta !== cp.idContraProposta));
      notificar("Contra-proposta excluída.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a contra-proposta."));
    }
  }

  return (
    <PageShell area="usuario">
      <Link href="/propostas" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para propostas
      </Link>

      {loading ? (
        <div className={`${cls.card} p-6`} aria-label="Carregando proposta">
          <div className={`${cls.skeleton} h-5 w-32 rounded-lg`} />
          <div className={`${cls.skeleton} mt-4 h-4 w-full rounded-lg`} />
          <div className={`${cls.skeleton} mt-2 h-4 w-3/4 rounded-lg`} />
        </div>
      ) : naoEncontrada ? (
        <div className={cls.card}>
          <EmptyState icon={Reply} title="Proposta não encontrada" description="Ela pode ter sido excluída." />
        </div>
      ) : erro ? (
        <Alerta onTentarNovamente={carregar}>{erro}</Alerta>
      ) : proposta ? (
        <>
          <div className="relative -mx-4 overflow-hidden rounded-[1.25rem] bg-stage-gradient px-5 pb-8 pt-10 sm:-mx-8 sm:px-10 lg:-mx-10">
            <span className={cls.chip}>Proposta #{proposta.idProposta}</span>
            <h1 className="sr-only">Proposta #{proposta.idProposta}</h1>
            <p className={`${cls.texto} mt-4 max-w-2xl whitespace-pre-line break-words`}>{proposta.descricaoProposta}</p>
            <p className="font-display mt-5 text-[1.35rem] font-extrabold text-ink-900">{formatarMoeda(proposta.valorProposta)}</p>
          </div>

          <section className="mt-8" aria-labelledby="titulo-contras">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="titulo-contras" className={cls.eyebrow}>
                <Reply size={14} aria-hidden="true" />
                Contra-propostas
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditando(null);
                  setMostrarForm((v) => !v);
                }}
                aria-expanded={mostrarForm && !editando}
                className={`${cls.btnSecundario} !text-[13px]`}
              >
                <Plus size={15} aria-hidden="true" />
                Nova contra-proposta
              </button>
            </div>

            {mostrarForm && (
              <div className={`${cls.composer} mt-4`}>
                <h3 className="text-[15px] font-bold text-ink-900">{editando ? "Editar contra-proposta" : "Nova contra-proposta"}</h3>
                <FormValorDescricao
                  key={editando?.idContraProposta ?? "nova"}
                  idPrefixo="contra"
                  descricaoInicial={editando?.descricaoContraProposta}
                  valorInicial={editando?.valorContraProposta}
                  placeholder="Descreva a contra-proposta..."
                  rotuloEnviar={editando ? "Salvar alterações" : "Enviar"}
                  onEnviar={salvar}
                  onCancelar={() => {
                    setMostrarForm(false);
                    setEditando(null);
                  }}
                />
              </div>
            )}

            {erroContras ? (
              <Alerta className="mt-4" onTentarNovamente={carregar}>
                {erroContras}
              </Alerta>
            ) : contraPropostas.length === 0 ? (
              <p className="text-[0.8125rem] text-ink-500 mt-5">Nenhuma contra-proposta enviada ainda.</p>
            ) : (
              <ul className="mt-3">
                {contraPropostas.map((cp) => (
                  <li key={cp.idContraProposta} className={`${cls.linha} flex items-start justify-between gap-3`}>
                    <div className="min-w-0">
                      <p className={`${cls.texto} whitespace-pre-line break-words`}>{cp.descricaoContraProposta}</p>
                      <span className={`${cls.chip} mt-2`}>{formatarMoeda(cp.valorContraProposta)}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(cp);
                          setMostrarForm(true);
                        }}
                        className={cls.btnIcone}
                        aria-label="Editar contra-proposta"
                      >
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => excluir(cp)} className={cls.btnIconePerigo} aria-label="Excluir contra-proposta">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
