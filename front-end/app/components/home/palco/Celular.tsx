import type { ReactNode } from "react";

/** Tamanho da tela em pixels virtuais (mesma proporção da tela do celular das fotos: 0,469). */
export const TELA_CELULAR = { w: 390, h: 831 } as const;
/** Borda (moldura) em pixels virtuais. */
export const MOLDURA_CELULAR = 12;

/**
 * Celular em HTML/CSS. Tamanho base = tela + moldura, com transform-origin 0 0:
 * o motor posiciona/escala o aparelho inteiro (x, y, scale) e a interface acompanha.
 */
export default function Celular({
  hx,
  luz = "neutra",
  children,
  className = "",
}: {
  hx: string;
  luz?: "quente" | "fria" | "neutra";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-hx={hx} className={`hx-celular hx-celular--${luz} ${className}`} aria-hidden="true">
      <div className="hx-celular-tela" data-hx={`${hx}-tela`}>
        {children}
      </div>
    </div>
  );
}
