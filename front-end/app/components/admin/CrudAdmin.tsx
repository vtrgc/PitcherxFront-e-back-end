"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X, type LucideIcon } from "lucide-react";

import EmptyState from "../EmptyState";
import Alerta from "../ui/Alerta";
import CampoBusca from "../ui/CampoBusca";
import Modal from "../ui/Modal";
import Paginacao from "../ui/Paginacao";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { usePaginacao } from "../../hook/usePaginacao";
import { mensagemErro } from "../../lib/api";
import { correspondeBusca } from "../../lib/listagem";

export interface CampoCrud<F> {
  nome: keyof F & string;
  rotulo: string;
  tipo?: "texto" | "textarea" | "select";
  opcoes?: { valor: string; rotulo: string }[];
  placeholder?: string;
  maxLength?: number;
  /** Ocupa as duas colunas do formulário (padrão para textarea). */
  largo?: boolean;
  ajuda?: ReactNode;
}

interface Props<T, F extends Record<string, string>> {
  titulo: string;
  descricao: ReactNode;
  icone: LucideIcon;
  /** Ex.: "área" — usado em "Cadastrar área", "Editar área". */
  rotuloSingular: string;
  /** Ex.: "áreas" — usado na paginação e no estado vazio. */
  rotuloPlural: string;
  /** Concordância das mensagens ("área cadastrada" × "termo cadastrado"). */
  feminino?: boolean;
  listar: () => Promise<T[]>;
  idDe: (item: T) => number;
  /** Valores usados pela busca (todas as palavras do termo precisam aparecer). */
  textoBusca: (item: T) => unknown[];
  placeholderBusca: string;
  /** Conteúdo da linha da lista (título, detalhes...). */
  renderItem: (item: T) => ReactNode;
  campos: CampoCrud<F>[];
  vazio: F;
  paraFormulario: (item: T) => F;
  /** Validação antes de enviar: devolve a mensagem de erro ou null. */
  validar?: (form: F, itens: T[], editandoId: number | null) => string | null;
  salvar: (form: F, id: number | null) => Promise<unknown>;
  excluir?: (item: T) => Promise<unknown>;
  /** Checagem antes de excluir: devolve uma mensagem que impede a exclusão, ou null. */
  antesDeExcluir?: (item: T) => Promise<string | null>;
  rotuloExcluir?: (item: T) => string;
  /** false: oculta cadastrar/editar (ex.: o backend não aceita a role ADMIN no POST/PUT). */
  podeEscrever?: boolean;
  /** Aviso exibido quando `podeEscrever` é false. */
  avisoSomenteLeitura?: ReactNode;
  /** Ordenação da lista (padrão: mais recentes primeiro, pelo id). */
  ordenar?: (a: T, b: T) => number;
  /** Mensagem padrão quando o servidor responde 5xx ao salvar. */
  erroSalvar?: string;
  /** Filtros extras ao lado da busca. */
  filtros?: ReactNode;
  /** Filtro adicional aplicado à lista (combinado com a busca). */
  filtrar?: (item: T) => boolean;
  /** Chave que muda quando `filtrar` muda (para voltar à página 1). */
  chaveFiltro?: string;
  /** Recarrega quando muda (ex.: depois de carregar opções de selects). */
  dependencias?: unknown[];
}

/**
 * Tela padrão de cadastro da administração: cabeçalho com "Cadastrar", modal de cadastro e
 * edição, busca, paginação, confirmação de exclusão e estados de carregamento, erro e vazio.
 *
 * Os endpoints de cadastro do backend devolvem a lista inteira (sem Page nem filtros), então a
 * busca e a paginação acontecem no navegador (ver lib/listagem).
 */
