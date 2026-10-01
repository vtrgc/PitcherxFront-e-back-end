"use client";

import { useEffect, useState } from "react";
import { FileSignature, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import Alerta from "../../components/ui/Alerta";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { Termo } from "../../types/Termo";
import { Contrato } from "../../types/Contrato";
import { listarTermos, criarTermo, atualizarTermo, excluirTermo } from "../../services/termo.service";
import { listarContratos } from "../../services/contrato.service";
import { LIMITES } from "../../lib/limites";

export default function AdminTermosPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [termos, setTermos] = useState<Termo[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contratoId, setContratoId] = useState<number | "">("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [termosData, contratosData] = await Promise.all([listarTermos(), listarContratos()]);
      setTermos(termosData ?? []);
      setContratos(contratosData ?? []);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os dados."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto]);

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setDescricao("");
    setContratoId("");
  }

  function editar(termo: Termo) {
    setEditandoId(termo.idTermo);
    setTitulo(termo.tituloTermo);
    setDescricao(termo.descricaoTermo);
    setContratoId(termo.contratoId);
  }

  function nomeContrato(id: number) {
    return contratos.find((c) => c.idContrato === id)?.tituloContrato || `Contrato #${id}`;
  }

  async function salvar() {
    if (!titulo.trim() || !descricao.trim() || !contratoId) {
      setErro("Preencha título, descrição e selecione o contrato.");
      return;
    }
    // titulo_termo e descricao_termo são VARCHAR(255) no banco.
    if (titulo.trim().length > LIMITES.tituloTermo || descricao.trim().length > LIMITES.descricaoTermo) {
      setErro(`Título e descrição podem ter no máximo ${LIMITES.descricaoTermo} caracteres cada.`);
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const dados = { tituloTermo: titulo.trim(), descricaoTermo: descricao.trim(), contratoId: Number(contratoId) };
      if (editandoId) {
        await atualizarTermo(editandoId, dados);
      } else {
        await criarTermo(dados);
      }
      notificar(editandoId ? "Alterações salvas." : "Registro criado.", "sucesso");
      limparFormulario();
      await carregar();
    } catch (error) {
      setErro(mensagemErro(error, "Erro ao salvar."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    if (!(await confirmar("Deseja realmente excluir este termo?", { titulo: "Confirmar exclusão", perigo: true }))) return;
    try {
      await excluirTermo(id);
      notificar("Registro excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir (o registro pode estar em uso)."));
    }
  }

  if (!pronto) {
    return (
      <>
        <div className="relative overflow-hidden bg-ink-100 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:animate-skeleton-sweep h-24 w-full rounded-2xl" />
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <FileSignature size={19} />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">Termos de contrato</h1>
            <p className="text-[0.8125rem] text-ink-500 mt-0.5">Cláusulas vinculadas a um contrato específico.</p>
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!salvando) salvar();
        }}
        className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 p-6"
      >
        <h2 className="font-display text-[1.1875rem] font-bold leading-[1.4] text-ink-900">{editandoId ? "Editar termo" : "Novo termo"}</h2>

        {erro && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">{erro}</div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={titulo} maxLength={LIMITES.tituloTermo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do termo" aria-label="Título do termo" className="w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed" />
          <select
            aria-label="Contrato"
            value={contratoId}
            onChange={(e) => setContratoId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed !rounded-xl"
          >
            <option value="">Selecione o contrato</option>
            {contratos.map((c) => (
              <option key={c.idContrato} value={c.idContrato}>
                {c.tituloContrato}
              </option>
            ))}
          </select>
          <textarea
            value={descricao}
            maxLength={LIMITES.descricaoTermo}
            aria-label="Descrição do termo"
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição do termo"
            rows={3}
            className="w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed resize-none md:col-span-2"
          />
        </div>

        <p className="mt-1.5 text-right text-[12px] text-ink-400" aria-live="polite">
          {descricao.length}/{LIMITES.descricaoTermo}
        </p>

        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={salvando} className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700 hover:shadow-[0_2px_6px_-1px_rgba(107,33,224,0.35)]">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {editandoId ? "Salvar alterações" : "Adicionar termo"}
          </button>
          {editandoId && (
            <button type="button" onClick={limparFormulario} className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-ink-100 text-ink-900 hover:bg-ink-200">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            <div className="relative overflow-hidden bg-ink-100 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:animate-skeleton-sweep h-5 w-full rounded-lg" />
            <div className="relative overflow-hidden bg-ink-100 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:animate-skeleton-sweep h-5 w-4/5 rounded-lg" />
          </div>
        ) : erroCarregamento ? null : termos.length === 0 ? (
          <EmptyState icon={FileSignature} title="Nenhum termo cadastrado ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {termos.map((termo) => (
              <li key={termo.idTermo} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-brand-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[14.5px] font-semibold text-ink-900">{termo.tituloTermo}</h3>
                    <span className="inline-flex items-center gap-[0.35rem] rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold leading-[1.5] bg-ink-100 text-ink-600 !py-0.5 !text-[10.5px]">{nomeContrato(termo.contratoId)}</span>
                  </div>
                  <p className="text-[0.8125rem] text-ink-500 mt-0.5 line-clamp-1">{termo.descricaoTermo}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => editar(termo)} className="inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-brand-50 hover:text-brand-700" title="Editar" aria-label={`Editar ${termo.tituloTermo}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => excluir(termo.idTermo)} className="inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-[#FEF2F2] hover:text-[#DC2626]" title="Excluir" aria-label={`Excluir ${termo.tituloTermo}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
