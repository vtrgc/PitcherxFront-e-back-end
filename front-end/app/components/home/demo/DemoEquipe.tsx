import { ChevronDown, Plus, Users } from "lucide-react";
import { cls } from "../../ui/estilos";
import { EQUIPE_FINAL, INTERESSADO, PAPEIS } from "./dados";

function Membro({ nome, papel, desde, hx }: { nome: string; papel: string; desde: string; hx?: string }) {
  return (
    <li data-hx={hx} className="hx-membro overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 py-4">
        <div className="min-w-0">
          <p className="font-display text-[14.5px] font-semibold text-ink-900">{nome}</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500">Vinculado desde {desde}</p>
        </div>
        <span data-hx="papel-chip" className={cls.chip}>
          {papel}
        </span>
      </div>
    </li>
  );
}

/**
 * Réplica da seção "Equipe do projeto" de /projetos/[id]. Investidor aqui é exatamente o
 * que o sistema oferece: um PAPEL de vínculo no projeto, adicionado pelo criador.
 */
export default function DemoEquipe({ gerenciar = false, prefixo }: { gerenciar?: boolean; prefixo: string }) {
  const [criadora, novo] = EQUIPE_FINAL;
  return (
    <section className="mt-8 border-t border-ink-100 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={cls.eyebrow}>
          <Users size={14} aria-hidden="true" />
          Equipe do projeto
        </h3>
        {gerenciar && (
          <span data-hx={`${prefixo}-btn-membro`} className={`${cls.btnSecundario} !text-[13px]`}>
            <Plus size={15} aria-hidden="true" />
            Adicionar membro
          </span>
        )}
      </div>

      {gerenciar && (
        <div data-hx={`${prefixo}-form-membro`} className="hx-form-membro overflow-hidden">
          <div className={`${cls.composer} mt-4 !max-w-none`}>
            <div className="grid gap-4">
              <div className="relative">
                <p className={cls.label}>Pessoa</p>
                <div className={`${cls.input} !bg-white flex items-center justify-between`}>
                  <span className="relative block flex-1">
                    <span data-hx={`${prefixo}-pessoa-vazio`} className="hx-ph">
                      Selecione
                    </span>
                    <span data-hx={`${prefixo}-pessoa-valor`} className="absolute left-0 top-0">
                      {INTERESSADO.nome}
                    </span>
                  </span>
                  <ChevronDown size={16} className="text-ink-400" aria-hidden="true" />
                </div>
              </div>
              <div className="relative">
                <p className={cls.label}>Tipo de vínculo</p>
                <div className={`${cls.input} !bg-white flex items-center justify-between`}>
                  <span className="relative block flex-1">
                    <span data-hx={`${prefixo}-papel-vazio`} className="hx-ph">
                      Selecione
                    </span>
                    <span data-hx={`${prefixo}-papel-valor`} className="absolute left-0 top-0">
                      Investidor
                    </span>
                  </span>
                  <ChevronDown size={16} className="text-ink-400" aria-hidden="true" />
                </div>
                <ul
                  data-hx={`${prefixo}-papel-lista`}
                  className="hx-lista absolute bottom-full left-0 right-0 z-10 mb-1 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover"
                >
                  {PAPEIS.map((p) => (
                    <li
                      key={p}
                      data-hx={p === "Investidor" ? `${prefixo}-papel-opcao` : undefined}
                      className="px-3.5 py-2 text-[13.5px] font-medium text-ink-700"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-[0.8125rem] text-ink-500">A lista mostra pessoas que completaram o perfil profissional.</p>
            <span data-hx={`${prefixo}-btn-adicionar`} className={`${cls.btnPrimario} mt-5 !text-[13px]`}>
              <Plus size={15} aria-hidden="true" />
              Adicionar à equipe
            </span>
          </div>
        </div>
      )}

      <ul className="mt-3">
        <Membro {...criadora} />
        <Membro {...novo} hx={`${prefixo}-novo-membro`} />
      </ul>
    </section>
  );
}
