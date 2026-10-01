import type { ReactNode } from "react";
import { Briefcase, Compass, House, Menu, User } from "lucide-react";

/**
 * Tela de celular em "pixels virtuais" (390 × 831). O palco escala a tela inteira;
 * por dentro, as páginas usam as mesmas classes do app em telas pequenas
 * (PageShell: px-4 py-8, MobileNav flutuante no rodapé).
 */
export function BarraStatus({ hora, escura = false }: { hora: string; escura?: boolean }) {
  return (
    <div
      className={`flex h-[44px] shrink-0 items-center justify-between px-7 text-[14px] font-semibold ${
        escura ? "text-white" : "text-ink-900"
      }`}
    >
      <span>{hora}</span>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <span className="flex items-end gap-[2px]">
          {[5, 7, 9, 11].map((h) => (
            <span key={h} className={`w-[3px] rounded-sm ${escura ? "bg-white" : "bg-ink-900"}`} style={{ height: h }} />
          ))}
        </span>
        <span className={`ml-1 h-[11px] w-[22px] rounded-[3px] border ${escura ? "border-white/80" : "border-ink-900/80"} p-[1.5px]`}>
          <span className={`block h-full w-[70%] rounded-[1px] ${escura ? "bg-white" : "bg-ink-900"}`} />
        </span>
      </span>
    </div>
  );
}

const ITENS = [
  { chave: "feed", icon: House },
  { chave: "explorar", icon: Compass },
  { chave: "projetos", icon: Briefcase },
  { chave: "perfil", icon: User },
] as const;

/** Réplica do MobileNav (barra inferior flutuante). */
export function DemoMobileNav({ ativo }: { ativo: (typeof ITENS)[number]["chave"] }) {
  return (
    <nav className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-ink-100 bg-white/[0.92] px-2 py-2 shadow-[0_10px_34px_-10px_rgba(21,15,40,0.18)]">
      {ITENS.map(({ chave, icon: Icon }) => (
        <span
          key={chave}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full ${
            ativo === chave ? "bg-brand-gradient text-white shadow-glow" : "text-ink-400"
          }`}
        >
          <Icon size={19} strokeWidth={ativo === chave ? 2.4 : 1.75} aria-hidden="true" />
        </span>
      ))}
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-400">
        <Menu size={19} aria-hidden="true" />
      </span>
    </nav>
  );
}

/** Página do app dentro do celular: fundo do app + barra de status + conteúdo rolável pela timeline. */
export function PaginaApp({
  hx,
  hora,
  nav,
  children,
  sobre,
  className = "",
}: {
  hx: string;
  hora: string;
  nav?: Parameters<typeof DemoMobileNav>[0]["ativo"];
  children: ReactNode;
  /** Camadas fixas sobre a página (avisos, folhas), fora da área rolável. */
  sobre?: ReactNode;
  className?: string;
}) {
  return (
    <div data-hx={hx} className={`hx-pagina absolute inset-0 flex flex-col overflow-hidden bg-[#F7F4FD] ${className}`}>
      <BarraStatus hora={hora} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div data-hx={`${hx}-rolagem`} className="hx-rolagem px-4 pb-28 pt-5">
          {children}
        </div>
      </div>
      {nav && <DemoMobileNav ativo={nav} />}
      {sobre}
    </div>
  );
}
