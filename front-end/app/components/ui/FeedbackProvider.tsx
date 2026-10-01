"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

/**
 * Substitui window.alert/window.confirm por um diálogo de confirmação acessível
 * e notificações (toasts) no visual do PitcherX.
 */

type TipoNotificacao = "sucesso" | "erro" | "info";

interface Notificacao {
  id: number;
  mensagem: string;
  tipo: TipoNotificacao;
}

interface OpcoesConfirmacao {
  titulo?: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  perigo?: boolean;
}

interface FeedbackContextValue {
  notificar: (mensagem: string, tipo?: TipoNotificacao) => void;
  confirmar: (mensagem: string, opcoes?: OpcoesConfirmacao) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

interface ConfirmacaoPendente extends OpcoesConfirmacao {
  mensagem: string;
  resolver: (valor: boolean) => void;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoPendente | null>(null);
  const contador = useRef(0);

  const remover = useCallback((id: number) => {
    setNotificacoes((atual) => atual.filter((n) => n.id !== id));
  }, []);

  const notificar = useCallback(
    (mensagem: string, tipo: TipoNotificacao = "erro") => {
      const id = ++contador.current;
      setNotificacoes((atual) => [...atual.slice(-3), { id, mensagem, tipo }]);
      window.setTimeout(() => remover(id), tipo === "erro" ? 7000 : 4500);
    },
    [remover]
  );

  const confirmar = useCallback((mensagem: string, opcoes: OpcoesConfirmacao = {}) => {
    return new Promise<boolean>((resolver) => {
      setConfirmacao({ mensagem, resolver, ...opcoes });
    });
  }, []);

  function responder(valor: boolean) {
    confirmacao?.resolver(valor);
    setConfirmacao(null);
  }

  return (
    <FeedbackContext.Provider value={{ notificar, confirmar }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {notificacoes.map((n) => {
          const Icone = n.tipo === "sucesso" ? CheckCircle2 : n.tipo === "info" ? Info : AlertCircle;
          const cores =
            n.tipo === "sucesso"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : n.tipo === "info"
              ? "border-brand-200 bg-brand-50 text-brand-800"
              : "border-red-200 bg-red-50 text-red-700";
          return (
            <div
              key={n.id}
              role={n.tipo === "erro" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border p-3.5 text-sm shadow-[0_10px_30px_-12px_rgba(21,15,40,0.3)] ${cores}`}
            >
              <Icone size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 break-words">{n.mensagem}</p>
              <button
                type="button"
                onClick={() => remover(n.id)}
                className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100"
                aria-label="Fechar notificação"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmacao && <DialogoConfirmacao dados={confirmacao} onResponder={responder} />}
    </FeedbackContext.Provider>
  );
}

function DialogoConfirmacao({
  dados,
  onResponder,
}: {
  dados: ConfirmacaoPendente;
  onResponder: (valor: boolean) => void;
}) {
  const botaoConfirmar = useRef<HTMLButtonElement>(null);
  const botaoCancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    (dados.perigo ? botaoCancelar : botaoConfirmar).current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onResponder(false);
      }
      if (e.key === "Tab") {
        // mantém o foco dentro do diálogo (apenas dois botões)
        const alvos = [botaoCancelar.current, botaoConfirmar.current].filter(Boolean) as HTMLElement[];
        const i = alvos.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        alvos[(i + (e.shiftKey ? -1 : 1) + alvos.length) % alvos.length]?.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      anterior?.focus?.();
    };
  }, [dados, onResponder]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-void/40 p-4 backdrop-blur-[2px]" onClick={() => onResponder(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensagem"
        className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_24px_60px_-20px_rgba(21,15,40,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialogo-titulo" className="font-display text-[1.1rem] font-bold text-ink-900">
          {dados.titulo || "Confirmar ação"}
        </h2>
        <p id="dialogo-mensagem" className="mt-2 text-[0.9rem] leading-relaxed text-ink-600">
          {dados.mensagem}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            ref={botaoCancelar}
            type="button"
            onClick={() => onResponder(false)}
            className="inline-flex items-center justify-center rounded-[0.625rem] bg-ink-100 px-[1.15rem] py-[0.625rem] text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-200"
          >
            {dados.cancelarLabel || "Cancelar"}
          </button>
          <button
            ref={botaoConfirmar}
            type="button"
            onClick={() => onResponder(true)}
            className={`inline-flex items-center justify-center rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold text-white transition-colors ${
              dados.perigo ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {dados.confirmarLabel || (dados.perigo ? "Excluir" : "Confirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback precisa ser usado dentro de FeedbackProvider");
  return ctx;
}
