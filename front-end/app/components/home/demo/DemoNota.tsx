import { NOTA } from "./dados";
import { BarraStatus } from "./DemoTela";

/**
 * Bloco de notas genérico (não imita nenhum aplicativo real): é onde a ideia vive
 * antes do PitcherX. As linhas são "digitadas" pela timeline (data-digitar).
 */
export default function DemoNota() {
  return (
    <div data-hx="nota" className="hx-nota absolute inset-0 flex flex-col bg-[#15131a] text-white">
      <BarraStatus hora="23:47" escura />
      <div data-hx="nota-conteudo" className="px-7 pt-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/45">Hoje, 23:47</p>
        <p className="mt-3 font-display text-[30px] font-bold tracking-[-0.02em] text-white">{NOTA.titulo}</p>
        <div className="mt-5 space-y-2 text-[20px] leading-[1.45] text-white/85">
          {NOTA.linhas.map((linha, i) => (
            <p key={i} data-hx="nota-linha" data-digitar={linha} className="min-h-[1.45em]">
              {linha}
            </p>
          ))}
        </div>
        <span data-hx="cursor" className="hx-cursor mt-1 inline-block h-[24px] w-[2px] bg-[#BEA0FF]" />
      </div>
      {/* ponto de luz em que a nota se transforma (cena 03) */}
      <span data-hx="ponto" className="hx-ponto absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full" />
    </div>
  );
}
