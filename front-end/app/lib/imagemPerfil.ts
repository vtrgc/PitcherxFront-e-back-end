/**
 * Regras de upload da foto de perfil — espelham exatamente o que o backend aceita em
 * `POST /usuario/{id}/foto` (multipart/form-data, campo "arquivo"):
 *
 *  - `ImagemUploadUtil.EXTENSOES_PERMITIDAS` = .jpg, .jpeg, .png, .webp
 *    (o servidor olha a EXTENSÃO do nome do arquivo, sem diferenciar maiúsculas);
 *  - `ImagemUploadUtil.TAMANHO_MAXIMO_BYTES` = 10 MB
 *    (também `spring.servlet.multipart.max-file-size: 10MB`).
 *
 * O front repete essas regras só para avisar antes de enviar; quem decide é o servidor.
 */

export const EXTENSOES_FOTO = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const TIPOS_MIME_FOTO = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024;

/** Valor para o atributo `accept` do <input type="file">. */
export const ACCEPT_FOTO = [...EXTENSOES_FOTO, ...TIPOS_MIME_FOTO].join(",");

export function extensaoDoArquivo(nome: string): string {
  const i = nome.lastIndexOf(".");
  return i >= 0 ? nome.slice(i).toLowerCase() : "";
}

/**
 * Validação síncrona (nome, tipo e tamanho). Retorna a mensagem de erro ou null.
 * `arquivo` usa um tipo estrutural para permitir testes fora do navegador.
 */
export function validarArquivoFoto(arquivo: { name: string; size: number; type: string }): string | null {
  const extensao = extensaoDoArquivo(arquivo.name);
  if (!EXTENSOES_FOTO.includes(extensao as (typeof EXTENSOES_FOTO)[number])) {
    return "Formato não suportado. Envie uma imagem JPG, PNG ou WEBP.";
  }
  // O navegador pode não informar o MIME (string vazia); nesse caso a decodificação decide.
  if (arquivo.type && !TIPOS_MIME_FOTO.includes(arquivo.type as (typeof TIPOS_MIME_FOTO)[number])) {
    return "O arquivo selecionado não é uma imagem JPG, PNG ou WEBP válida.";
  }
  if (arquivo.size <= 0) return "O arquivo está vazio.";
  if (arquivo.size > TAMANHO_MAXIMO_FOTO) return "A imagem excede o tamanho máximo de 10 MB aceito pelo servidor.";
  return null;
}

/**
 * Confirma que o navegador consegue decodificar a imagem (arquivo corrompido ou com
 * extensão trocada — ex.: um .pdf renomeado para .jpg — falha aqui, antes do envio).
 */
export function verificarImagemLegivel(url: string): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) reject(new Error("imagem vazia"));
      else resolve({ largura: img.naturalWidth, altura: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("imagem ilegível"));
    img.src = url;
  });
}

/** Alteração de foto pendente (ainda não enviada ao servidor). */
export type FotoPendente =
  | { tipo: "nova"; arquivo: File; previewUrl: string }
  | { tipo: "remover" }
  | null;

/**
 * Prepara um arquivo escolhido pelo usuário: valida, gera a prévia e verifica se a
 * imagem é legível. Em caso de erro, libera a URL temporária.
 */
export async function prepararFoto(arquivo: File): Promise<{ ok: true; foto: FotoPendente } | { ok: false; erro: string }> {
  const erro = validarArquivoFoto(arquivo);
  if (erro) return { ok: false, erro };
  let previewUrl: string;
  try {
    previewUrl = URL.createObjectURL(arquivo);
  } catch {
    return { ok: false, erro: "Não foi possível ler o arquivo selecionado." };
  }
  try {
    await verificarImagemLegivel(previewUrl);
  } catch {
    URL.revokeObjectURL(previewUrl);
    return { ok: false, erro: "Não foi possível ler esta imagem. O arquivo pode estar corrompido ou não ser uma imagem." };
  }
  return { ok: true, foto: { tipo: "nova", arquivo, previewUrl } };
}

export function liberarFoto(foto: FotoPendente) {
  if (foto?.tipo === "nova") {
    try {
      URL.revokeObjectURL(foto.previewUrl);
    } catch {
      /* ignora */
    }
  }
}
