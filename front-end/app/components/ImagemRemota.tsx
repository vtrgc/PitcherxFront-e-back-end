"use client";

import { useState } from "react";
import { resolverUrlImagem } from "../lib/image";

/**
 * Imagem informada pelo usuário (URL arbitrária). Usa <img> em vez de next/image para
 * não transformar o servidor do Next em proxy de qualquer host, e some se falhar.
 */
export default function ImagemRemota({ url, alt, className = "" }: { url?: string | null; alt: string; className?: string }) {
  const src = resolverUrlImagem(url);
  const [falhou, setFalhou] = useState(false);
  if (!src || falhou) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
