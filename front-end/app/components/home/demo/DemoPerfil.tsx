import { Link2, Mail, Share2 } from "lucide-react";
import { cls } from "../../ui/estilos";
import Avatar from "../../ui/Avatar";
import CapaPerfil from "../../perfil/CapaPerfil";
import { CRIADORA } from "./dados";

function Contador({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="order-2 text-[13px] text-ink-500">{rotulo}</dt>
      <dd className="order-1 font-display text-[1.15rem] font-extrabold leading-none text-ink-900">{valor}</dd>
    </div>
  );
}

/** Réplica do cabeçalho de /perfil/[id] (visão de outra pessoa): especialidade, e-mail, LinkedIn, contadores. */
export default function DemoPerfil({ compacto = false, semente = 7 }: { compacto?: boolean; semente?: number }) {
  return (
    <section className={`${cls.card} overflow-hidden`}>
      <CapaPerfil semente={semente} className={compacto ? "h-[96px]" : "h-[120px]"} />
      <div className="px-5 pb-6">
        <div className="relative -mt-12 w-fit">
          <span className="block rounded-full bg-white p-1 shadow-card">
            <Avatar nome={CRIADORA.nome} tamanho={88} moldura={false} className="rounded-full object-cover" />
          </span>
        </div>
        <h3 className="font-display mt-4 text-[1.55rem] font-extrabold leading-tight tracking-[-0.02em] text-ink-900">
          {CRIADORA.nome}
        </h3>
        <p className="mt-1 text-[15px] font-medium text-ink-700">{CRIADORA.especialidade}</p>
        <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-500">
          <li className="inline-flex min-w-0 items-center gap-1.5">
            <Mail size={15} className="shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">{CRIADORA.email}</span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Link2 size={15} className="text-ink-400" aria-hidden="true" />
            <span className="font-semibold text-brand-700">LinkedIn</span>
          </li>
        </ul>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink-100 pt-4">
          <Contador valor={CRIADORA.publicacoes} rotulo="Publicação" />
          <Contador valor={CRIADORA.projetos} rotulo="Projeto" />
          <Contador valor={CRIADORA.projetos} rotulo="Projeto criado" />
        </dl>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <span className={cls.btnPrimario}>
            <Link2 size={16} aria-hidden="true" /> LinkedIn
          </span>
          <span className={cls.btnContorno}>
            <Share2 size={16} aria-hidden="true" /> Compartilhar
          </span>
        </div>
      </div>
    </section>
  );
}
