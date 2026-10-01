import { ArrowLeft, Calendar, FileSignature, Heart, Pencil } from "lucide-react";
import { cls } from "../../ui/estilos";
import { PROJETO } from "./dados";
import DemoEquipe from "./DemoEquipe";

/**
 * Réplica de /projetos/[id]: capa, tipo, status, curtir projeto, descrição, datas,
 * contratos e equipe. `visao="criadora"` mostra as ações de quem criou (Editar, Adicionar membro).
 */
export default function DemoProjeto({ visao, prefixo }: { visao: "criadora" | "visitante"; prefixo: string }) {
  const criadora = visao === "criadora";
  return (
    <>
      <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700">
        <ArrowLeft size={15} aria-hidden="true" />
        {criadora ? "Voltar para projetos" : "Voltar"}
      </span>

      <div className="relative -mx-4 mt-4 overflow-hidden rounded-[1.25rem]">
        <div className="relative h-48 w-full bg-brand-gradient">
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
        </div>
        <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`${cls.chip} !border-transparent !bg-accent-500 !text-white`}>{PROJETO.tipo}</span>
              <span className={cls.chipAtivo}>Ativo</span>
            </div>
            <h3 className="font-display mt-3 break-words text-[1.5rem] font-extrabold leading-tight tracking-tight text-white drop-shadow-lg">
              {PROJETO.nome}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              data-hx={`${prefixo}-curtir`}
              className="inline-flex items-center gap-1.5 rounded-[0.625rem] border border-white/20 bg-white/10 px-3 py-[0.55rem] text-sm font-semibold text-white"
            >
              <span className="relative inline-flex h-[15px] w-[15px]">
                <Heart size={15} aria-hidden="true" className="absolute inset-0" />
                <Heart
                  size={15}
                  aria-hidden="true"
                  data-hx={`${prefixo}-coracao`}
                  className="hx-coracao absolute inset-0 fill-accent-400 text-accent-400"
                />
              </span>
              <span className="relative inline-block w-[0.6em]">
                <span data-hx={`${prefixo}-curtidas-0`} className="absolute left-0 top-0">
                  0
                </span>
                <span data-hx={`${prefixo}-curtidas-1`} className="hx-curtidas-1">
                  1
                </span>
              </span>
            </span>
            {criadora && (
              <span className="inline-flex items-center gap-1.5 rounded-[0.625rem] border border-white/20 bg-white/10 px-3 py-[0.55rem] text-sm font-semibold text-white">
                <Pencil size={15} aria-hidden="true" />
                Editar
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p data-hx={`${prefixo}-descricao`} className={`${cls.texto} max-w-2xl whitespace-pre-line break-words`}>
          {PROJETO.descricao}
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-[0.8125rem] text-ink-500">
          <Calendar size={14} aria-hidden="true" />
          {PROJETO.inicio} até {PROJETO.fim}
        </div>
      </div>

      <section className="mt-8 border-t border-ink-100 pt-6">
        <h3 className={cls.eyebrow}>
          <FileSignature size={14} aria-hidden="true" />
          Contratos deste projeto
        </h3>
        <p className="mt-4 text-[0.8125rem] text-ink-500">Nenhum contrato vinculado a este projeto ainda.</p>
      </section>

      <div data-hx={`${prefixo}-equipe`}>
        <DemoEquipe gerenciar={criadora} prefixo={prefixo} />
      </div>
    </>
  );
}
