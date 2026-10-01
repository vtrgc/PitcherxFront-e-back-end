import type { ReactNode } from "react";

/** Tela do notebook em pixels virtuais (mesma proporção da tela do notebook da foto 03). */
export const TELA_LAPTOP = { w: 1280, h: 772 } as const;
export const MOLDURA_LAPTOP = 16;

/** Notebook em HTML/CSS (tampa + base). Mesmo esquema de transformação do Celular. */
export default function Laptop({ hx, children }: { hx: string; children: ReactNode }) {
  return (
    <div data-hx={hx} className="hx-laptop" aria-hidden="true">
      <div className="hx-laptop-tampa">
        <div className="hx-laptop-tela" data-hx={`${hx}-tela`}>
          {children}
        </div>
      </div>
      <div className="hx-laptop-base" />
    </div>
  );
}
