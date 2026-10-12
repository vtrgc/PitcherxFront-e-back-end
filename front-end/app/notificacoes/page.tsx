"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, RefreshCw, Users } from "lucide-react";

import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import NotificacaoCard, { RespostaSolicitacao } from "../components/NotificacaoCard";
import NotificacaoAtividadeCard from "../components/NotificacaoAtividadeCard";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { useAuth } from "../context/AuthContext";
import { useNotificacoes } from "../context/NotificacoesContext";
import { ApiError, mensagemErro } from "../lib/api";
import {
  aceitarConexao,
  contarSolicitacoesPendentes,
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  recusarConexao,
} from "../services/conexao.service";
import { Notificacao } from "../types/Conexao";
import { NotificacaoAtividade } from "../lib/atividade";

const POR_PAGINA = 20;
type Filtro = "todas" | "naoLidas" | "atividade" | "conexoes";

/** Item da lista unificada: notificação do servidor (conexões) ou de atividade (front). */
type Item =
  | { origem: "servidor"; chave: string; data: string | null; lida: boolean; n: Notificacao }
  | { origem: "atividade"; chave: string; data: string | null; lida: boolean; a: NotificacaoAtividade };

function ordenar(a: Item, b: Item) {
  // Mais recentes primeiro; o histórico inicial (sem horário) vai para o fim.
  if (a.data && b.data) return b.data.localeCompare(a.data);
  if (a.data) return -1;
  if (b.data) return 1;
  return 0;
}

/**
 * Notificações do usuário logado:
 *  - do servidor (GET /conexao/notificacoes, paginado): solicitações e respostas de conexão,
 *    com marcar como lida e resposta direta às solicitações;
 *  - de atividade (geradas no front — ver lib/atividade): curtidas, comentários, respostas
 *    e votos recebidos.
 */
