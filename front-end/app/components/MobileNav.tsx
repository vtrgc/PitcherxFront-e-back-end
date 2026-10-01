"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Briefcase, User, ShieldCheck, Users, FileText, Menu, X, LogOut, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotificacoes } from "../context/NotificacoesContext";
import { NAV_ADMIN, NAV_USUARIO, itemAtivo, textoContador } from "./navegacao";

const ITENS_USUARIO = [
  { href: "/feed", label: "Início", icon: House },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/perfil", label: "Perfil", icon: User },
];

const ITENS_ADMIN = [
  { href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/projetos", label: "Projetos", icon: Briefcase },
  { href: "/admin/postagens", label: "Postagens", icon: FileText },
];

/** Barra inferior em telas pequenas + menu "Mais" com todas as seções (inclusive as da sidebar). */
export default function MobileNav() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const { naoLidas } = useNotificacoes();
  const contador = textoContador(naoLidas);
  const [menuAberto, setMenuAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);

  const itens = isAdmin ? ITENS_ADMIN : ITENS_USUARIO;
  const todos = isAdmin ? NAV_ADMIN : NAV_USUARIO;

  // Fecha o menu ao navegar (ajuste de estado durante a renderização, sem efeito).
  const [caminhoAnterior, setCaminhoAnterior] = useState(pathname);
  if (caminhoAnterior !== pathname) {
    setCaminhoAnterior(pathname);
    setMenuAberto(false);
  }

  useEffect(() => {
    if (!menuAberto) return;
    painelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [menuAberto]);

  return (
    <>
      {menuAberto && (
        <div className="fixed inset-0 z-50 bg-void/30 lg:hidden" onClick={() => setMenuAberto(false)}>
          <div
            ref={painelRef}
            id="menu-mais"
            role="dialog"
            aria-modal="true"
            aria-label="Todas as seções"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 bottom-24 max-h-[70vh] overflow-y-auto rounded-2xl border border-ink-100 bg-white p-3 shadow-[0_20px_50px_-20px_rgba(21,15,40,0.45)]"
          >
            <ul className="grid grid-cols-2 gap-1">
              {todos.map(({ href, label, icon: Icon, emBreve, contadorNotificacoes }) => {
                const ativo = itemAtivo(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={ativo ? "page" : undefined}
                      onClick={() => setMenuAberto(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold ${
                        ativo ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                      }`}
                    >
                      <Icon size={17} aria-hidden="true" className="shrink-0" />
                      <span className="truncate">{label}</span>
                      {emBreve && <span className="ml-auto text-[9px] font-bold uppercase text-ink-400">breve</span>}
                      {contadorNotificacoes && contador && (
                        <span className="ml-auto rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {contador}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              <li className="col-span-2 border-t border-ink-100 pt-1">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-accent-600 hover:bg-accent-50"
                >
                  <LogOut size={17} aria-hidden="true" />
                  Sair
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      <nav
        aria-label="Navegação rápida"
        className="bg-white/[0.92] backdrop-blur-[18px] fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-ink-100 px-2 py-2 shadow-[0_10px_34px_-10px_rgba(21,15,40,0.18)] lg:hidden"
      >
        {itens.map(({ href, label, icon: Icon }) => {
          const ativo = itemAtivo(pathname, href);
          const badge = href === "/notificacoes" ? contador : null;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={badge ? `${label} (${badge} não lidas)` : label}
              aria-current={ativo ? "page" : undefined}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                ativo ? "bg-brand-gradient text-white shadow-glow" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              <Icon size={19} strokeWidth={ativo ? 2.4 : 1.75} aria-hidden="true" />
              {badge && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full border-2 border-white bg-accent-500 px-1 text-center text-[9.5px] font-bold leading-[0.95rem] text-white"
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? "Fechar menu" : "Mais seções"}
          aria-expanded={menuAberto}
          aria-controls="menu-mais"
          className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all ${
            menuAberto ? "bg-ink-900 text-white" : "text-ink-400 hover:text-ink-900"
          }`}
        >
          {menuAberto ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      </nav>
    </>
  );
}
