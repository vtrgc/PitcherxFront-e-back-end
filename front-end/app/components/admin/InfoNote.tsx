"use client";

import { Info } from "lucide-react";
import { ReactNode } from "react";

export default function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-ink-100 bg-ink-25 px-3.5 py-2.5 text-[0.75rem] leading-[1.5] text-ink-500">
      <Info size={14} className="mt-[1px] shrink-0 text-ink-400" />
      <p>{children}</p>
    </div>
  );
}
