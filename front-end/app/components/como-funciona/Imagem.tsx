import { getImageProps } from "next/image";
import { MEDIA_RETRATO, type Imagem as TImagem, type Variante } from "./imagens";

function srcset(v: Variante, ext: "avif" | "webp") {
  return v.larguras.map((l) => `${v.base}-${l}.${ext} ${l}w`).join(", ");
}

/** <picture> com AVIF + WebP (e variante vertical opcional); o <img> vem de next/image. */
export default function Imagem({
  imagem,
  sizes,
  prioridade = false,
  className = "",
  decorativa = false,
}: {
  imagem: TImagem;
  sizes: string;
  prioridade?: boolean;
  className?: string;
  decorativa?: boolean;
}) {
  const { principal, retrato } = imagem;
  const { props } = getImageProps({
    src: `${principal.base}-${principal.larguras[1] ?? principal.larguras[0]}.webp`,
    alt: decorativa ? "" : imagem.alt,
    width: principal.w,
    height: principal.h,
    sizes,
    unoptimized: true,
    fetchPriority: prioridade ? "high" : undefined,
    loading: prioridade ? "eager" : "lazy",
  });
  return (
    <picture className={className}>
      {retrato && <source type="image/avif" media={MEDIA_RETRATO} sizes={sizes} srcSet={srcset(retrato, "avif")} />}
      {retrato && <source type="image/webp" media={MEDIA_RETRATO} sizes={sizes} srcSet={srcset(retrato, "webp")} />}
      <source type="image/avif" sizes={sizes} srcSet={srcset(principal, "avif")} />
      <source type="image/webp" sizes={sizes} srcSet={srcset(principal, "webp")} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt vem de getImageProps */}
      <img {...props} decoding="async" />
    </picture>
  );
}
