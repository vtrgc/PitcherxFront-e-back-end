"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, ScrollText, Trash2, X } from "lucide-react";

import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import { mesmoNome } from "../../lib/limites";
import {
  atualizarTermoVinculo,
  criarTermoVinculo,
  excluirTermoVinculo,
  listarTermosVinculoDoProjeto,
} from "../../services/termoVinculo.service";
import { TermoVinculo } from "../../types/TermoVinculo";

interface Formulario {
  titulo: string;
  descricao: string;
  obrigatorio: boolean;
}

const VAZIO: Formulario = { titulo: "", descricao: "", obrigatorio: true };

/**
 * Termos de vínculo do projeto: o que um visitante precisa aceitar para ver o projeto.
 * `podeEditar` (criador): cadastrar, editar e excluir (POST /termo-vinculo/projeto/{id},
 * PUT e DELETE /termo-vinculo/{id}). Os demais membros só consultam.
 */
export default function TermosVinculoProjeto({ projetoId, podeEditar, podeExcluir }: { projetoId: number; podeEditar: boolean; podeExcluir: boolean }) {
  const { notificar, confirmar } = useFeedback();
  const [termos, setTermos] = useState<TermoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [form, setForm] = useState<Formulario | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento("");
    try {
      setTermos(((await listarTermosVinculoDoProjeto(projetoId)) ?? []).sort((a, b) => a.idTermoVinculo - b.idTermoVinculo));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os termos de vínculo."));
    } finally {
      setCarregando(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrir(termo?: TermoVinculo) {
    setErro("");
    setEditandoId(termo?.idTermoVinculo ?? null);
    setForm(termo ? { titulo: termo.tituloTermoVinculo, descricao: termo.descricaoTermoVinculo, obrigatorio: !!termo.obrigatorio } : { ...VAZIO });
  }

  function fechar() {
    setForm(null);
    setEditandoId(null);
    setErro("");
  }

  async function salvar() {
    if (!form) return;
    const titulo = form.titulo.trim();
    const descricao = form.descricao.trim();
    if (!titulo || !descricao) {
      setErro("Preencha o título e a descrição do termo.");
      return;
    }
    if (termos.some((t) => t.idTermoVinculo !== editandoId && mesmoNome(t.tituloTermoVinculo, titulo))) {
      setErro("Este projeto já tem um termo com esse título.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const dados = { tituloTermoVinculo: titulo, descricaoTermoVinculo: descricao, obrigatorio: form.obrigatorio };
      if (editandoId) {
        const atualizado = await atualizarTermoVinculo(editandoId, dados);
        setTermos((lista) => lista.map((t) => (t.idTermoVinculo === editandoId ? atualizado : t)));
        notificar("Termo atualizado.", "sucesso");
      } else {
        const criado = await criarTermoVinculo(projetoId, dados);
        setTermos((lista) => [...lista, criado]);
        notificar("Termo cadastrado.", "sucesso");
      }
      fechar();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar o termo."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(termo: TermoVinculo) {
    const ok = await confirmar(`Excluir o termo "${termo.tituloTermoVinculo}"? Quem já aceitou continua com acesso ao projeto.`, {
      titulo: "Excluir termo de vínculo",
      perigo: true,
    });
    if (!ok) return;
    setExcluindoId(termo.idTermoVinculo);
    try {
      await excluirTermoVinculo(termo.idTermoVinculo);
      setTermos((lista) => lista.filter((t) => t.idTermoVinculo !== termo.idTermoVinculo));
      notificar("Termo excluído.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o termo."));
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-termos-vinculo">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-termos-vinculo" className={cls.eyebrow}>
          <ScrollText size={14} aria-hidden="true" />
          Termos de vínculo {termos.length > 0 && `(${termos.length})`}
        </h2>
        {podeEditar && !form && (
          <button type="button" onClick={() => abrir()} className={`${cls.btnSecundario} !text-[13px]`}>
            <Plus size={15} aria-hidden="true" /> Novo termo
          </button>
        )}
      </div>
      <p className="mt-2 text-[13px] text-ink-500">
        {podeEditar
          ? "Condições que um visitante precisa aceitar para acessar o projeto. Termos obrigatórios bloqueiam o acesso até serem aceitos."
          : "Condições aceitas por quem acompanha este projeto."}
      </p>

      {form && podeEditar && (
        <form
          noValidate
          className={`${cls.composer} mt-4`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) salvar();
          }}
        >
          {erro && <Alerta className="mb-4">{erro}</Alerta>}
          <div className="space-y-4">
            <div>
              <label htmlFor="termo-vinculo-titulo" className={cls.label}>
                Título
              </label>
              <input
                id="termo-vinculo-titulo"
                value={form.titulo}
                maxLength={255}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Confidencialidade"
                className={cls.input}
              />
            </div>
            <div>
              <label htmlFor="termo-vinculo-descricao" className={cls.label}>
                Descrição
              </label>
              <textarea
                id="termo-vinculo-descricao"
                value={form.descricao}
                maxLength={2000}
                rows={3}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Explique a condição que a pessoa está aceitando."
                className={`${cls.input} resize-y`}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-ink-800">
              <input
                type="checkbox"
                checked={form.obrigatorio}
                onChange={(e) => setForm({ ...form, obrigatorio: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              Aceite obrigatório para acessar o projeto
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" disabled={salvando} className={`${cls.btnPrimario} !text-[13px]`}>
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} aria-hidden="true" />}
              {editandoId ? "Salvar termo" : "Cadastrar termo"}
            </button>
            <button type="button" onClick={fechar} disabled={salvando} className={`${cls.btnSecundario} !text-[13px]`}>
              <X size={15} aria-hidden="true" /> Cancelar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <div className={`${cls.skeleton} mt-4 h-14 w-full rounded-xl`} aria-label="Carregando termos" />
      ) : erroCarregamento ? (
        <Alerta className="mt-4" onTentarNovamente={carregar}>
          {erroCarregamento}
        </Alerta>
      ) : termos.length === 0 ? (
        <p className="mt-4 rounded-xl bg-ink-25 px-4 py-3 text-[13px] text-ink-500">
          {podeEditar
            ? "Nenhum termo cadastrado: qualquer pessoa libera o acesso apenas confirmando a entrada."
            : "O criador não definiu termos para este projeto."}
        </p>
      ) : (
        <ul className="mt-3">
          {termos.map((termo) => (
            <li key={termo.idTermoVinculo} className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 py-4 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{termo.tituloTermoVinculo}</h3>
                  <span className={termo.obrigatorio ? cls.chip : cls.chipInativo}>{termo.obrigatorio ? "Obrigatório" : "Opcional"}</span>
                </div>
                <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-relaxed text-ink-600">{termo.descricaoTermoVinculo}</p>
              </div>
              {(podeEditar || podeExcluir) && (
                <div className="flex items-center gap-1">
                  {podeEditar && (
                    <button type="button" onClick={() => abrir(termo)} className={cls.btnIcone} aria-label={`Editar termo ${termo.tituloTermoVinculo}`}>
                      <Pencil size={15} />
                    </button>
                  )}
                  {podeExcluir && (
                    <button
                      type="button"
                      onClick={() => excluir(termo)}
                      disabled={excluindoId === termo.idTermoVinculo}
                      className={cls.btnIconePerigo}
                      aria-label={`Excluir termo ${termo.tituloTermoVinculo}`}
                    >
                      {excluindoId === termo.idTermoVinculo ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
