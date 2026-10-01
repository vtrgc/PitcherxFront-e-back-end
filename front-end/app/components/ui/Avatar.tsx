"use client";

import { useState } from "react";
import { resolverUrlImagem } from "../../lib/image";

/**
 * Foto de perfil com fallback para /avatar.png quando não há foto ou ela falha ao carregar.
 * Usa <img> (e não next/image) porque a URL vem do backend e pode ser de qualquer host.
 */
export default function Avatar({
  url,
  nome,
  tamanho = 40,
  className = "rounded-full border-2 border-white object-cover",
  moldura = true,
}: {
  url?: string | null;
  nome?: string;
  tamanho?: number;
  className?: string;
  moldura?: boolean;
}) {
  // `blob:` = prévia local de um arquivo escolhido pelo usuário (URL.createObjectURL),
  // ainda não enviado ao servidor.
  const resolvida = url && url.startsWith("blob:") ? url : resolverUrlImagem(url);
  const [falhou, setFalhou] = useState<string | null>(null);
  const src = resolvida && falhou !== resolvida ? resolvida : "/avatar.png";

  const imagem = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={nome ? `Foto de ${nome}` : ""}
      width={tamanho}
      height={tamanho}
      loading="lazy"
      onError={() => resolvida && setFalhou(resolvida)}
      className={className}
      style={{ width: tamanho, height: tamanho }}
    />
  );

  if (!moldura) return imagem;
  return (
    <span className="inline-flex shrink-0 rounded-full bg-gradient-to-br from-accent-400 via-brand-500 to-brand-800 p-[2px]">
      {imagem}
    </span>
  );
}
