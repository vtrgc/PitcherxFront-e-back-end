"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Check, CheckCheck, Loader2, Lock, MoreHorizontal, PenLine, RotateCw, Send, Trash2, WifiOff, X } from "lucide-react";
import Avatar from "../ui/Avatar";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import {
  TAMANHO_MAXIMO_MENSAGEM,
  chaveDia,
  explicacaoSituacao,
  horaMensagem,
  podeEditar,
  rotuloDia,
} from "../../lib/mensagens";
import { useConversa } from "../../hook/useConversa";
import { Mensagem, MensagemNaTela, ParticipanteConversa, SituacaoConversa } from "../../types/Mensagem";

interface Props {
  conversaId: number | null;
  participante: ParticipanteConversa;
  podeEnviar: boolean;
  situacao: SituacaoConversa;
  motivo: string | null;
  idUsuario: number;
  onVoltar: () => void;
  onRecarregar: () => void;
  onLida: (conversaId: number) => void;
  onEnviada: (mensagem: Mensagem) => void;
  onBloqueada: () => void;
  /** Algo mudou na conversa: a lista atualiza a prévia. */
  onMudou: () => void;
}

/** Distância do fim (px) abaixo da qual a conversa acompanha as mensagens novas. */
const LIMIAR_FIM = 96;