export default function CrudAdmin<T, F extends Record<string, string>>(props: Props<T, F>) {
  const {
    titulo,
    descricao,
    icone: Icone,
    rotuloSingular,
    rotuloPlural,
    feminino = false,
    listar,
    idDe,
    textoBusca,
    placeholderBusca,
    renderItem,
    campos,
    vazio,
    paraFormulario,
    validar,
    salvar,
    excluir,
    antesDeExcluir,
    rotuloExcluir,
    podeEscrever = true,
    avisoSomenteLeitura,
    ordenar,
    erroSalvar,
    filtros,
    filtrar,
    chaveFiltro = "",
  } = props;
  const { pronto } = useRequireAdmin();
  const a = feminino ? "a" : "o";
  const nenhum = feminino ? "Nenhuma" : "Nenhum";
  const { notificar, confirmar } = useFeedback();

  const [itens, setItens] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<F>(vazio);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setItens((await listar()) ?? []);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, `Não foi possível carregar ${rotuloPlural}.`));
    } finally {
      setLoading(false);
    }
  }, [listar, rotuloPlural]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const filtrados = useMemo(() => {
    const lista = itens.filter((item) => correspondeBusca(busca, ...textoBusca(item)) && (!filtrar || filtrar(item)));
    return lista.sort(ordenar ?? ((a, b) => idDe(b) - idDe(a)));
  }, [itens, busca, textoBusca, filtrar, ordenar, idDe]);

  const paginacao = usePaginacao(filtrados, { chaveReinicio: `${busca}|${chaveFiltro}` });

  function abrir(item?: T) {
    setEditandoId(item ? idDe(item) : null);
    setForm(item ? paraFormulario(item) : vazio);
    setErroForm("");
    setModalAberto(true);
  }

  function fechar() {
    if (salvando) return;
    setModalAberto(false);
    setEditandoId(null);
    setErroForm("");
  }

  async function enviar() {
    const erro = validar?.(form, itens, editandoId) ?? null;
    if (erro) {
      setErroForm(erro);
      return;
    }
    setErroForm("");
    setSalvando(true);
    try {
      await salvar(form, editandoId);
      notificar(`${capitalizar(rotuloSingular)} ${editandoId ? "atualizad" : "cadastrad"}${a} com sucesso.`, "sucesso");
      setModalAberto(false);
      setEditandoId(null);
      await carregar();
    } catch (error) {
      setErroForm(mensagemErro(error, erroSalvar ?? `Não foi possível salvar ${a} ${rotuloSingular}.`));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(item: T) {
    if (!excluir) return;
    const id = idDe(item);
    setExcluindoId(id);
    try {
      if (antesDeExcluir) {
        let bloqueio: string | null = null;
        try {
          bloqueio = await antesDeExcluir(item);
        } catch (error) {
          notificar(mensagemErro(error, `Não foi possível verificar se ${a} ${rotuloSingular} está em uso. Tente novamente.`));
          return;
        }
        if (bloqueio) {
          notificar(bloqueio);
          return;
        }
      }
      const nome = rotuloExcluir?.(item);
      const mensagem = nome ? `Deseja realmente excluir "${nome}"? Essa ação não pode ser desfeita.` : `Deseja realmente excluir este registro?`;
      if (!(await confirmar(mensagem, { titulo: `Excluir ${rotuloSingular}`, confirmarLabel: "Excluir", perigo: true }))) return;
      await excluir(item);
      notificar(`${capitalizar(rotuloSingular)} excluíd${a}.`, "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir (o registro pode estar em uso)."));
    } finally {
      setExcluindoId(null);
    }
  }

  if (!pronto) {
    return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;
  }

  return (
    <>
      <div className={`${cls.card} flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icone size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[17px] font-bold text-ink-900">{titulo}</h1>
            <div className="mt-0.5 text-[0.8125rem] text-ink-500">{descricao}</div>
          </div>
        </div>
        {podeEscrever && (
          <button type="button" onClick={() => abrir()} className={cls.btnPrimario}>
            <Plus size={16} aria-hidden="true" /> Cadastrar
          </button>
        )}
      </div>

      {!podeEscrever && avisoSomenteLeitura && <Alerta variante="info">{avisoSomenteLeitura}</Alerta>}

      <CampoBusca valor={busca} onChange={setBusca} placeholder={placeholderBusca}>
        {filtros}
      </CampoBusca>

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className={`${cls.card} overflow-hidden`}>
        {loading ? (
          <div className="space-y-3 p-6" aria-label={`Carregando ${rotuloPlural}`}>
            <div className={`${cls.skeleton} h-5 w-full rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-4/5 rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-3/5 rounded-lg`} />
          </div>
        ) : erroCarregamento ? null : itens.length === 0 ? (
          <EmptyState
            icon={Icone}
            title={`${nenhum} ${rotuloSingular} cadastrad${a} ainda`}
            action={
              podeEscrever ? (
                <button type="button" onClick={() => abrir()} className={cls.btnPrimario}>
                  <Plus size={16} aria-hidden="true" /> Cadastrar {rotuloSingular}
                </button>
              ) : undefined
            }
          />
        ) : filtrados.length === 0 ? (
          <EmptyState icon={Icone} title="Nenhum resultado encontrado" description="Tente buscar por outro termo ou limpe os filtros." />
        ) : (
          <>
            <ul className="divide-y divide-ink-100">
              {paginacao.itens.map((item) => {
                const id = idDe(item);
                return (
                  <li key={id} className="flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-brand-50/60 sm:px-6">
                    <div className="min-w-0 flex-1">{renderItem(item)}</div>
                    <div className="flex shrink-0 items-center gap-1">
                      {podeEscrever && (
                        <button type="button" onClick={() => abrir(item)} className={cls.btnIcone} title="Editar" aria-label={`Editar ${rotuloExcluir?.(item) ?? rotuloSingular}`}>
                          <Pencil size={16} />
                        </button>
                      )}
                      {excluir && (
                        <button
                          type="button"
                          onClick={() => remover(item)}
                          disabled={excluindoId === id}
                          className={cls.btnIconePerigo}
                          title="Excluir"
                          aria-label={`Excluir ${rotuloExcluir?.(item) ?? rotuloSingular}`}
                        >
                          {excluindoId === id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Paginacao
              pagina={paginacao.pagina}
              totalPaginas={paginacao.totalPaginas}
              total={paginacao.total}
              inicio={paginacao.inicio}
              fim={paginacao.fim}
              tamanho={paginacao.tamanho}
              onPagina={paginacao.irPara}
              onTamanho={paginacao.setTamanho}
              rotulo={rotuloPlural}
            />
          </>
        )}
      </div>

      <Modal
        aberto={modalAberto}
        titulo={editandoId ? `Editar ${rotuloSingular}` : `Cadastrar ${rotuloSingular}`}
        onFechar={fechar}
        ocupado={salvando}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) enviar();
          }}
        >
          {erroForm && <Alerta className="mb-4">{erroForm}</Alerta>}
          <fieldset disabled={salvando} className="grid gap-4 sm:grid-cols-2">
            {campos.map((campo) => {
              const id = `crud-${campo.nome}`;
              const valor = form[campo.nome] ?? "";
              const alterar = (v: string) => setForm((f) => ({ ...f, [campo.nome]: v }));
              const largo = campo.largo ?? (campo.tipo === "textarea" || campos.length === 1);
              return (
                <div key={campo.nome} className={largo ? "sm:col-span-2" : undefined}>
                  <label htmlFor={id} className={cls.label}>
                    {campo.rotulo}
                  </label>
                  {campo.tipo === "textarea" ? (
                    <textarea
                      id={id}
                      value={valor}
                      maxLength={campo.maxLength}
                      rows={4}
                      placeholder={campo.placeholder}
                      onChange={(e) => alterar(e.target.value)}
                      className={`${cls.input} resize-y`}
                    />
                  ) : campo.tipo === "select" ? (
                    <select id={id} value={valor} onChange={(e) => alterar(e.target.value)} className={`${cls.input} !bg-white`}>
                      <option value="">Selecione</option>
                      {(campo.opcoes ?? []).map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      value={valor}
                      maxLength={campo.maxLength}
                      placeholder={campo.placeholder}
                      onChange={(e) => alterar(e.target.value)}
                      className={cls.input}
                    />
                  )}
                  {campo.ajuda && <p className="mt-1 text-[12px] text-ink-400">{campo.ajuda}</p>}
                  {campo.maxLength && campo.tipo === "textarea" && (
                    <p className="mt-1 text-right text-[11.5px] text-ink-400">
                      {valor.length}/{campo.maxLength}
                    </p>
                  )}
                </div>
              );
            })}
          </fieldset>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={fechar} disabled={salvando} className={cls.btnSecundario}>
              <X size={15} aria-hidden="true" /> Cancelar
            </button>
            <button type="submit" disabled={salvando} className={cls.btnPrimario}>
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} aria-hidden="true" />}
              {editandoId ? "Salvar alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
