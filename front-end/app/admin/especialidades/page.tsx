"use client";

import { useEffect, useState } from "react";
import { Award, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import Alerta from "../../components/ui/Alerta";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { Especialidade } from "../../types/PerfilUsuario";
import {
  listarEspecialidades,
  criarEspecialidade,
  atualizarEspecialidade,
  excluirEspecialidade,
  listarPerfisUsuario,
} from "../../services/perfilUsuario.service";
import { LIMITES, mesmoNome } from "../../lib/limites";

export default function AdminEspecialidadesPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setLoading(true);
    setErroCarregamento("");
    try {
      setEspecialidades((await listarEspecialidades()) ?? []);
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
  }

  function editar(esp: Especialidade) {
    setEditandoId(esp.idEspecialidade);
    setNome(esp.nomeEspecialidade);
  }

  async function salvar() {
    if (!nome.trim()) {
      setErro("Preencha o nome da especialidade.");
      return;
    }
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length > LIMITES.nomeEspecialidade) {
      setErro(`O nome pode ter no máximo ${LIMITES.nomeEspecialidade} caracteres.`);
      return;
    }
    // nome_especialidade é UNIQUE no banco: um nome repetido seria recusado com erro 500.
    if (especialidades.some((e) => e.idEspecialidade !== editandoId && mesmoNome(e.nomeEspecialidade, nomeLimpo))) {
      setErro("Já existe uma especialidade com esse nome.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const dados = { nomeEspecialidade: nomeLimpo };
      if (editandoId) {
        await atualizarEspecialidade(editandoId, dados);
      } else {
        await criarEspecialidade(dados);
      }
      notificar(editandoId ? "Alterações salvas." : "Registro criado.", "sucesso");
      limparFormulario();
      await carregar();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar a especialidade. Verifique se o nome já não está em uso."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    // No banco, perfil_usuario.especialidade_id tem ON DELETE CASCADE: excluir uma
    // especialidade em uso APAGARIA os perfis profissionais de quem a escolheu.
    let emUso = 0;
    try {
      emUso = ((await listarPerfisUsuario()) ?? []).filter((p) => p.especialidade?.idEspecialidade === id).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar se a especialidade está em uso. Tente novamente."));
      return;
    }
    if (emUso > 0) {
      notificar(
        `Esta especialidade está em uso por ${emUso} perfil${emUso === 1 ? "" : "s"}. Excluí-la apagaria esses perfis profissionais; renomeie-a em vez de excluir.`
      );
      return;
    }
    if (!(await confirmar("Deseja realmente excluir esta especialidade?", { titulo: "Confirmar exclusão", perigo: true }))) return;
    try {
      await excluirEspecialidade(id);
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
            <Award size={19} />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">Especialidades</h1>
            <p className="text-[0.8125rem] text-ink-500 mt-0.5">Especialidades profissionais escolhidas no cadastro de perfil.</p>
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
        <h2 className="font-display text-[1.1875rem] font-bold leading-[1.4] text-ink-900">{editandoId ? "Editar especialidade" : "Nova especialidade"}</h2>

        {erro && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">{erro}</div>
        )}

        <div className="mt-4">
          <input value={nome} maxLength={LIMITES.nomeEspecialidade} onChange={(e) => setNome(e.target.value)} placeholder="Nome da especialidade (ex: Backend, UX Design)" aria-label="Nome da especialidade (ex: Backend, UX Design)" className="w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed" />
        </div>

        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={salvando} className="inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700 hover:shadow-[0_2px_6px_-1px_rgba(107,33,224,0.35)]">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {editandoId ? "Salvar alterações" : "Adicionar especialidade"}
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
        ) : erroCarregamento ? null : especialidades.length === 0 ? (
          <EmptyState icon={Award} title="Nenhuma especialidade cadastrada ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {especialidades.map((esp) => (
              <li key={esp.idEspecialidade} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-brand-50/60">
                <h3 className="font-display text-[14.5px] font-semibold text-ink-900">{esp.nomeEspecialidade}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => editar(esp)} className="inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-brand-50 hover:text-brand-700" title="Editar" aria-label={`Editar ${esp.nomeEspecialidade}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => excluir(esp.idEspecialidade)} className="inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-[#FEF2F2] hover:text-[#DC2626]" title="Excluir" aria-label={`Excluir ${esp.nomeEspecialidade}`}>
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