export default function PainelConversa({
  conversaId,
  participante,
  podeEnviar,
  situacao,
  motivo,
  idUsuario,
  onVoltar,
  onRecarregar,
  onLida,
  onEnviada,
  onBloqueada,
  onMudou,
}: Props) {
  const conversa = useConversa({
    conversaId,
    destinatarioId: participante.idUsuario,
    idUsuario,
    aoLer: onLida,
    aoEnviar: onEnviada,
    aoBloquear: onBloqueada,
    aoMudar: onMudou,
  });
  const { mensagens } = conversa;

  // ---- rolagem: acompanha o fim, a não ser que a pessoa tenha subido para ler o histórico
  const rolagemRef = useRef<HTMLDivElement>(null);
  const noFimRef = useRef(true);
  const alturaAntesRef = useRef<number | null>(null);
  const ultimaRef = useRef<string>("");
  const [novasAbaixo, setNovasAbaixo] = useState(false);

  const irParaOFim = useCallback((suave = false) => {
    const el = rolagemRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: suave ? "smooth" : "auto" });
    noFimRef.current = true;
    setNovasAbaixo(false);
  }, []);

  function aoRolar() {
    const el = rolagemRef.current;
    if (!el) return;
    noFimRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < LIMIAR_FIM;
    if (noFimRef.current) setNovasAbaixo(false);
  }

  useLayoutEffect(() => {
    const el = rolagemRef.current;
    if (!el || mensagens.length === 0) return;
    // Mensagens antigas inseridas no topo: mantém o ponto de leitura.
    if (alturaAntesRef.current !== null) {
      el.scrollTop += el.scrollHeight - alturaAntesRef.current;
      alturaAntesRef.current = null;
      return;
    }
    const ultima = mensagens[mensagens.length - 1];
    const chave = `${ultima.chaveCliente ?? ultima.idMensagem}`;
    if (chave === ultimaRef.current) return;
    const primeiraVez = ultimaRef.current === "";
    ultimaRef.current = chave;
    if (primeiraVez || noFimRef.current || ultima.minha) {
      el.scrollTop = el.scrollHeight;
      noFimRef.current = true;
    } else {
      setNovasAbaixo(true);
    }
  }, [mensagens]);

  async function carregarAnteriores() {
    alturaAntesRef.current = rolagemRef.current?.scrollHeight ?? null;
    await conversa.carregarAnteriores();
  }

  const ultimaMinhaConfirmada = [...mensagens].reverse().find((m) => m.minha && !m.estadoEnvio && !m.excluida);

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={`Conversa com ${participante.nomeUsuario}`}>
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 border-b border-ink-100 px-3 py-3 sm:px-5">
        <button type="button" onClick={onVoltar} className={`${cls.btnIcone} md:hidden`} aria-label="Voltar para as conversas">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <Link href={`/perfil/${participante.idUsuario}`} className="flex min-w-0 items-center gap-3 rounded-lg hover:opacity-90">
          <Avatar url={participante.urlImagemUsuario} nome={participante.nomeUsuario} tamanho={40} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-ink-900">{participante.nomeUsuario}</p>
            <p className={`text-[12px] ${podeEnviar ? "text-[#05603A]" : "text-ink-500"}`}>
              {podeEnviar ? "Conexão aceita" : "Sem conexão aceita · somente leitura"}
            </p>
          </div>
        </Link>
      </header>

      {conversa.semConexao && (
        <p className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-2 text-[12.5px] text-amber-800" role="status">
          <WifiOff size={14} aria-hidden="true" /> Sem conexão com o servidor. As mensagens novas aparecem assim que a conexão voltar.
        </p>
      )}

      {/* Histórico */}
      <div className="relative min-h-0 flex-1">
        <div ref={rolagemRef} onScroll={aoRolar} className="h-full overflow-y-auto px-3 py-4 sm:px-5">
          {conversa.carregando ? (
            <div className="space-y-3" aria-label="Carregando mensagens">
              {[44, 60, 36, 52].map((w, i) => (
                <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                  <div className={`${cls.skeleton} h-10 rounded-2xl`} style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          ) : conversa.erro ? (
            <Alerta onTentarNovamente={onRecarregar}>{conversa.erro}</Alerta>
          ) : mensagens.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <Avatar url={participante.urlImagemUsuario} nome={participante.nomeUsuario} tamanho={72} />
              <p className="mt-3 font-display text-[15px] font-bold text-ink-900">{participante.nomeUsuario}</p>
              <p className="mt-1 max-w-sm text-[13px] leading-5 text-ink-500">
                {podeEnviar ? "Envie a primeira mensagem para começar a conversa." : "Ainda não há mensagens nesta conversa."}
              </p>
            </div>
          ) : (
            <div role="log" aria-live="polite" aria-relevant="additions" className="space-y-1">
              {conversa.temMais && (
                <div className="flex justify-center pb-3">
                  <button type="button" onClick={carregarAnteriores} disabled={conversa.carregandoAnteriores} className={`${cls.btnContorno} !py-1.5 !text-[12.5px]`}>
                    {conversa.carregandoAnteriores && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                    Carregar mensagens anteriores
                  </button>
                </div>
              )}
              {mensagens.map((m, i) => {
                const anterior = mensagens[i - 1];
                const novoDia = !anterior || chaveDia(anterior.dataEnvio) !== chaveDia(m.dataEnvio);
                const inicioGrupo = novoDia || !anterior || anterior.minha !== m.minha;
                return (
                  <Fragment key={m.chaveCliente ?? m.idMensagem}>
                    {novoDia && (
                      <div className="flex items-center gap-3 py-3" role="separator">
                        <span className="h-px flex-1 bg-ink-100" />
                        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">{rotuloDia(m.dataEnvio)}</span>
                        <span className="h-px flex-1 bg-ink-100" />
                      </div>
                    )}
                    <BolhaMensagem
                      mensagem={m}
                      participante={participante}
                      mostrarAvatar={inicioGrupo && !m.minha}
                      afastar={inicioGrupo && !novoDia}
                      podeEnviar={podeEnviar}
                      status={m === ultimaMinhaConfirmada ? (m.lida ? "vista" : "enviada") : null}
                      onEditar={conversa.editar}
                      onApagar={conversa.apagar}
                      onReenviar={conversa.reenviar}
                      onDescartar={conversa.descartar}
                    />
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
        {novasAbaixo && (
          <button
            type="button"
            onClick={() => irParaOFim(true)}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-lg"
          >
            <ArrowDown size={14} aria-hidden="true" /> Nova mensagem
          </button>
        )}
      </div>

      {/* Envio ou aviso de bloqueio */}
      {podeEnviar ? (
        <CampoMensagem
          nome={participante.nomeUsuario}
          onEnviar={(texto) => {
            const envio = conversa.enviar(texto);
            irParaOFim();
            return envio;
          }}
        />
      ) : (
        <div className="flex items-start gap-3 border-t border-ink-100 bg-ink-25 px-5 py-4" role="note">
          <Lock size={18} className="mt-0.5 shrink-0 text-ink-500" aria-hidden="true" />
          <div className="text-[13px] leading-5 text-ink-700">
            <p>{explicacaoSituacao(situacao, participante.nomeUsuario, motivo)}</p>
            <Link href={`/perfil/${participante.idUsuario}`} className="mt-1 inline-block font-semibold text-brand-700 hover:underline">
              Ver perfil de {participante.nomeUsuario}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

function BolhaMensagem({
  mensagem: m,
  participante,
  mostrarAvatar,
  afastar,
  podeEnviar,
  status,
  onEditar,
  onApagar,
  onReenviar,
  onDescartar,
}: {
  mensagem: MensagemNaTela;
  participante: ParticipanteConversa;
  mostrarAvatar: boolean;
  afastar: boolean;
  podeEnviar: boolean;
  status: "vista" | "enviada" | null;
  onEditar: (id: number, texto: string) => Promise<void>;
  onApagar: (id: number) => Promise<void>;
  onReenviar: (chave: string) => Promise<boolean>;
  onDescartar: (chave: string) => void;
}) {
  const { notificar, confirmar } = useFeedback();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const minha = m.minha;
  const confirmada = !m.estadoEnvio;
  const editavel = confirmada && podeEnviar && podeEditar(m);
  const apagavel = confirmada && minha && !m.excluida;

  async function salvarEdicao() {
    const novo = texto.trim();
    if (!novo || salvando) return;
    setSalvando(true);
    try {
      await onEditar(m.idMensagem, novo);
      setEditando(false);
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível editar a mensagem."));
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    const ok = await confirmar("Apagar esta mensagem? Ela some para você e para a outra pessoa.", {
      titulo: "Apagar mensagem",
      confirmarLabel: "Apagar",
      perigo: true,
    });
    if (!ok) return;
    try {
      await onApagar(m.idMensagem);
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível apagar a mensagem."));
    }
  }

  return (
    <div className={`group flex items-end gap-2 ${minha ? "justify-end" : "justify-start"} ${afastar ? "pt-2.5" : ""}`}>
      {!minha && (
        <div className="w-8 shrink-0">
          {mostrarAvatar && <Avatar url={participante.urlImagemUsuario} nome={participante.nomeUsuario} tamanho={32} />}
        </div>
      )}

      {minha && (editavel || apagavel) && !editando && (
        <AcoesMensagem
          podeEditar={editavel}
          podeApagar={apagavel}
          onEditar={() => {
            setTexto(m.conteudo ?? "");
            setEditando(true);
          }}
          onApagar={apagar}
        />
      )}

      <div className={`flex max-w-[82%] flex-col sm:max-w-[70%] ${minha ? "items-end" : "items-start"}`}>
        {editando ? (
          <div className="w-[min(32rem,75vw)] rounded-2xl border border-brand-200 bg-white p-2">
            <label className="sr-only" htmlFor={`editar-${m.idMensagem}`}>
              Editar mensagem
            </label>
            <textarea
              id={`editar-${m.idMensagem}`}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={TAMANHO_MAXIMO_MENSAGEM}
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditando(false);
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  salvarEdicao();
                }
              }}
              className="w-full resize-none rounded-xl bg-ink-25 px-3 py-2 text-[14px] text-ink-900 outline-none focus:bg-white"
            />
            <div className="mt-1.5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(false)} className={`${cls.btnContorno} !px-3 !py-1.5 !text-[12.5px]`}>
                <X size={14} aria-hidden="true" /> Cancelar
              </button>
              <button type="button" onClick={salvarEdicao} disabled={salvando || !texto.trim()} className={`${cls.btnPrimario} !px-3 !py-1.5 !text-[12.5px]`}>
                {salvando ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} Salvar
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-[1.45] ${
              m.excluida
                ? "border border-dashed border-ink-200 bg-white italic text-ink-400"
                : minha
                  ? `bg-brand-600 text-white ${m.estadoEnvio === "falhou" ? "opacity-70" : ""}`
                  : "bg-ink-50 text-ink-900"
            } ${minha ? "rounded-br-md" : "rounded-bl-md"}`}
          >
            {m.excluida ? "Mensagem apagada" : m.conteudo}
          </div>
        )}

        <div className={`mt-0.5 flex items-center gap-1.5 px-1 text-[11px] ${minha ? "flex-row-reverse" : ""} text-ink-400`}>
          <time dateTime={m.dataEnvio}>{horaMensagem(m.dataEnvio)}</time>
          {m.dataEdicao && !m.excluida && <span>· editada</span>}
          {m.estadoEnvio === "enviando" && (
            <span className="inline-flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" aria-hidden="true" /> Enviando…
            </span>
          )}
          {status === "vista" && (
            <span className="inline-flex items-center gap-1 text-brand-600">
              <CheckCheck size={13} aria-hidden="true" /> Vista
            </span>
          )}
          {status === "enviada" && (
            <span className="inline-flex items-center gap-1">
              <Check size={13} aria-hidden="true" /> Enviada
            </span>
          )}
        </div>

        {m.estadoEnvio === "falhou" && m.chaveCliente && (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-[12px]" role="alert">
            <span className="text-red-600">Não enviada: {m.erroEnvio}</span>
            <button type="button" onClick={() => onReenviar(m.chaveCliente!)} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              <RotateCw size={12} aria-hidden="true" /> Tentar de novo
            </button>
            <button type="button" onClick={() => onDescartar(m.chaveCliente!)} className="font-semibold text-ink-500 hover:underline">
              Descartar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AcoesMensagem({
  podeEditar: editar,
  podeApagar,
  onEditar,
  onApagar,
}: {
  podeEditar: boolean;
  podeApagar: boolean;
  onEditar: () => void;
  onApagar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fechar(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setAberto(false);
        return;
      }
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative self-center">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Opções da mensagem"
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 opacity-100 transition-opacity hover:bg-ink-50 hover:text-ink-700 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {aberto && (
        <div role="menu" className="absolute bottom-full right-0 z-20 mb-1 min-w-[9rem] overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover">
          {editar && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false);
                onEditar();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-ink-700 hover:bg-ink-50"
            >
              <PenLine size={14} aria-hidden="true" /> Editar
            </button>
          )}
          {podeApagar && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false);
                onApagar();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} aria-hidden="true" /> Apagar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CampoMensagem({ nome, onEnviar }: { nome: string; onEnviar: (texto: string) => Promise<boolean> }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const restante = TAMANHO_MAXIMO_MENSAGEM - texto.length;
  const vazio = texto.trim().length === 0;

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [texto]);

  async function enviar() {
    if (vazio || enviando) return;
    const conteudo = texto;
    setTexto("");
    setEnviando(true);
    try {
      await onEnviar(conteudo);
    } finally {
      setEnviando(false);
      areaRef.current?.focus();
    }
  }

  return (
    <form
      className="border-t border-ink-100 px-3 py-3 sm:px-5"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <div className="flex items-end gap-2">
        <label htmlFor="campo-mensagem" className="sr-only">
          Mensagem para {nome}
        </label>
        <textarea
          ref={areaRef}
          id="campo-mensagem"
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, TAMANHO_MAXIMO_MENSAGEM))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={1}
          placeholder="Escreva uma mensagem…"
          className={`${cls.input} max-h-40 min-h-[2.75rem] resize-none !py-2.5 !text-[14px] leading-5`}
        />
        <button type="submit" disabled={vazio} className={`${cls.btnPrimario} h-11 shrink-0 !px-4`} aria-label="Enviar mensagem">
          <Send size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
      <p className="mt-1.5 flex justify-between gap-3 px-1 text-[11px] text-ink-400">
        <span className="hidden sm:inline">Enter envia · Shift + Enter quebra a linha</span>
        {restante < 200 && <span className={restante < 50 ? "text-red-600" : ""}>{restante} caracteres restantes</span>}
      </p>
    </form>
  );
}
