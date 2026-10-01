import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative bg-white text-ink-900 border-t border-ink-100">
      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
            <Image src="/logo.png" alt="PitcherX" width={18} height={18} className="rounded-full" />
          </span>
          <span className="font-display text-[15px] font-bold text-ink-900">
            Pitcher<span className="text-brand-500">X</span>
          </span>
        </div>

        <div className="mt-8 border-t border-ink-100 pt-6 text-center text-[13px] text-ink-400">
          © 2026 PitcherX. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
