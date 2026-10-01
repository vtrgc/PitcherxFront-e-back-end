/** Indicador de cena ("03 / 10 — Entrando") + barra de progresso. Atualizado pelo motor sem React. */
export default function Indicador() {
  return (
    <div className="hx-indicador" aria-hidden="true">
      <p className="hx-indicador-texto">
        <span data-hx="ind-num">01</span>
        <span className="hx-indicador-total"> / 10</span>
        <span className="hx-indicador-sep"> — </span>
        <span data-hx="ind-rotulo">A ideia</span>
      </p>
      <span className="hx-indicador-trilho">
        <span data-hx="ind-barra" className="hx-indicador-barra" />
      </span>
    </div>
  );
}
