"use client";

import { ReactNode } from "react";
import { Pencil, SearchX, Trash2, type LucideIcon } from "lucide-react";
import EmptyState from "../EmptyState";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";

/**
 * Contêiner padrão da listagem: carregando, erro, vazio, "nenhum resultado" para a
 * pesquisa e, no rodapé, a paginação.
 */
export function ListaAdmin({
  carregando,
  erro,
  onTentarNovamente,
  vazio,
  semResultado,
  termo,
  icone,
  tituloVazio,
  descricaoVazio,
  onLimparPesquisa,
  rodape,
  children,
}: {
  carregando: boolean;
  erro?: string;
  onTentarNovamente?: () => void;
  /** Nenhum registro cadastrado. */
  vazio: boolean;
  /** Há registros, mas a pesquisa não encontrou nenhum. */
  semResultado: boolean;
  termo?: string;
  icone: LucideIcon;
  tituloVazio: string;
  descricaoVazio?: string;
  onLimparPesquisa?: () => void;
  rodape?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {erro && !carregando && <Alerta onTentarNovamente={onTentarNovamente}>{erro}</Alerta>}
      <div className={`${cls.card} overflow-hidden`} aria-busy={carregando}>
        {carregando ? (
          <div className="space-y-4 p-6" aria-label="Carregando">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className={`${cls.skeleton} h-4 w-1/3 rounded-md`} />
                  <div className={`${cls.skeleton} h-3 w-2/3 rounded-md`} />
                </div>
                <div className={`${cls.skeleton} h-8 w-16 rounded-full`} />
              </div>
            ))}
          </div>
        ) : erro ? null : vazio ? (
          <EmptyState icon={icone} title={tituloVazio} description={descricaoVazio} />
        ) : semResultado ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum resultado encontrado"
            description={termo ? `Nada corresponde a "${termo.trim()}". Confira a grafia ou tente outro termo.` : "Ajuste os filtros para ver registros."}
            action={
              onLimparPesquisa ? (
                <button type="button" onClick={onLimparPesquisa} className={cls.btnSecundario}>
                  Limpar pesquisa
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-ink-100">{children}</ul>
            {rodape}
          </>
        )}
      </div>
    </>
  );
}

/** Linha padrão: título, texto secundário, chips/meta e as ações Editar/Excluir (+ extras). */
export function LinhaAdmin({
  titulo,
  subtitulo,
  meta,
  inicio,
  acoes,
  onEditar,
  onExcluir,
  rotulo,
  editarDesabilitado = false,
  dicaEditar,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  meta?: ReactNode;
  /** Avatar/ícone à esquerda. */
  inicio?: ReactNode;
  /** Ações extras (antes de Editar/Excluir). */
  acoes?: ReactNode;
  onEditar?: () => void;
  onExcluir?: () => void;
  /** Nome do registro para os rótulos acessíveis ("Editar Tecnologia"). */
  rotulo: string;
  editarDesabilitado?: boolean;
  dicaEditar?: string;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-brand-50/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {inicio}
        <div className="min-w-0">
          <h3 className="break-words font-display text-[14.5px] font-semibold text-ink-900">{titulo}</h3>
          {subtitulo && <div className="mt-0.5 line-clamp-2 break-words text-[0.8125rem] text-ink-500">{subtitulo}</div>}
          {meta && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{meta}</div>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
        {acoes}
        {onEditar && (
          <button
            type="button"
            onClick={onEditar}
            disabled={editarDesabilitado}
            title={dicaEditar ?? "Editar"}
            aria-label={`Editar ${rotulo}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={14} aria-hidden="true" /> Editar
          </button>
        )}
        {onExcluir && (
          <button type="button" onClick={onExcluir} className={`${cls.btnIconePerigo} !h-9 !w-9`} title="Excluir" aria-label={`Excluir ${rotulo}`}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </li>
  );
}

/** Campo de formulário com rótulo, contador opcional e erro (usado nas modais). */
export function CampoAdmin({
  id,
  rotulo,
  erro,
  ajuda,
  obrigatorio = false,
  contador,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  ajuda?: string;
  obrigatorio?: boolean;
  contador?: { atual: number; max: number };
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cls.label}>
          {rotulo}
          {obrigatorio && (
            <span className="text-red-600" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
        {contador && (
          <span className={`text-[11.5px] ${contador.atual > contador.max ? "text-red-600" : "text-ink-400"}`}>
            {contador.atual}/{contador.max}
          </span>
        )}
      </div>
      {children}
      {erro ? (
        <p id={`${id}-erro`} className="mt-1 text-[12.5px] text-red-600">
          {erro}
        </p>
      ) : ajuda ? (
        <p className="mt-1 text-[12px] text-ink-400">{ajuda}</p>
      ) : null}
    </div>
  );
}
