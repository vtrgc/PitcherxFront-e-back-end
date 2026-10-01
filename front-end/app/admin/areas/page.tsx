"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import Alerta from "../../components/ui/Alerta";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { Area } from "../../types/Area";
import { listarAreas, criarArea, atualizarArea, excluirArea } from "../../services/area.service";
import { listarSubAreas } from "../../services/subArea.service";
import { LIMITES, mesmoNome } from "../../lib/limites";

export default function AdminAreasPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setLoading(true);
    setErroCarregamento("");
    try {
      setAreas((await listarAreas()) ?? []);
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
    setNome("");
    setDescricao("");
  }

  function editar(area: Area) {
    setEditandoId(area.idArea);
    setNome(area.nomeArea);
    setDescricao(area.descricaoArea);
  }

  async function salvar() {
    if (!nome.trim() || !descricao.trim()) {
      setErro("Preencha nome e descrição.");
      return;
    }
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length > LIMITES.nomeArea) {
      setErro(`O nome pode ter no máximo ${LIMITES.nomeArea} caracteres.`);
      return;
    }
    // nome_area é UNIQUE no banco: um nome repetido seria recusado com erro 500.
    if (areas.some((a) => a.idArea !== editandoId && mesmoNome(a.nomeArea, nomeLimpo))) {
      setErro("Já existe uma área com esse nome.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const dados = { nomeArea: nomeLimpo, descricaoArea: descricao.trim() };
      if (editandoId) {
        await atualizarArea(editandoId, dados);
      } else {
        await criarArea(dados);
      }
      notificar(editandoId ? "Alterações salvas." : "Registro criado.", "sucesso");
      limparFormulario();
      await carregar();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar a área. Verifique se o nome já não está em uso."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    // Subáreas referenciam a área (sem cascade): o servidor recusaria a exclusão com erro 500.
    let emUso = 0;
    try {
      emUso = ((await listarSubAreas()) ?? []).filter((s) => s.area?.idArea === id).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar se a área está em uso. Tente novamente."));
      return;
    }
    if (emUso > 0) {
      notificar(`Esta área tem ${emUso} subárea${emUso === 1 ? "" : "s"} vinculada${emUso === 1 ? "" : "s"}. Exclua ou mova as subáreas antes de excluir a área.`);
      return;
    }
    if (!(await confirmar("Deseja realmente excluir esta área?", { titulo: "Confirmar exclusão", perigo: true }))) return;
    try {
      await excluirArea(id);
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
            <LayoutGrid size={19} />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">Áreas</h1>
            <p className="text-[0.8125rem] text-ink-500 mt-0.5">Grandes áreas de atuação usadas para organizar o conteúdo.</p>
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
        <h2 className="font-display text-[1.1875rem] font-bold leading-[1.4] text-ink-900">{editandoId ? "Editar área" : "Nova área"}</h2>

        {erro && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
            {erro}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={nome} maxLength={LIMITES.nomeArea} onChange={(e) => setNome(e.target.value)} placeholder="Nome da área" aria-label="Nome da área" className="w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed" />
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" aria-label="Descrição" className="w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed" />
        </div>

        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={salvando} className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700 hover:shadow-[0_2px_6px_-1px_rgba(107,33,224,0.35)]">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {editandoId ? "Salvar alterações" : "Adicionar área"}
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
        ) : erroCarregamento ? null : areas.length === 0 ? (
          <EmptyState icon={LayoutGrid} title="Nenhuma área cadastrada ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {areas.map((area) => (
              <li key={area.idArea} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-brand-50/60">
                <div>
                  <h3 className="font-display text-[14.5px] font-semibold text-ink-900">{area.nomeArea}</h3>
                  <p className="text-[0.8125rem] text-ink-500 mt-0.5">{area.descricaoArea}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => editar(area)} className="inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-brand-50 hover:text-brand-700" title="Editar" aria-label={`Editar ${area.nomeArea}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => excluir(area.idArea)} className="inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-[#FEF2F2] hover:text-[#DC2626]" title="Excluir" aria-label={`Excluir ${area.nomeArea}`}>
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
