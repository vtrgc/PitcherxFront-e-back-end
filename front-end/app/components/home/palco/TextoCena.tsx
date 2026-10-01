import { Fragment, type ReactNode } from "react";

/** Divide "Uma *ideia* aqui" em palavras; *palavra* ganha destaque. */
export function palavras(texto: string) {
  return texto.split(" ").map((p) => {
    const m = p.match(/^\*(.+)\*([.,!?…]*)$/);
    return m ? { texto: m[1], sufixo: m[2], destaque: true } : { texto: p, sufixo: "", destaque: false };
  });
}

export function textoLimpo(texto: string) {
  return texto.replace(/\*/g, "");
}

/**
 * Título animado palavra por palavra. O texto completo existe para leitores de tela;
 * a versão dividida é decorativa (aria-hidden).
 */
export function TituloAnimado({
  texto,
  nivel = 2,
  className = "",
}: {
  texto: string;
  nivel?: 1 | 2;
  className?: string;
}) {
  const Tag = nivel === 1 ? "h1" : "h2";
  return (
    <Tag className={`hx-titulo ${className}`}>
      <span className="hx-sr">{textoLimpo(texto)}</span>
      <span aria-hidden="true" className="hx-titulo-visual">
        {palavras(texto).map((p, i) => (
          <Fragment key={i}>
            <span className="hx-palavra-caixa">
              <span data-hx="palavra" className={`hx-palavra ${p.destaque ? "hx-destaque" : ""}`}>
                {p.texto}
                {p.sufixo}
              </span>
            </span>{" "}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}

/**
 * Bloco de texto de uma cena: rótulo numerado, título (h1 só na cena 01) e apoio.
 * A posição (esquerda / direita / centro / topo no celular) vem de classes CSS.
 */
export default function TextoCena({
  cena,
  rotulo,
  titulo,
  apoio,
  nivel = 2,
  posicao = "esquerda",
  children,
}: {
  cena: string;
  rotulo?: string;
  titulo: string;
  apoio?: string;
  nivel?: 1 | 2;
  posicao?: "esquerda" | "direita" | "centro" | "topo";
  children?: ReactNode;
}) {
  return (
    <div data-texto={cena} className={`hx-texto hx-texto--${posicao}`}>
      <div className="hx-texto-caixa">
        {rotulo && (
          <p data-hx="rotulo" className="hx-rotulo">
            <span aria-hidden="true" className="hx-rotulo-traco" />
            {rotulo}
          </p>
        )}
        <TituloAnimado texto={titulo} nivel={nivel} />
        {apoio && (
          <p data-hx="apoio" className="hx-apoio">
            {apoio}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
