"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import PerfilCard from "./PerfilCard";
import { useRequireAuth, AreaPagina } from "../hook/useRequireAuth";

/**
 * Moldura das páginas autenticadas (sidebar, navegação mobile e coluna lateral).
 * Também protege a rota: sem sessão => login; administrador em página exclusiva de
 * usuário comum (area="usuario") => dashboard administrativo.
 */
export default function PageShell({
  children,
  rightRail,
  area = "autenticado",
}: {
  children: ReactNode;
  rightRail?: ReactNode;
  area?: AreaPagina;
}) {
  const { pronto, isAdmin } = useRequireAuth(area);

  if (!pronto) {
    return <CarregandoSessao />;
  }

  const coluna = rightRail !== undefined ? rightRail : isAdmin ? null : <PerfilCard />;
  // rightRail={null} explícito: a página usa a largura toda (sem reservar a coluna lateral).
  const larguraTotal = rightRail === null;

  return (
    <div className="min-h-screen w-full bg-transparent pb-24 lg:pb-0">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <div className="flex w-full">
        <div className="shadow-stage hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0">
          <Sidebar />
        </div>

        <div
          className={
            larguraTotal
              ? "flex min-w-0 flex-1"
              : "flex min-w-0 flex-1 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]"
          }
        >
          <main id="conteudo" className="min-w-0 flex-1 space-y-6 px-4 py-8 sm:px-8 lg:px-10 xl:px-12">
            {children}
          </main>

          {coluna && (
            <aside className="hidden self-start px-6 py-8 xl:sticky xl:top-0 xl:block xl:max-h-screen xl:overflow-y-auto 2xl:px-8">
              {coluna}
            </aside>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}

export function CarregandoSessao() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <Loader2 size={28} className="animate-spin text-brand-500" aria-hidden="true" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
