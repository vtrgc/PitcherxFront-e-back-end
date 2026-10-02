import { redirect } from "next/navigation";

/**
 * Endereço antigo do link de compartilhamento (`/comentarios/{idPostagem}`). Continua
 * funcionando para links já enviados, mas leva à página da publicação.
 */
export default async function ComentariosDaPostagemRedirect({ params }: { params: Promise<{ postagemId: string }> }) {
  const { postagemId } = await params;
  redirect(`/publicacao/${encodeURIComponent(postagemId)}`);
}
