/**
 * Cartões "fantasma" do feed e do Explorar: só a forma dos cartões reais
 * (PostCardSkeleton / cartão de projeto), sem nomes, textos ou números inventados.
 */
function Bloco({ className }: { className: string }) {
  return <span className={`block rounded-md bg-ink-100 ${className}`} />;
}

export default function CartaoFantasma({ tipo = "publicacao", className = "" }: { tipo?: "publicacao" | "projeto"; className?: string }) {
  if (tipo === "projeto") {
    return (
      <div className={`overflow-hidden rounded-2xl border border-ink-100 bg-white ${className}`}>
        <div className="h-24 w-full bg-brand-gradient-soft" />
        <div className="p-5">
          <span className="inline-block h-5 w-20 rounded-full border border-brand-100 bg-brand-50" />
          <Bloco className="mt-3 h-4 w-3/4" />
          <Bloco className="mt-2 h-3 w-full" />
          <Bloco className="mt-2 h-3 w-2/3" />
        </div>
      </div>
    );
  }
  return (
    <div className={`rounded-2xl border border-ink-100 bg-white p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 shrink-0 rounded-full bg-ink-100" />
        <div className="flex-1 space-y-2">
          <Bloco className="h-3.5 w-40 max-w-full" />
          <Bloco className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <Bloco className="h-5 w-3/4" />
        <Bloco className="h-3.5 w-full" />
        <Bloco className="h-3.5 w-11/12" />
        <Bloco className="h-3.5 w-2/3" />
      </div>
      <div className="mt-6 flex gap-6 border-t border-ink-100 pt-4">
        <Bloco className="h-4 w-16" />
        <Bloco className="h-4 w-16" />
        <Bloco className="h-4 w-16" />
      </div>
    </div>
  );
}
