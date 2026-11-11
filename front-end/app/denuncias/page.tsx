"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, Loader2, Scale } from "lucide-react";

import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import SearchBar from "../components/SearchBar";
import { CardGridSkeleton } from "../components/Skeleton";
import Paginacao from "../components/ui/Paginacao";
import Modal from "../components/ui/Modal";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { ResumoDenuncia } from "../components/denuncia/InfoDenuncia";
import { useAuth } from "../context/AuthContext";
import { usePaginacao } from "../hook/usePaginacao";
import { mensagemErro } from "../lib/api";
import { listarMinhasDenuncias, rotuloCategoria, solicitarApelacao } from "../services/denuncia.service";
import { Denuncia, ROTULO_STATUS_DENUNCIA, StatusDenuncia } from "../types/Denuncia";

const APELACAO_MAX = 1000;

/**
 * Minhas denúncias (GET /denuncia/me): acompanha o status de cada denúncia enviada e permite
 * pedir apelação (POST /denuncia/{id}/apelacao) quando a denúncia foi aceita — uma vez.
 */
export default function MinhasDenunciasPage() {
  const { isAuthenticated } = useAuth();
  const { notificar } = useFeedback();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<StatusDenuncia | "">("");
  const [apelando, setApelando] = useState<Denuncia | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [erroApelacao, setErroApelacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      setDenuncias((await listarMinhasDenuncias({ forcar: true })) ?? []);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar suas denúncias."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return denuncias.filter(
      (d) =>
        (!status || d.status === status) &&
        (!termo || `${d.idDenuncia} ${rotuloCategoria(d.categoria)} ${d.descricao ?? ""} ${d.tipoDenuncia}`.toLowerCase().includes(termo))
    );
  }, [denuncias, busca, status]);
  const paginacao = usePaginacao(visiveis, { tamanhoInicial: 10, chaveReinicio: `${busca}|${status}` });

  async function enviarApelacao() {
    if (!apelando) return;
    if (!justificativa.trim()) {
      setErroApelacao("Explique por que a decisão deve ser revista.");
      return;
    }
    setEnviando(true);
    setErroApelacao("");
    try {
      const atualizada = await solicitarApelacao(apelando.idDenuncia, justificativa.trim());
      setDenuncias((l) => l.map((d) => (d.idDenuncia === atualizada.idDenuncia ? atualizada : d)));
      notificar("Apelação enviada. A moderação vai revisar a decisão.", "sucesso");
      setApelando(null);
    } catch (e) {
      setErroApelacao(mensagemErro(e, "Não foi possível enviar a apelação."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PageShell>
      <div className="pb-5 mb-1">
        <p className={cls.eyebrow}>Segurança</p>
        <h1 className={cls.h1}>Minhas denúncias</h1>
        <p className={`${cls.texto} mt-1.5 max-w-xl`}>
          Acompanhe as denúncias que você enviou. Sua identidade é sigilosa para quem foi denunciado. Quando uma denúncia é
          aceita, é possível pedir uma apelação (revisão) uma única vez.
        </p>
      </div>

      <SearchBar value={busca} onChange={setBusca} onRefresh={carregar} loading={loading} placeholder="Pesquisar por motivo ou detalhe..." />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
        {(["", "PENDENTE", "ACEITA", "REJEITADA"] as const).map((s) => (
          <button
            key={s || "todas"}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              status === s ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
            }`}
          >
            {s ? ROTULO_STATUS_DENUNCIA[s] : "Todas"}
          </button>
        ))}
      </div>

      {erro && !loading && <Alerta onTentarNovamente={carregar}>{erro}</Alerta>}

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : erro ? null : visiveis.length === 0 ? (
        <div className={cls.card}>
          <EmptyState
            icon={Flag}
            title={denuncias.length === 0 ? "Você ainda não enviou denúncias" : "Nenhuma denúncia encontrada"}
            description={
              denuncias.length === 0
                ? "Use o botão de denúncia em publicações, comentários, projetos ou perfis que violem as regras."
                : "Tente outro filtro."
            }
          />
        </div>
      ) : (
        <>
          <ul>
            {paginacao.itens.map((d) => (
              <li key={d.idDenuncia} className={cls.linha}>
                <ResumoDenuncia denuncia={d} />
                {d.status === "ACEITA" && !d.apelacaoSolicitada && (
                  <button
                    type="button"
                    onClick={() => {
                      setApelando(d);
                      setJustificativa("");
                      setErroApelacao("");
                    }}
                    className={`${cls.btnContorno} mt-3 !text-[13px]`}
                  >
                    <Scale size={15} aria-hidden="true" /> Pedir apelação
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className={`${cls.card} overflow-hidden`}>
            <Paginacao
              pagina={paginacao.pagina}
              totalPaginas={paginacao.totalPaginas}
              total={paginacao.total}
              inicio={paginacao.inicio}
              fim={paginacao.fim}
              tamanho={paginacao.tamanho}
              onPagina={paginacao.irPara}
              onTamanho={paginacao.setTamanho}
              rotulo="denúncias"
            />
          </div>
        </>
      )}

      <Modal
        aberto={!!apelando}
        titulo={`Apelação da denúncia #${apelando?.idDenuncia ?? ""}`}
        descricao="Explique por que a decisão da moderação deve ser revista. Só é possível apelar uma vez."
        onFechar={() => setApelando(null)}
        ocupado={enviando}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!enviando) enviarApelacao();
          }}
        >
          {erroApelacao && <Alerta className="mb-3">{erroApelacao}</Alerta>}
          <label htmlFor="apelacao-justificativa" className={cls.label}>
            Justificativa
          </label>
          <textarea
            id="apelacao-justificativa"
            value={justificativa}
            maxLength={APELACAO_MAX}
            rows={4}
            onChange={(e) => setJustificativa(e.target.value)}
            className={`${cls.input} resize-y`}
          />
          <p className="mt-1 text-right text-[12px] text-ink-400">
            {justificativa.length}/{APELACAO_MAX}
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={() => setApelando(null)} disabled={enviando} className={cls.btnSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className={cls.btnPrimario}>
              {enviando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Scale size={15} aria-hidden="true" />}
              Enviar apelação
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
