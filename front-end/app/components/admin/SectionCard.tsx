"use client";

import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actionHref,
  actionLabel,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white transition-[box-shadow,border-color,transform] duration-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon size={19} />
          </div>
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[0.75rem] text-ink-500">{subtitle}</p>}
          </div>
        </div>

        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ink-200 px-3.5 py-2 text-[12.5px] font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            {actionLabel}
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
