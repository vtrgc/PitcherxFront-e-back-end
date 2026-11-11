"use client";

import { useCallback, useMemo, useState } from "react";
import { Flag, Gavel, Loader2, Scale } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { ResumoDenuncia } from "../../components/denuncia/InfoDenuncia";
import Modal from "../../components/ui/Modal";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { mapComLimite, mensagemErro } from "../../lib/api";
import { listarNotificacoes } from "../../services/conexao.service";
import {
  buscarDenuncia,
  decidirApelacao,
  decidirDenuncia,
  listarDenunciasPendentes,
  rotuloCategoria,
} from "../../services/denuncia.service";
import { ACOES_DENUNCIA, Denuncia, ROTULO_PRIORIDADE, ROTULO_TIPO_DENUNCIA } from "../../types/Denuncia";
import { TIPO_NOTIFICACAO } from "../../types/Conexao";

const PESO_PRIORIDADE = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 } as const;
const DECISAO_MAX = 1000;

interface ItemModeracao {
  denuncia: Denuncia;
  /** true: a pendência é a apelação de uma denúncia já decidida. */
  apelacao: boolean;
}

/**
 * Moderação de denúncias.
 *  - Pendentes: GET /denuncia/admin/pending.
 *  - Apelações: a API não tem listagem própria; o backend avisa cada admin com uma notificação
 *    DENUNCIA_APELACAO (referenciaId = id da denúncia), e a denúncia é lida em GET /denuncia/admin/{id}.
 */
async function listarModeracao(): Promise<ItemModeracao[]> {
  const [pendentes, notificacoes] = await Promise.all([
    listarDenunciasPendentes(),
    listarNotificacoes(0, 200).catch(() => ({ itens: [] as { tipo: string; referenciaId: number | null }[] })),
  ]);
  const idsApelacao = [
    ...new Set(
      notificacoes.itens
        .filter((n) => n.tipo === TIPO_NOTIFICACAO.DENUNCIA_APELACAO && typeof n.referenciaId === "number")
        .map((n) => n.referenciaId as number)
    ),
  ];
  const apelacoes = await mapComLimite(idsApelacao, 4, (id) => buscarDenuncia(id));
  const itens: ItemModeracao[] = (pendentes ?? []).map((d) => ({ denuncia: d, apelacao: false }));
  for (const r of apelacoes) {
    if (r.status === "fulfilled" && r.value?.apelacaoSolicitada) itens.push({ denuncia: r.value, apelacao: true });
  }
  return itens;
}

