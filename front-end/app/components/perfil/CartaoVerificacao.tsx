"use client";

import Link from "next/link";
import { BadgeCheck, CircleDashed, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { ItemVerificacao, ROTULO_STATUS, StatusVerificacao, itensVerificacao } from "../../lib/verificacao";
import { cls } from "../ui/estilos";

const ESTILO: Record<StatusVerificacao, { classe: string; Icone: typeof BadgeCheck }> = {
  verificado: { classe: "bg-[#ECFDF3] text-[#05603A] border-transparent", Icone: BadgeCheck },
  nao_verificado: { classe: "bg-ink-50 text-ink-600 border-ink-200", Icone: ShieldAlert },
  em_analise: { classe: "bg-brand-50 text-brand-700 border-brand-100", Icone: Clock },
  pendente: { classe: "bg-amber-50 text-amber-800 border-amber-200", Icone: CircleDashed },
};

export function SeloStatus({ status }: { status: StatusVerificacao }) {
  const { classe, Icone } = ESTILO[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold ${classe}`}>
      <Icone size={12} aria-hidden="true" /> {ROTULO_STATUS[status]}
    </span>
  );
}

/**
 * Área "Verificação da conta": status de e-mail, identidade (CPF/CNPJ) e conta, só com
 * dados reais da API (ver lib/verificacao).
 */
export default function CartaoVerificacao({
  email,
  ativo,
  identificador,
  carregando = false,
  erroPerfil = false,
  className = "",
  semMoldura = false,
}: {
  email?: string | null;
  ativo?: boolean | null;
  identificador?: string | null;
  carregando?: boolean;
  erroPerfil?: boolean;
  className?: string;
  semMoldura?: boolean;
}) {
  const itens: ItemVerificacao[] = itensVerificacao({ email, ativo, identificador, perfilIndisponivel: carregando || erroPerfil });
  return (
    <section className={`${semMoldura ? "" : `${cls.card} p-5`} ${className}`} aria-labelledby="verificacao-titulo">
      <h2 id="verificacao-titulo" className="flex items-center gap-2 font-display text-[16px] font-bold text-ink-900">
        <ShieldCheck size={17} className="text-brand-600" aria-hidden="true" /> Verificação da conta
      </h2>
      <ul className="mt-3 divide-y divide-ink-100">
        {itens.map((item) => (
          <li key={item.chave} className="py-3 first:pt-1 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-ink-800">{item.titulo}</span>
              <SeloStatus status={item.status} />
            </div>
            <p className="mt-1 break-words text-[12.5px] leading-5 text-ink-500">{item.detalhe}</p>
            {item.acao && (
              <Link href={item.acao.href} className="mt-1 inline-block text-[12.5px] font-semibold text-brand-700 hover:underline">
                {item.acao.rotulo}
              </Link>
            )}
          </li>
        ))}
        {carregando && (
          <li className="py-3">
            <div className={`${cls.skeleton} h-4 w-2/3 rounded-md`} aria-label="Carregando verificação de identidade" />
          </li>
        )}
        {erroPerfil && !carregando && (
          <li className="py-3 text-[12.5px] text-ink-500">Não foi possível carregar a verificação de identidade agora.</li>
        )}
      </ul>
    </section>
  );
}
