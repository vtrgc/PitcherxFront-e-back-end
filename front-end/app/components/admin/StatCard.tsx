"use client";

import { LucideIcon } from "lucide-react";

type Accent = "brand" | "accent" | "ink" | "success";

const ACCENT_CLASSES: Record<Accent, string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  ink: "bg-ink-50 text-ink-600",
  success: "bg-[#ECFDF3] text-[#05603A]",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent = "brand",
  loading = false,
  indisponivel = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: Accent;
  loading?: boolean;
  indisponivel?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 p-4 sm:p-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENT_CLASSES[accent]}`}>
          <Icon size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.75rem] font-semibold leading-snug text-ink-500 sm:truncate" title={label}>{label}</p>

          {loading ? (
            <div className="relative mt-1.5 h-6 w-16 overflow-hidden rounded-md bg-ink-100 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent after:animate-skeleton-sweep" />
          ) : indisponivel ? (
            <p className="font-display text-[1.25rem] font-extrabold leading-tight text-ink-300">—</p>
          ) : (
            <p className="font-display text-[1.375rem] font-extrabold leading-tight text-ink-900">{value}</p>
          )}

          {!loading && (
            <p className={`mt-0.5 text-[0.6875rem] leading-snug sm:truncate ${indisponivel ? "italic text-ink-400" : "text-ink-400"}`}>
              {indisponivel ? "Não disponível na API" : sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
