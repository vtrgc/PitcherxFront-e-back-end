import type { CSSProperties, ReactNode } from "react";
import { getImageProps } from "next/image";
import { FOTOS, MEDIA_RETRATO, type Foto, type VarianteFoto } from "../fotos";

function srcset(v: VarianteFoto, ext: "avif" | "webp") {
  return v.larguras.map((l) => `${v.base}-${l}.${ext} ${l}w`).join(", ");
}

/**
 * <picture> com AVIF + WebP, paisagem/retrato (art direction) e <img> gerado por next/image
 * (getImageProps). `adiado`: a imagem só é baixada quando o motor pede (data-src → src),
 * para não carregar todas as fotos grandes de uma vez.
 */
export function ImagemFoto({
  foto,
  prioridade = false,
  adiado = false,
  sizes = "100vw",
  className = "",
}: {
  foto: Foto;
  prioridade?: boolean;
  adiado?: boolean;
  sizes?: string;
  className?: string;
}) {
  const { paisagem, retrato } = foto;
  const { props } = getImageProps({
    src: `${paisagem.base}-${paisagem.larguras[1]}.webp`,
    alt: foto.alt,
    width: paisagem.w,
    height: paisagem.h,
    sizes,
    unoptimized: true,
    fetchPriority: prioridade ? "high" : undefined,
    loading: prioridade ? "eager" : "lazy",
  });
  const { src, ...resto } = props;
  const attr = (nome: "srcSet" | "src", valor: string) =>
    adiado ? { [nome === "srcSet" ? "data-srcset" : "data-src"]: valor } : { [nome]: valor };
  const estiloFoco = { "--fx": `${paisagem.foco[0] * 100}%`, "--fy": `${paisagem.foco[1] * 100}%`, "--rfx": `${retrato.foco[0] * 100}%`, "--rfy": `${retrato.foco[1] * 100}%` } as CSSProperties;

  return (
    <picture className={`hx-picture ${className}`} style={estiloFoco}>
      <source type="image/avif" media={MEDIA_RETRATO} sizes={sizes} {...attr("srcSet", srcset(retrato, "avif"))} />
      <source type="image/webp" media={MEDIA_RETRATO} sizes={sizes} {...attr("srcSet", srcset(retrato, "webp"))} />
      <source type="image/avif" sizes={sizes} {...attr("srcSet", srcset(paisagem, "avif"))} />
      <source type="image/webp" sizes={sizes} {...attr("srcSet", srcset(paisagem, "webp"))} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt vem de getImageProps */}
      <img {...resto} {...attr("src", src)} decoding="async" />
    </picture>
  );
}

function varsTela(v: VarianteFoto, prefixo: string) {
  if (!v.tela) return {};
  return {
    [`--${prefixo}x`]: `${v.tela.x * 100}%`,
    [`--${prefixo}y`]: `${v.tela.y * 100}%`,
    [`--${prefixo}w`]: `${v.tela.w * 100}%`,
    [`--${prefixo}h`]: `${v.tela.h * 100}%`,
  };
}

/**
 * Camada de fotografia do palco. Estrutura:
 *   .hx-foto (máscara/opacidade) > .hx-quadro (enquadramento "cover", posto pelo motor)
 *   > .hx-zoom (câmera: x, y, scale) > imagem + tela HTML exatamente sobre a tela da foto.
 * Imagem e tela ficam dentro do mesmo .hx-zoom, então nunca desalinham durante o zoom.
 */
export default function FotoCena({
  id,
  prioridade = false,
  tela,
}: {
  id: Foto["id"];
  prioridade?: boolean;
  /** Conteúdo HTML exibido dentro da tela do aparelho da foto (em pixels virtuais). */
  tela?: ReactNode;
}) {
  const foto = FOTOS[id];
  const estilo = {
    ...varsTela(foto.paisagem, "tp-"),
    ...varsTela(foto.retrato, "tr-"),
    "--fxn": foto.paisagem.foco[0],
    "--fyn": foto.paisagem.foco[1],
    "--rfxn": foto.retrato.foco[0],
    "--rfyn": foto.retrato.foco[1],
  } as CSSProperties;
  return (
    <div data-foto={id} className={`hx-foto hx-foto--${id}`} style={estilo}>
      <div className="hx-quadro" data-hx={`quadro-${id}`}>
        <div className="hx-zoom" data-hx={`zoom-${id}`}>
          <ImagemFoto foto={foto} prioridade={prioridade} adiado={!prioridade} />
          {tela && (
            <div className="hx-tela-foto" data-hx={`tela-${id}`} aria-hidden="true">
              <div className="hx-tela-virtual" data-hx={`tela-${id}-virtual`}>
                {tela}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="hx-escuro" data-hx={`escuro-${id}`} />
      <div className="hx-veu" data-hx={`veu-${id}`} />
    </div>
  );
}
