/**
 * O SubComentarioResponseDTO do backend declara `usuarioId`, mas o SubComentarioMapper não
 * mapeia `usuario.idUsuario → usuarioId`: o campo chega sempre nulo. Sem ele, a interface
 * não saberia quem escreveu cada resposta.
 *
 * Adaptação no front: ao criar uma resposta, guardamos o ID dela (devolvido pelo POST) como
 * "escrita por este usuário neste navegador". Isso permite mostrar autor e liberar editar/
 * excluir as próprias respostas. Se o backend passar a enviar `usuarioId`, ele tem prioridade.
 */

const PREFIXO = "pitcherx:respostas-proprias:";

function chave(usuarioId: number) {
  return `${PREFIXO}${usuarioId}`;
}

export function idsRespostasProprias(usuarioId: number | null | undefined): Set<number> {
  if (!usuarioId || typeof window === "undefined") return new Set();
  try {
    const bruto = window.localStorage.getItem(chave(usuarioId));
    const lista = bruto ? (JSON.parse(bruto) as unknown) : [];
    return new Set(Array.isArray(lista) ? lista.filter((n): n is number => typeof n === "number") : []);
  } catch {
    return new Set();
  }
}

export function registrarRespostaPropria(usuarioId: number, idSubComentario: number) {
  if (typeof window === "undefined") return;
  const ids = idsRespostasProprias(usuarioId);
  ids.add(idSubComentario);
  try {
    window.localStorage.setItem(chave(usuarioId), JSON.stringify([...ids].slice(-500)));
  } catch {
    /* armazenamento indisponível */
  }
}

export function esquecerRespostaPropria(usuarioId: number, idSubComentario: number) {
  if (typeof window === "undefined") return;
  const ids = idsRespostasProprias(usuarioId);
  if (!ids.delete(idSubComentario)) return;
  try {
    window.localStorage.setItem(chave(usuarioId), JSON.stringify([...ids]));
  } catch {
    /* ignora */
  }
}

/** Autor efetivo de uma resposta: o do backend, se vier; senão, o usuário logado se a resposta for dele. */
export function autorDaResposta(
  resposta: { idSubComentario: number; usuarioId?: number | null },
  usuarioLogadoId: number | null | undefined,
  proprias: Set<number>
): number | null {
  if (typeof resposta.usuarioId === "number" && resposta.usuarioId > 0) return resposta.usuarioId;
  if (usuarioLogadoId && proprias.has(resposta.idSubComentario)) return usuarioLogadoId;
  return null;
}
