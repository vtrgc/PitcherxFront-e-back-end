"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Tags, Plus, Pencil, Trash2, Loader2, ArrowLeft } from "lucide-react";

import EmptyState from "./EmptyState";
import Alerta from "./ui/Alerta";
import { cls } from "./ui/estilos";
import { useFeedback } from "./ui/FeedbackProvider";
import { useAuth } from "../context/AuthContext";
import { mensagemErro } from "../lib/api";
import { TipoProjeto } from "../types/TipoProjeto";
import {
  listarTiposProjeto,
  criarTipoProjeto,
  atualizarTipoProjeto,
  excluirTipoProjeto,
} from "../services/tipoProjeto.service";
import { listarProjetos } from "../services/projeto.service";
import { mesmoNome } from "../lib/limites";

/**
 * Tipos de projeto: leitura para todos; cadastro/edição/exclusão só para ADMIN (regra do backend).
 * Usado em /tipos-projeto (usuários) e /admin/tipos-projeto (administração).
 */
export default function TiposProjetoView() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { notificar, confirmar } = useFeedback();

  const [tipos, setTipos] = useState<TipoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setTipos((await listarTiposProjeto()) ?? []);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os tipos de projeto."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setErro("");
  }

  function editar(tipo: TipoProjeto) {
    setEditandoId(tipo.idTipoProjeto);
    setNome(tipo.nomeTipoProjeto);
    setDescricao(tipo.descricaoTipoProjeto);
    setErro("");
    document.getElementById("tipo-nome")?.focus();
  }

  async function salvar() {
    if (!nome.trim() || !descricao.trim()) {
      setErro("Preencha nome e descrição.");
      return;
    }
    // nome_tipo_projeto é UNIQUE no banco: um nome repetido seria recusado com erro 500.
    if (tipos.some((t) => t.idTipoProjeto !== editandoId && mesmoNome(t.nomeTipoProjeto, nome))) {
      setErro("Já existe um tipo de projeto com esse nome.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const dados = { nomeTipoProjeto: nome.trim(), descricaoTipoProjeto: descricao.trim() };
      if (editandoId) await atualizarTipoProjeto(editandoId, dados);
      else await criarTipoProjeto(dados);
      notificar(editandoId ? "Tipo de projeto atualizado." : "Tipo de projeto criado.", "sucesso");
      limparFormulario();
      await carregar();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível salvar o tipo de projeto. Verifique se o nome já não está em uso."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(tipo: TipoProjeto) {
    // No banco, projeto.tipo_projeto_id tem ON DELETE CASCADE: excluir um tipo em uso
    // APAGARIA os projetos desse tipo (ou falharia com erro 500 se eles tiverem equipe/contratos).
    let emUso = 0;
    try {
      emUso = ((await listarProjetos()) ?? []).filter((p) => p.tipoProjetoId === tipo.idTipoProjeto).length;
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível verificar se o tipo está em uso. Tente novamente."));
      return;
    }
    if (emUso > 0) {
      notificar(
        `O tipo "${tipo.nomeTipoProjeto}" é usado por ${emUso} projeto${emUso === 1 ? "" : "s"}. Excluí-lo apagaria esses projetos; edite o tipo em vez de excluir.`
      );
      return;
    }
    const ok = await confirmar(`Excluir o tipo "${tipo.nomeTipoProjeto}"?`, { titulo: "Excluir tipo de projeto", perigo: true });
    if (!ok) return;
    try {
      await excluirTipoProjeto(tipo.idTipoProjeto);
      notificar("Tipo de projeto excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o tipo de projeto."));
    }
  }

  return (
    <>
      <Link
        href={isAdmin ? "/admin" : "/projetos"}
        className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {isAdmin ? "Voltar ao dashboard" : "Voltar para projetos"}
      </Link>

      <div className="pb-5 mb-1">
        <p className={cls.eyebrow}>Categorias</p>
        <h1 className={cls.h1}>Tipos de projeto</h1>
        <p className={`${cls.texto} mt-1.5 max-w-md`}>
          {isAdmin
            ? "Cadastre as categorias usadas ao publicar um novo projeto."
            : "Categorias usadas ao publicar um novo projeto. Apenas administradores podem criar ou editar tipos."}
        </p>
      </div>

      {isAdmin && (
        <form
          noValidate
          className={cls.composer}
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) salvar();
          }}
        >
          <h2 className={cls.h2}>{editandoId ? "Editar tipo de projeto" : "Novo tipo de projeto"}</h2>
          {erro && <Alerta className="mt-4">{erro}</Alerta>}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="tipo-nome" className={cls.label}>
                Nome
              </label>
              <input
                id="tipo-nome"
                value={nome}
                maxLength={120}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Desenvolvimento de Software"
                className={cls.input}
              />
            </div>
            <div>
              <label htmlFor="tipo-descricao" className={cls.label}>
                Descrição
              </label>
              <input
                id="tipo-descricao"
                value={descricao}
                maxLength={255}
                onChange={(e) => setDescricao(e.target.value)}
                className={cls.input}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={salvando} className={cls.btnPrimario}>
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {editandoId ? "Salvar alterações" : "Adicionar tipo"}
            </button>
            {editandoId && (
              <button type="button" onClick={limparFormulario} className={cls.btnSecundario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className="mt-2">
        {loading ? (
          <div className="space-y-3" aria-label="Carregando">
            <div className={`${cls.skeleton} h-5 w-full rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-4/5 rounded-lg`} />
          </div>
        ) : erroCarregamento ? null : tipos.length === 0 ? (
          <div className={cls.card}>
            <EmptyState icon={Tags} title="Nenhum tipo de projeto cadastrado ainda" />
          </div>
        ) : (
          <ul>
            {tipos.map((tipo) => (
              <li key={tipo.idTipoProjeto} className={`${cls.linha} flex items-start justify-between gap-3`}>
                <div className="min-w-0">
                  <h3 className="font-display text-[15px] font-bold text-ink-900 break-words">{tipo.nomeTipoProjeto}</h3>
                  <p className={`${cls.textoSuave} mt-1 break-words`}>{tipo.descricaoTipoProjeto}</p>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => editar(tipo)} className={cls.btnIcone} aria-label={`Editar ${tipo.nomeTipoProjeto}`}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => excluir(tipo)} className={cls.btnIconePerigo} aria-label={`Excluir ${tipo.nomeTipoProjeto}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
