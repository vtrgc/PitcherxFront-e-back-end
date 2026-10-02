"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Flag, Loader2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  DETALHES_DENUNCIA_MAX,
  MOTIVOS_DENUNCIA,
  MotivoDenuncia,
  TipoConteudoDenuncia,
  enviarDenuncia,
  validarDenuncia,
} from "../../services/denuncia.service";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";

const NOME_CONTEUDO: Record<TipoConteudoDenuncia, string> = {
  POSTAGEM: "publicação",
  COMENTARIO: "comentário",
  SUBCOMENTARIO: "resposta",
  PROJETO: "projeto",
};

/**
 * Diálogo de denúncia: motivo obrigatório, detalhes opcionais (obrigatórios em "Outro"),
 * confirmação com proteção contra clique duplo, Esc/clique fora para fechar.
 */
export default function ModalDenuncia({
  tipo,
  conteudoId,
  aberto,
  onFechar,
  onDenunciado,
}: {
  tipo: TipoConteudoDenuncia;
  conteudoId: number;
  aberto: boolean;
  onFechar: () => void;
  onDenunciado?: () => void;
}) {
  if (!aberto) return null;
  return <Conteudo tipo={tipo} conteudoId={conteudoId} onFechar={onFechar} onDenunciado={onDenunciado} />;
}

function Conteudo({
  tipo,
  conteudoId,
  onFechar,
  onDenunciado,
}: {
  tipo: TipoConteudoDenuncia;
  conteudoId: number;
  onFechar: () => void;
  onDenunciado?: () => void;
}) {
  const { usuario } = useAuth();
  const { notificar } = useFeedback();
  const [motivo, setMotivo] = useState<MotivoDenuncia | "">("");
  const [detalhes, setDetalhes] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const base = useId();
  const nome = NOME_CONTEUDO[tipo];

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape" && !enviandoRef.current) {
        e.preventDefault();
        onFechar();
      }
      if (e.key === "Tab" && caixaRef.current) {
        const alvos = Array.from(
          caixaRef.current.querySelectorAll<HTMLElement>("input:not([disabled]), textarea:not([disabled]), button:not([disabled])")
        );
        if (alvos.length === 0) return;
        const primeiro = alvos[0];
        const ultimo = alvos[alvos.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }
    document.addEventListener("keydown", aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [onFechar]);

  async function confirmar() {
    if (enviandoRef.current || !usuario) return;
    const invalido = validarDenuncia(motivo, detalhes);
    if (invalido) {
      setErro(invalido);
      return;
    }
    enviandoRef.current = true;
    setEnviando(true);
    setErro("");
    try {
      await enviarDenuncia(usuario.idUsuario, { tipo, conteudoId, motivo: motivo as MotivoDenuncia, detalhes });
      notificar(`Denúncia registrada. Este ${nome === "publicação" ? "conteúdo" : nome} foi ocultado para você.`, "sucesso");
      onDenunciado?.();
      onFechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível registrar a denúncia.");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-void/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={() => !enviandoRef.current && onFechar()}
    >
      <div
        ref={caixaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${base}-titulo`}
        aria-describedby={`${base}-descricao`}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-ink-100 bg-white p-5 shadow-[0_24px_60px_-20px_rgba(21,15,40,0.45)] sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${base}-titulo`} className="flex items-center gap-2 font-display text-[1.1rem] font-bold text-ink-900">
            <Flag size={18} className="text-red-600" aria-hidden="true" /> Denunciar {nome}
          </h2>
          <button type="button" onClick={onFechar} disabled={enviando} className={`${cls.btnIcone} !h-8 !w-8`} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <p id={`${base}-descricao`} className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
          Por que você está denunciando este(a) {nome}? Depois de confirmar, ele deixa de aparecer para você (é possível
          desfazer).
        </p>

        <form
          noValidate
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            confirmar();
          }}
        >
          {erro && <Alerta className="mb-3">{erro}</Alerta>}
          <fieldset disabled={enviando}>
            <legend className="sr-only">Motivo</legend>
            <div className="space-y-1.5">
              {MOTIVOS_DENUNCIA.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[14px] transition-colors ${
                    motivo === m.id ? "border-brand-300 bg-brand-50 text-ink-900" : "border-ink-100 text-ink-700 hover:bg-ink-25"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${base}-motivo`}
                    value={m.id}
                    checked={motivo === m.id}
                    onChange={() => {
                      setMotivo(m.id);
                      setErro("");
                    }}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {m.rotulo}
                </label>
              ))}
            </div>

            <label htmlFor={`${base}-detalhes`} className={`${cls.label} mt-4`}>
              Detalhes {motivo === "OUTRO" ? "" : <span className="font-normal text-ink-400">(opcional)</span>}
            </label>
            <textarea
              id={`${base}-detalhes`}
              value={detalhes}
              maxLength={DETALHES_DENUNCIA_MAX}
              rows={3}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Conte o que aconteceu"
              className={`${cls.input} resize-y`}
            />
            <p className="mt-1 text-right text-[12px] text-ink-400">
              {detalhes.length}/{DETALHES_DENUNCIA_MAX}
            </p>
          </fieldset>

          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={onFechar} disabled={enviando} className={cls.btnSecundario}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !motivo}
              className="inline-flex items-center justify-center gap-2 rounded-[0.625rem] bg-red-600 px-[1.15rem] py-[0.625rem] text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Flag size={15} aria-hidden="true" />}
              Confirmar denúncia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
