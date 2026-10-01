"use client";

import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import { CarregandoSessao } from "../components/PageShell";
import { useRequireAdmin } from "../hook/useRequireAdmin";

/**
 * Layout da área administrativa. O dashboard (/admin) é a página inicial do administrador.
 * A proteção aqui é de navegação; cada operação é autorizada pelo backend (@PreAuthorize).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pronto } = useRequireAdmin();

  if (!pronto) {
    return <CarregandoSessao />;
  }

  return (
    <div className="min-h-screen w-full bg-transparent pb-24 lg:pb-0">
      <div className="flex">
        <div className="shadow-stage hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0">
          <Sidebar />
        </div>

        <main id="conteudo" className="min-w-0 flex-1 space-y-6 px-4 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
