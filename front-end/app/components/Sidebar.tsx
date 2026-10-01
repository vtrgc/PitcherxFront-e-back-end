"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotificacoes } from "../context/NotificacoesContext";
import { NAV_ADMIN, NAV_USUARIO, itemAtivo, textoContador } from "./navegacao";
import Avatar from "./ui/Avatar";

const NAV_LINK_BASE =
  "relative flex items-center gap-[0.7rem] rounded-lg border-l-2 border-transparent py-[0.55rem] pr-[0.65rem] pl-[0.375rem] text-[0.8375rem] font-medium text-ink-500 transition-colors hover:text-ink-900 hover:bg-ink-50";
const NAV_LINK_ACTIVE =
  "relative flex items-center gap-[0.7rem] rounded-lg border-l-2 border-brand-400 py-[0.55rem] pr-[0.65rem] pl-[0.375rem] text-[0.8375rem] font-semibold text-brand-700 bg-brand-50";

export default function Sidebar() {
  const { usuario, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const { naoLidas } = useNotificacoes();
  const itens = isAdmin ? NAV_ADMIN : NAV_USUARIO;
  const contador = textoContador(naoLidas);

  return (
    <aside className="relative bg-white text-ink-900 flex h-full w-60 flex-col border-r border-ink-100">
      <Link href={isAdmin ? "/admin" : "/feed"} className="relative flex items-center gap-2.5 px-5 pt-6 pb-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
          <Image src="/logo.png" alt="" width={17} height={17} className="rounded-full" />
        </span>
        <span className="font-display text-[15px] font-bold tracking-tight text-ink-900">
          Pitcher<span className="text-brand-300">X</span>
        </span>
        {isAdmin && (
          <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
            Admin
          </span>
        )}
      </Link>

      <nav aria-label="Navegação principal" className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {itens.map(({ href, label, icon: Icon, emBreve, contadorNotificacoes }) => {
          const ativo = itemAtivo(pathname, href);
          const badge = contadorNotificacoes ? contador : null;
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={ativo ? NAV_LINK_ACTIVE : NAV_LINK_BASE}
            >
              <Icon size={18} strokeWidth={ativo ? 2.25 : 1.75} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
              {badge && (
                <span className="ml-auto min-w-[1.25rem] shrink-0 rounded-full bg-accent-500 px-1.5 py-0.5 text-center text-[10.5px] font-bold leading-none text-white">
                  {badge}
                  <span className="sr-only"> não lidas</span>
                </span>
              )}
              {emBreve && (
                <span className="ml-auto shrink-0 rounded-full bg-ink-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-400">
                  Em breve
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-ink-100 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar url={usuario?.urlImagemUsuario} nome={usuario?.nomeUsuario} tamanho={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-900" title={usuario?.nomeUsuario}>
              {usuario?.nomeUsuario || "—"}
            </p>
            <p className="truncate text-[11px] text-ink-400">{usuario?.emailUsuario}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Sair"
            aria-label="Sair da conta"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-accent-500/10 hover:text-accent-600"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