export default function AdminDenunciasPage() {
  const { notificar } = useFeedback();
  const [versao, setVersao] = useState(0);
  const [filtro, setFiltro] = useState("");
  const [decidindo, setDecidindo] = useState<ItemModeracao | null>(null);
  const [status, setStatus] = useState<"ACEITA" | "REJEITADA">("ACEITA");
  const [acao, setAcao] = useState("OCULTO");
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Nova referência de `listar` faz o CrudAdmin recarregar após cada decisão.
  const listar = useMemo(() => {
    void versao;
    return () => listarModeracao();
  }, [versao]);

  const abrir = useCallback((item: ItemModeracao) => {
    setDecidindo(item);
    setStatus("ACEITA");
    setAcao(item.apelacao ? "MANTIDO" : "OCULTO");
    setJustificativa("");
    setErro("");
  }, []);

  async function decidir() {
    if (!decidindo) return;
    if (!justificativa.trim()) {
      setErro("Escreva a justificativa da decisão (ela é enviada ao denunciante).");
      return;
    }
    setSalvando(true);
    setErro("");
    const corpo = { status, decisaoAdmin: justificativa.trim(), acaoTomada: status === "REJEITADA" ? "NENHUMA" : acao };
    try {
      if (decidindo.apelacao) await decidirApelacao(decidindo.denuncia.idDenuncia, corpo);
      else await decidirDenuncia(decidindo.denuncia.idDenuncia, corpo);
      notificar(decidindo.apelacao ? "Apelação decidida." : "Denúncia decidida. O denunciante foi notificado.", "sucesso");
      setDecidindo(null);
      setVersao((v) => v + 1);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível registrar a decisão."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <CrudAdmin<ItemModeracao, Record<string, string>>
        titulo="Denúncias"
        descricao="Denúncias pendentes e pedidos de apelação. Cada decisão notifica o denunciante, que permanece anônimo."
        icone={Flag}
        rotuloSingular="denúncia"
        rotuloPlural="denúncias"
        feminino
        listar={listar}
        idDe={(i) => i.denuncia.idDenuncia * 2 + (i.apelacao ? 1 : 0)}
        textoBusca={(i) => [
          i.denuncia.idDenuncia,
          rotuloCategoria(i.denuncia.categoria),
          i.denuncia.descricao,
          ROTULO_TIPO_DENUNCIA[i.denuncia.tipoDenuncia],
        ]}
        placeholderBusca="Buscar por número, motivo ou detalhe"
        ordenar={(a, b) =>
          Number(b.apelacao) - Number(a.apelacao) ||
          (PESO_PRIORIDADE[a.denuncia.prioridade ?? "BAIXA"] ?? 9) - (PESO_PRIORIDADE[b.denuncia.prioridade ?? "BAIXA"] ?? 9) ||
          a.denuncia.idDenuncia - b.denuncia.idDenuncia
        }
        filtros={
          <select aria-label="Filtrar" value={filtro} onChange={(e) => setFiltro(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
            <option value="">Tudo</option>
            <option value="APELACAO">Apelações</option>
            {Object.entries(ROTULO_PRIORIDADE).map(([v, r]) => (
              <option key={v} value={v}>
                Prioridade {r.toLowerCase()}
              </option>
            ))}
          </select>
        }
        filtrar={filtro ? (i) => (filtro === "APELACAO" ? i.apelacao : !i.apelacao && i.denuncia.prioridade === filtro) : undefined}
        chaveFiltro={filtro}
        renderItem={(i) => (
          <>
            {i.apelacao && (
              <p className="mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-brand-700">
                <Scale size={13} aria-hidden="true" /> Apelação do conteúdo denunciado
              </p>
            )}
            <ResumoDenuncia denuncia={i.denuncia} />
            <button type="button" onClick={() => abrir(i)} className={`${cls.btnPrimario} mt-3 !text-[13px]`}>
              <Gavel size={15} aria-hidden="true" /> {i.apelacao ? "Decidir apelação" : "Decidir"}
            </button>
          </>
        )}
        campos={[]}
        vazio={{}}
        paraFormulario={() => ({})}
        salvar={() => Promise.resolve()}
        podeEscrever={false}
        avisoSomenteLeitura={null}
      />

      <Modal
        aberto={!!decidindo}
        titulo={decidindo?.apelacao ? `Apelação da denúncia #${decidindo.denuncia.idDenuncia}` : `Denúncia #${decidindo?.denuncia.idDenuncia ?? ""}`}
        descricao={
          decidindo?.apelacao
            ? "A apelação pede a revisão de uma denúncia aceita. Aceitar mantém a decisão; rejeitar a reverte."
            : "Aceite se o conteúdo viola as regras e informe a ação tomada; rejeite se a denúncia não procede."
        }
        onFechar={() => setDecidindo(null)}
        ocupado={salvando}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) decidir();
          }}
        >
          {erro && <Alerta className="mb-3">{erro}</Alerta>}
          <fieldset disabled={salvando} className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Decisão">
              {(["ACEITA", "REJEITADA"] as const).map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] font-semibold ${
                    status === s ? "border-brand-300 bg-brand-50 text-brand-800" : "border-ink-100 text-ink-600"
                  }`}
                >
                  <input type="radio" name="decisao" checked={status === s} onChange={() => setStatus(s)} className="h-4 w-4 accent-brand-600" />
                  {s === "ACEITA" ? "Aceitar" : "Rejeitar"}
                </label>
              ))}
            </div>
            {status === "ACEITA" && (
              <div>
                <label htmlFor="decisao-acao" className={cls.label}>
                  Ação tomada sobre o conteúdo
                </label>
                <select id="decisao-acao" value={acao} onChange={(e) => setAcao(e.target.value)} className={`${cls.input} !bg-white`}>
                  {ACOES_DENUNCIA.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="decisao-justificativa" className={cls.label}>
                Justificativa *
              </label>
              <textarea
                id="decisao-justificativa"
                value={justificativa}
                maxLength={DECISAO_MAX}
                rows={4}
                onChange={(e) => setJustificativa(e.target.value)}
                className={`${cls.input} resize-y`}
              />
            </div>
          </fieldset>
          <div className="mt-5 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={() => setDecidindo(null)} disabled={salvando} className={cls.btnSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className={cls.btnPrimario}>
              {salvando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Gavel size={15} aria-hidden="true" />}
              Registrar decisão
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
