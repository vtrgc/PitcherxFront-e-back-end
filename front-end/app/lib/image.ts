import { API_URL } from "./api";

export function isValidImageUrl(url?: string | null): url is string {
  if (!url) return false;
  const value = url.trim();
  if (!value) return false;

  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolve a URL de uma imagem vinda do backend para algo que o navegador carregue.
 * O backend pode devolver um caminho relativo ("/uploads/x.png", conforme
 * UPLOAD_BASE_URL), que é relativo ao domínio da API e não ao do front-end.
 */
export function resolverUrlImagem(url?: string | null): string | null {
  if (!isValidImageUrl(url)) return null;
  const value = url.trim();
  return value.startsWith("/") ? `${API_URL}${value}` : value;
}

/**
 * Aceita apenas links http(s) para uso em `href` externos (ex.: LinkedIn),
 * evitando `javascript:` e outros esquemas perigosos vindos de dados do usuário.
 * Links sem protocolo ("linkedin.com/in/x") ganham "https://".
 */
export function linkExternoSeguro(url?: string | null): string | null {
  if (!url) return null;
  let value = url.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Valida um caminho interno para redirecionamento pós-login (evita open redirect):
 * precisa começar com "/" e não pode ser "//host" nem "/\host".
 */
export function caminhoInternoSeguro(caminho?: string | null): string | null {
  if (!caminho) return null;
  if (!caminho.startsWith("/") || caminho.startsWith("//") || caminho.startsWith("/\\")) return null;
  if (caminho.startsWith("/auth/")) return null;
  return caminho;
}
