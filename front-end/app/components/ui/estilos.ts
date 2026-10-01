/**
 * Classes Tailwind repetidas nas telas do PitcherX, extraídas das páginas existentes
 * (mesmo visual) para reaproveitar nos formulários novos/corrigidos.
 */
export const cls = {
  card: "rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200",
  input:
    "w-full rounded-[0.625rem] border-[1.5px] border-ink-200 bg-ink-25 px-[0.9rem] py-[0.7rem] text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,60,245,0.12)] disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed aria-[invalid=true]:border-red-400",
  label: "mb-[0.4rem] block text-[0.8125rem] font-semibold text-ink-700",
  btnBase:
    "inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed",
  btnPrimario:
    "inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700 hover:shadow-[0_2px_6px_-1px_rgba(107,33,224,0.35)]",
  btnSecundario:
    "inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-ink-100 text-ink-900 hover:bg-ink-200",
  btnContorno:
    "inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed border border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
  btnPerigo:
    "inline-flex items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-[1.15rem] py-[0.625rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-transparent text-[#DC2626] border-[1.5px] border-[#FCA5A5] hover:bg-[#FEF2F2] hover:border-[#DC2626]",
  btnIcone:
    "inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-brand-50 hover:text-brand-700",
  btnIconePerigo:
    "inline-flex items-center justify-center w-[2.35rem] h-[2.35rem] rounded-full text-ink-500 transition-colors hover:-translate-y-px active:scale-[0.92] disabled:opacity-55 disabled:cursor-not-allowed hover:bg-[#FEF2F2] hover:text-[#DC2626]",
  eyebrow: "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-500",
  h1: "font-display mt-2 text-[1.75rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink-900",
  h2: "font-display text-[1.1875rem] font-bold leading-[1.4] text-ink-900",
  texto: "text-[0.9375rem] leading-[1.65] text-ink-700",
  textoSuave: "text-[0.8125rem] text-ink-500",
  chip: "inline-flex items-center gap-[0.35rem] rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold leading-[1.5] bg-brand-50 text-brand-700 border border-brand-100",
  chipAtivo: "inline-flex items-center gap-[0.35rem] rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold leading-[1.5] bg-[#ECFDF3] text-[#05603A]",
  chipInativo: "inline-flex items-center gap-[0.35rem] rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold leading-[1.5] bg-ink-50 text-ink-500 border border-ink-200",
  composer:
    "relative py-6 pl-5 border-b border-ink-100 before:content-[''] before:absolute before:left-0 before:top-[0.35rem] before:bottom-[0.35rem] before:w-[2px] before:rounded-full before:bg-brand-300 before:opacity-50 max-w-2xl",
  linha: "relative py-6 border-b border-ink-100 transition-colors first:pt-1 last:border-b-0",
  skeleton:
    "relative overflow-hidden bg-ink-100 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:animate-skeleton-sweep",
};