export default function NotificacoesPage() {
  const { usuario, isAdmin } = useAuth();
  const { notificar } = useFeedback();
  const { naoLidas, atualizarNaoLidas, definirNaoLidas, atividade, verificarAgora, marcarAtividadeLida } = useNotificacoes();

  const [itens, setItens] = useState<Notificacao[]>([]);
  const [pagina, setPagina] = useState(0);
  const [ultima, setUltima] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [marcando, setMarcando] = useState<Set<number>>(new Set());
  const [respondendo, setRespondendo] = useState<Set<number>>(new Set());
  const [respostas, setRespostas] = useState<Record<number, RespostaSolicitacao>>({});
  const [pendentes, setPendentes] = useState<number | null>(null);

  const buscar = useCallback(
    async (p: number) => {
      setCarregando(true);
      setErro("");
      try {
        const resultado = await listarNotificacoes(p, POR_PAGINA);
        setItens((atual) => {
          const base = p === 0 ? [] : atual;
          const ids = new Set(base.map((n) => n.idNotificacao));
          return [...base, ...resultado.itens.filter((n) => !ids.has(n.idNotificacao))];
        });
        setPagina(p);
        setUltima(resultado.ultima);
        if (p === 0) atualizarNaoLidas();
      } catch (error) {
        setErro(mensagemErro(error, "Não foi possível carregar as notificações."));
      } finally {
        setCarregando(false);
      }
    },
    [atualizarNaoLidas]
  );

  useEffect(() => {
    buscar(0);
    verificarAgora();
  }, [buscar, verificarAgora]);

  useEffect(() => {
    if (!usuario || isAdmin) return;
    contarSolicitacoesPendentes(usuario.idUsuario)
      .then(setPendentes)
      .catch(() => setPendentes(null));
  }, [usuario, isAdmin, respostas]);

  const todos = useMemo<Item[]>(
    () =>
      [
        ...itens.map((n): Item => ({ origem: "servidor", chave: `s-${n.idNotificacao}`, data: n.dataCriacao, lida: n.lida, n })),
        ...atividade.map((a): Item => ({ origem: "atividade", chave: `a-${a.id}`, data: a.data, lida: a.lida, a })),
      ].sort(ordenar),
    [itens, atividade]
  );
  const visiveis = useMemo(
    () =>
      todos.filter((i) =>
        filtro === "naoLidas" ? !i.lida : filtro === "atividade" ? i.origem === "atividade" : filtro === "conexoes" ? i.origem === "servidor" : true
      ),
    [todos, filtro]
  );

  function alternar(conjunto: Set<number>, id: number, ativo: boolean) {
    const novo = new Set(conjunto);
    if (ativo) novo.add(id);
    else novo.delete(id);
    return novo;
  }

  async function marcarLida(n: Notificacao, silencioso = false) {
    if (n.lida) return;
    setMarcando((s) => alternar(s, n.idNotificacao, true));
    try {
      await marcarNotificacaoComoLida(n.idNotificacao);
      setItens((atual) => atual.map((x) => (x.idNotificacao === n.idNotificacao ? { ...x, lida: true } : x)));
      definirNaoLidas((v) => v - 1);
    } catch (error) {
      if (!silencioso) notificar(mensagemErro(error, "Não foi possível marcar a notificação como lida."));
    } finally {
      setMarcando((s) => alternar(s, n.idNotificacao, false));
    }
  }

  async function marcarTodas() {
    setMarcandoTodas(true);
    try {
      marcarAtividadeLida();
      if (itens.some((n) => !n.lida) || (naoLidas ?? 0) > atividade.filter((a) => !a.lida).length) {
        await marcarTodasNotificacoesComoLidas();
      }
      setItens((atual) => atual.map((x) => ({ ...x, lida: true })));
      definirNaoLidas(0);
      notificar("Todas as notificações foram marcadas como lidas.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível marcar as notificações como lidas."));
    } finally {
      setMarcandoTodas(false);
    }
  }

  async function responder(n: Notificacao, aceitar: boolean) {
    const id = n.referenciaId;
    if (typeof id !== "number") return;
    setRespondendo((s) => alternar(s, n.idNotificacao, true));
    try {
      if (aceitar) await aceitarConexao(id);
      else await recusarConexao(id);
      setRespostas((r) => ({ ...r, [n.idNotificacao]: aceitar ? "aceita" : "recusada" }));
      notificar(aceitar ? "Solicitação aceita." : "Solicitação recusada.", "sucesso");
      marcarLida(n, true);
    } catch (error) {
      // 409: já respondida; 404: a pessoa cancelou a solicitação.
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        setRespostas((r) => ({ ...r, [n.idNotificacao]: "processada" }));
        marcarLida(n, true);
      } else {
        notificar(mensagemErro(error, "Não foi possível responder à solicitação."));
      }
    } finally {
      setRespondendo((s) => alternar(s, n.idNotificacao, false));
    }
  }

  const totalNaoLidas = naoLidas ?? todos.filter((n) => !n.lida).length;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={cls.eyebrow}>
              <Bell size={14} aria-hidden="true" /> Fique por dentro
            </p>
            <h1 className={cls.h1}>Notificações</h1>
            <p className={`${cls.textoSuave} mt-1`} aria-live="polite">
              {totalNaoLidas > 0 ? `${totalNaoLidas} não lida${totalNaoLidas === 1 ? "" : "s"}` : "Tudo em dia"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                buscar(0);
                verificarAgora();
              }}
              disabled={carregando}
              className={cls.btnContorno}
              aria-label="Atualizar notificações"
            >
              {carregando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button type="button" onClick={marcarTodas} disabled={marcandoTodas || totalNaoLidas === 0} className={cls.btnPrimario}>
              {marcandoTodas ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <CheckCheck size={15} aria-hidden="true" />}
              Marcar todas como lidas
            </button>
          </div>
        </div>

        {!!pendentes && pendentes > 0 && (
          <Link
            href="/conexoes?aba=recebidas"
            className={`${cls.card} flex items-center justify-between gap-3 p-4 hover:border-brand-200`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Users size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-ink-900">
                  {pendentes} solicitaç{pendentes === 1 ? "ão" : "ões"} de conexão pendente{pendentes === 1 ? "" : "s"}
                </span>
                <span className="block text-[12.5px] text-ink-500">Ver e responder em Conexões</span>
              </span>
            </span>
            <span className="text-[13px] font-semibold text-brand-700">Abrir →</span>
          </Link>
        )}

        <div role="tablist" aria-label="Filtrar notificações" className="flex flex-wrap gap-2">
          {(
            [
              { id: "todas", rotulo: "Todas" },
              { id: "naoLidas", rotulo: "Não lidas" },
              ...(isAdmin ? [] : [{ id: "atividade", rotulo: "Curtidas e comentários" }]),
              { id: "conexoes", rotulo: "Conexões" },
            ] as { id: Filtro; rotulo: string }[]
          ).map(({ id, rotulo }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filtro === id}
              onClick={() => setFiltro(id)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                filtro === id ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {erro && (
          <Alerta titulo="Erro ao carregar" onTentarNovamente={() => buscar(itens.length ? pagina + 1 : 0)}>
            {erro}
          </Alerta>
        )}

        <section className={`${cls.card} overflow-hidden`} aria-label="Lista de notificações">
          {carregando && todos.length === 0 ? (
            <div className="space-y-4 p-5" aria-label="Carregando notificações">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className={`${cls.skeleton} h-10 w-10 rounded-full`} />
                  <div className="flex-1 space-y-2">
                    <div className={`${cls.skeleton} h-4 w-1/3 rounded-md`} />
                    <div className={`${cls.skeleton} h-3 w-2/3 rounded-md`} />
                  </div>
                </div>
              ))}
            </div>
          ) : visiveis.length === 0 && !erro ? (
            <EmptyState
              icon={Bell}
              title={filtro === "naoLidas" ? "Nenhuma notificação não lida" : "Nenhuma notificação ainda"}
              description={
                isAdmin
                  ? "Solicitações de conexão e respostas às suas solicitações aparecem aqui."
                  : "Curtidas, comentários, respostas, votos nos seus projetos e solicitações de conexão aparecem aqui."
              }
            />
          ) : (
            <ul>
              {visiveis.map((item) =>
                item.origem === "atividade" ? (
                  <NotificacaoAtividadeCard
                    key={item.chave}
                    notificacao={item.a}
                    onAbrir={() => marcarAtividadeLida([item.a.id])}
                    onMarcarLida={() => marcarAtividadeLida([item.a.id])}
                  />
                ) : (
                  <NotificacaoCard
                    key={item.chave}
                    notificacao={item.n}
                    resposta={respostas[item.n.idNotificacao]}
                    ocupado={respondendo.has(item.n.idNotificacao)}
                    marcando={marcando.has(item.n.idNotificacao)}
                    onMarcarLida={() => marcarLida(item.n)}
                    onAceitar={() => responder(item.n, true)}
                    onRecusar={() => responder(item.n, false)}
                  />
                )
              )}
            </ul>
          )}
        </section>

        {!ultima && itens.length > 0 && (
          <div className="flex justify-center">
            <button type="button" onClick={() => buscar(pagina + 1)} disabled={carregando} className={cls.btnSecundario}>
              {carregando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Carregar mais
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
