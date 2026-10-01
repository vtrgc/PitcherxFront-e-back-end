import { Calendar, ChevronDown, ImagePlus, Plus, Save, X } from "lucide-react";
import { cls } from "../../ui/estilos";
import { PROJETO } from "./dados";

/** Campo de entrada estático com as classes reais (cls.input). */
function Campo({ hx, valor, placeholder, alto = false }: { hx: string; valor: string; placeholder?: string; alto?: boolean }) {
  return (
    <div data-hx={`${hx}-campo`} className={`${cls.input} relative ${alto ? "min-h-[7.4rem]" : "min-h-[2.9rem]"}`}>
      <span data-hx={hx} data-digitar={valor} className="block whitespace-pre-line break-words">
        {valor}
      </span>
      {placeholder && (
        <span data-hx={`${hx}-ph`} className="hx-ph pointer-events-none absolute left-[0.9rem] right-[0.9rem] top-[0.7rem] text-ink-400">
          {placeholder}
        </span>
      )}
    </div>
  );
}

/**
 * Página /projetos com o formulário "Novo projeto" aberto (réplica de FormProjeto).
 * Somente campos que existem no sistema: nome, descrição, datas, tipo e URL de imagem opcional.
 */
export default function DemoFormProjeto() {
  return (
    <>
      <div className="mb-1 flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <p className={cls.eyebrow}>Construir</p>
          <h2 className={cls.h1}>Projetos</h2>
          <p className={`${cls.texto} mt-1.5 max-w-md`}>Publique projetos e encontre profissionais para colocá-los em prática.</p>
        </div>
        <span data-hx="btn-novo" className={`${cls.btnPrimario} !text-[13px]`}>
          <Plus size={15} aria-hidden="true" />
          Novo projeto
        </span>
      </div>

      <section data-hx="form-projeto" className={`${cls.composer} !max-w-none`}>
        <h3 className={cls.h2}>Novo projeto</h3>
        <p className={`${cls.textoSuave} mt-1`}>Preencha os dados abaixo para publicar um novo projeto.</p>

        <div className="mt-5 grid gap-4">
          <div>
            <p className={cls.label}>Nome do projeto</p>
            <Campo hx="proj-nome" valor={PROJETO.nome} />
          </div>
          <div>
            <p className={cls.label}>Descrição</p>
            <Campo
              hx="proj-desc"
              valor={PROJETO.descricao}
              placeholder="Descreva o projeto, o problema que ele resolve e quem você procura..."
              alto
            />
          </div>
          <div data-hx="bloco-datas" className="grid grid-cols-2 gap-3">
            <div>
              <p className={cls.label}>Data de início</p>
              <div className={`${cls.input} flex items-center justify-between !px-3 text-[13.5px]`}>
                <span data-hx="data-valor">{PROJETO.inicio}</span>
                <Calendar size={14} className="text-ink-400" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className={cls.label}>Data de término</p>
              <div className={`${cls.input} flex items-center justify-between !px-3 text-[13.5px]`}>
                <span data-hx="data-valor">{PROJETO.fim}</span>
                <Calendar size={14} className="text-ink-400" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div data-hx="bloco-tipo" className="relative">
            <p className={cls.label}>Tipo de projeto</p>
            <div className={`${cls.input} !bg-white flex min-h-[2.9rem] items-center justify-between`}>
              <span className="relative block flex-1">
                <span data-hx="tipo-vazio" className="hx-ph text-ink-900">
                  Selecione um tipo
                </span>
                <span data-hx="tipo-valor" className="absolute left-0 top-0 text-ink-900">
                  {PROJETO.tipo}
                </span>
              </span>
              <ChevronDown size={16} className="text-ink-400" aria-hidden="true" />
            </div>
            <ul
              data-hx="tipo-lista"
              className="hx-lista absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover"
            >
              {PROJETO.tiposExemplo.map((t) => (
                <li
                  key={t}
                  data-hx={t === PROJETO.tipo ? "tipo-opcao" : undefined}
                  className="px-3.5 py-2 text-[13.5px] font-medium text-ink-700"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={`${cls.label} flex items-center gap-1.5`}>
              <ImagePlus size={14} aria-hidden="true" />
              URL da imagem (opcional)
            </p>
            <div className={`${cls.input} text-ink-400`}>https://...</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span data-hx="btn-criar" className={cls.btnPrimario}>
            <Save size={16} aria-hidden="true" />
            Publicar projeto
          </span>
          <span className={cls.btnSecundario}>
            <X size={16} aria-hidden="true" /> Cancelar
          </span>
        </div>
      </section>
    </>
  );
}
