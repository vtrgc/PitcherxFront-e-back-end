"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X, type LucideIcon } from "lucide-react";

import EmptyState from "../EmptyState";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { useAuth } from "../../context/AuthContext";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";

export interface TermoSimples {
  id: number;
  titulo: string;
  descricao: string;
}

interface Props {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  listar: () => Promise<TermoSimples[]>;
  criar: (dados: { titulo: string; descricao: string }) => Promise<unknown>;
  atualizar: (id: number, dados: { titulo: string; descricao: string }) => Promise<unknown>;
  excluir: (id: number) => Promise<unknown>;
}

/**
 * Cadastro de termos com título e descrição (termos de postagem e de vínculo).
 *
 * Regra do backend: GET e DELETE para ADMIN; POST/PUT somente para as roles USUARIO/EMPRESA.
 * Um administrador que também tenha uma dessas roles (Admin → Usuários → adicionar perfil,
 * seguido de novo login) pode cadastrar e editar — a tela libera o formulário conforme as
 * roles presentes no token da sessão.
 */
export default function CrudTermoSimples({ titulo, descricao, icone: Icone, listar, criar, atualizar, excluir }: Props) {
  const { pronto } = useRequireAdmin();
  const { usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const podeEscrever = !!usuario?.roles.some((r) => r === "USUARIO" || r === "EMPRESA");

  const [termos, setTermos] = useState<TermoSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [campoTitulo, setCampoTitulo] = useState("");
  const [campoDescricao, setCampoDescricao] = useState("");
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setTermos((await listar()) ?? []);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os termos."));
    } finally {
      setLoading(false);
    }
  }, [listar]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  function abrir(termo?: TermoSimples) {
    setEditandoId(termo?.id ?? null);
    setCampoTitulo(termo?.titulo ?? "");
    setCampoDescricao(termo?.descricao ?? "");
    setErroForm("");
    setMostrarForm(true);
  }

  function fechar() {
    setMostrarForm(false);
    setEditandoId(null);
    setErroForm("");
  }

  async function salvar() {
    if (!campoTitulo.trim() || !campoDescricao.trim()) {
      setErroForm("Preencha o título e a descrição.");
      return;
    }
    setSalvando(true);
    setErroForm("");
    try {
      const dados = { titulo: campoTitulo.trim(), descricao: campoDescricao.trim() };
      if (editandoId) await atualizar(editandoId, dados);
      else await criar(dados);
      notificar(editandoId ? "Termo atualizado." : "Termo criado.", "sucesso");
      fechar();
      await carregar();
    } catch (error) {
      setErroForm(mensagemErro(error, "Não foi possível salvar o termo."));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(termo: TermoSimples) {
    if (!(await confirmar(`Excluir o termo "${termo.titulo}"?`, { titulo: "Excluir termo", perigo: true }))) return;
    try {
      await excluir(termo.id);
      notificar("Termo excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o termo."));
    }
  }

  if (!pronto) {
    return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;
  }

  return (
    <>
      <div className={`${cls.card} flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icone size={19} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">{titulo}</h1>
            <p className="text-[0.8125rem] text-ink-500 mt-0.5">{descricao}</p>
          </div>
        </div>
        {podeEscrever && !mostrarForm && (
          <button type="button" onClick={() => abrir()} className={`${cls.btnPrimario} !text-[13px]`}>
            <Plus size={15} aria-hidden="true" /> Novo termo
          </button>
        )}
      </div>

      {!podeEscrever && (
        <Alerta variante="info">
          O servidor só permite cadastrar e editar estes termos a contas com o perfil Usuário ou Empresa. Para cadastrar, adicione um desses
          perfis à sua conta em Admin → Usuários e entre novamente. Como administrador, você pode consultar e excluir.
        </Alerta>
      )}

      {mostrarForm && podeEscrever && (
        <form
          noValidate
          className={`${cls.card} space-y-4 p-4 sm:p-5`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) salvar();
          }}
        >
          <h2 className={cls.h2}>{editandoId ? "Editar termo" : "Novo termo"}</h2>
          {erroForm && <Alerta>{erroForm}</Alerta>}
          <div>
            <label htmlFor="termo-titulo" className={cls.label}>
              Título
            </label>
            <input id="termo-titulo" value={campoTitulo} maxLength={255} onChange={(e) => setCampoTitulo(e.target.value)} className={cls.input} />
          </div>
          <div>
            <label htmlFor="termo-descricao" className={cls.label}>
              Descrição
            </label>
            <textarea
              id="termo-descricao"
              value={campoDescricao}
              maxLength={2000}
              rows={4}
              onChange={(e) => setCampoDescricao(e.target.value)}
              className={`${cls.input} resize-y`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={salvando} className={cls.btnPrimario}>
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
            </button>
            <button type="button" onClick={fechar} disabled={salvando} className={cls.btnSecundario}>
              <X size={15} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className={`${cls.card} overflow-hidden`}>
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Carregando">
            <div className={`${cls.skeleton} h-5 w-full rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-4/5 rounded-lg`} />
          </div>
        ) : erroCarregamento ? null : termos.length === 0 ? (
          <EmptyState icon={Icone} title="Nenhum termo cadastrado ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {termos.map((termo) => (
              <li key={termo.id} className="flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-brand-50/60 sm:px-6">
                <div className="min-w-0">
                  <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{termo.titulo}</h3>
                  <p className="text-[0.8125rem] text-ink-500 mt-0.5 whitespace-pre-line break-words">{termo.descricao}</p>
                </div>
                <div className="flex shrink-0 items-center">
                  {podeEscrever && (
                    <button type="button" onClick={() => abrir(termo)} className={cls.btnIcone} aria-label={`Editar ${termo.titulo}`}>
                      <Pencil size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => remover(termo)} className={cls.btnIconePerigo} aria-label={`Excluir ${termo.titulo}`}>
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
