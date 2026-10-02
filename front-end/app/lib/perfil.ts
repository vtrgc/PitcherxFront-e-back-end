/**
 * Regras dos dados de perfil que o backend REALMENTE armazena.
 *
 *  - Perfil profissional (`PerfilUsuarioRequestDTO`): identificador (CPF/CNPJ) e
 *    idEspecialidade são obrigatórios. O LinkedIn é OPCIONAL na interface, mas o DTO exige
 *    `linkedin` não vazio (@NotBlank): quando a pessoa não informa, o front envia o marcador
 *    `LINKEDIN_NAO_INFORMADO` e o trata como "sem LinkedIn" ao ler (ver `linkedinDoPerfil`).
 *    Colunas: `linkedin VARCHAR(80)`, `identificador VARCHAR(18)`.
 *  - Endereço (`EnderecoRequestDTO`): cep (≤ 8), uf (2), bairro, logradouro, complemento
 *    e numeroCasa obrigatórios. Colunas originais: bairro/logradouro VARCHAR(155).
 *
 * Bio, "sobre mim", banner, cargo, empresa, formação, competências, interesses e nome de
 * usuário NÃO existem no backend e por isso não são oferecidos na interface.
 */

import { linkExternoSeguro } from "./image";
import { documentoValido, formatarDocumento, somenteDigitos } from "./validacao";
import { Endereco, EnderecoRequest, UFS } from "../types/Endereco";
import { PerfilUsuario, PerfilUsuarioRequest } from "../types/PerfilUsuario";

export const LINKEDIN_MAX = 80;

/**
 * Valor gravado no campo `linkedin` quando a pessoa não informa o LinkedIn. O backend exige
 * o campo preenchido; este marcador nunca é exibido nem vira link.
 */
export const LINKEDIN_NAO_INFORMADO = "nao-informado";

/** O valor guardado é um LinkedIn de verdade (não vazio e não o marcador)? */
export function linkedinInformado(valor?: string | null): boolean {
  const v = (valor ?? "").trim();
  return !!v && v.toLowerCase() !== LINKEDIN_NAO_INFORMADO;
}

/** Link seguro do LinkedIn de um perfil, ou null quando não informado. */
export function linkedinDoPerfil(perfil: Pick<PerfilUsuario, "linkedin"> | null | undefined): string | null {
  return linkedinInformado(perfil?.linkedin) ? linkExternoSeguro(perfil!.linkedin) : null;
}
export const TEXTO_ENDERECO_MAX = 155;

// ---------------------------------------------------------------------------
// Perfil profissional
// ---------------------------------------------------------------------------

export interface CamposProfissionalValor {
  linkedin: string;
  identificador: string;
  idEspecialidade: number | "";
}

export type ErrosProfissional = Partial<Record<keyof CamposProfissionalValor, string>>;

export function profissionalInicial(perfil: PerfilUsuario | null): CamposProfissionalValor {
  return {
    linkedin: linkedinInformado(perfil?.linkedin) ? perfil!.linkedin : "",
    identificador: perfil?.identificador ?? "",
    idEspecialidade: perfil?.especialidade?.idEspecialidade ?? "",
  };
}

export function profissionalVazio(v: CamposProfissionalValor): boolean {
  return !v.linkedin.trim() && !v.identificador.trim() && !v.idEspecialidade;
}

export function profissionalIgual(a: CamposProfissionalValor, b: CamposProfissionalValor): boolean {
  return (
    a.linkedin.trim() === b.linkedin.trim() &&
    somenteDigitos(a.identificador) === somenteDigitos(b.identificador) &&
    Number(a.idEspecialidade || 0) === Number(b.idEspecialidade || 0)
  );
}

export function validarProfissional(v: CamposProfissionalValor): ErrosProfissional {
  const erros: ErrosProfissional = {};
  const link = linkExternoSeguro(v.linkedin);
  if (!v.idEspecialidade) erros.idEspecialidade = "Selecione sua área de atuação.";
  // LinkedIn é opcional: só é validado quando preenchido.
  if (!v.linkedin.trim()) {
    /* sem LinkedIn: permitido */
  } else if (!link) erros.linkedin = "Informe um link válido (https://...).";
  else if (link.length > LINKEDIN_MAX) erros.linkedin = `O link pode ter no máximo ${LINKEDIN_MAX} caracteres.`;
  if (!v.identificador.trim()) erros.identificador = "Informe seu CPF ou CNPJ.";
  else if (!documentoValido(v.identificador)) erros.identificador = "CPF ou CNPJ inválido.";
  return erros;
}

export function paraRequestProfissional(v: CamposProfissionalValor, idUsuario: number): PerfilUsuarioRequest {
  return {
    linkedin: v.linkedin.trim() ? linkExternoSeguro(v.linkedin)! : LINKEDIN_NAO_INFORMADO,
    identificador: formatarDocumento(v.identificador),
    idEspecialidade: Number(v.idEspecialidade),
    idUsuario,
  };
}

// ---------------------------------------------------------------------------
// Endereço / localização
// ---------------------------------------------------------------------------

export interface CamposEnderecoValor {
  cep: string;
  uf: string;
  bairro: string;
  logradouro: string;
  complemento: string;
  numeroCasa: string;
}

export type ErrosEndereco = Partial<Record<keyof CamposEnderecoValor, string>>;

export function enderecoInicial(endereco: Endereco | null): CamposEnderecoValor {
  return {
    cep: endereco?.cep ?? "",
    uf: endereco?.uf ?? "",
    bairro: endereco?.bairro ?? "",
    logradouro: endereco?.logradouro ?? "",
    complemento: endereco?.complemento ?? "",
    numeroCasa: endereco?.numeroCasa != null ? String(endereco.numeroCasa) : "",
  };
}

export function enderecoVazio(v: CamposEnderecoValor): boolean {
  return Object.values(v).every((x) => !String(x).trim());
}

export function enderecoIgual(a: CamposEnderecoValor, b: CamposEnderecoValor): boolean {
  return (
    somenteDigitos(a.cep) === somenteDigitos(b.cep) &&
    a.uf === b.uf &&
    a.bairro.trim() === b.bairro.trim() &&
    a.logradouro.trim() === b.logradouro.trim() &&
    a.complemento.trim() === b.complemento.trim() &&
    a.numeroCasa.trim() === b.numeroCasa.trim()
  );
}

export function validarEndereco(c: CamposEnderecoValor): ErrosEndereco {
  const erros: ErrosEndereco = {};
  if (somenteDigitos(c.cep).length !== 8) erros.cep = "CEP deve ter 8 dígitos.";
  if (!UFS.includes(c.uf as (typeof UFS)[number])) erros.uf = "Selecione o estado.";
  if (!c.logradouro.trim()) erros.logradouro = "Informe o logradouro.";
  else if (c.logradouro.trim().length > TEXTO_ENDERECO_MAX) erros.logradouro = `Máximo de ${TEXTO_ENDERECO_MAX} caracteres.`;
  if (!c.numeroCasa.trim() || !/^\d{1,9}$/.test(c.numeroCasa.trim())) erros.numeroCasa = "Informe o número.";
  if (!c.bairro.trim()) erros.bairro = "Informe o bairro.";
  else if (c.bairro.trim().length > TEXTO_ENDERECO_MAX) erros.bairro = `Máximo de ${TEXTO_ENDERECO_MAX} caracteres.`;
  if (!c.complemento.trim()) erros.complemento = "Informe o complemento (ex.: casa, apto 12).";
  return erros;
}

export function paraRequestEndereco(c: CamposEnderecoValor, usuarioId: number): EnderecoRequest {
  return {
    cep: somenteDigitos(c.cep),
    uf: c.uf,
    bairro: c.bairro.trim(),
    logradouro: c.logradouro.trim(),
    complemento: c.complemento.trim(),
    numeroCasa: Number(c.numeroCasa),
    usuarioId,
  };
}

export const NOME_UF: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso",
  MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

/**
 * Localização pública: somente o estado. O endereço completo nunca é exibido no perfil.
 * (O backend não guarda cidade.)
 */
export function localizacaoPublica(endereco: Pick<Endereco, "uf"> | null | undefined): string | null {
  const uf = endereco?.uf?.toUpperCase();
  if (!uf || !NOME_UF[uf]) return null;
  return `${NOME_UF[uf]}, Brasil`;
}

// ---------------------------------------------------------------------------
// Completude do perfil (somente com dados reais da API)
// ---------------------------------------------------------------------------

export interface ItemCompletude {
  chave: "foto" | "profissional" | "localizacao";
  rotulo: string;
  feito: boolean;
}

export function completudePerfil(dados: {
  temFoto: boolean;
  temPerfilProfissional: boolean;
  temEndereco: boolean;
}): { itens: ItemCompletude[]; feitos: number; total: number; percentual: number } {
  const itens: ItemCompletude[] = [
    { chave: "foto", rotulo: "Foto de perfil", feito: dados.temFoto },
    { chave: "profissional", rotulo: "Informações profissionais", feito: dados.temPerfilProfissional },
    { chave: "localizacao", rotulo: "Localização", feito: dados.temEndereco },
  ];
  // Somente os itens listados contam: 0/3 = 0%, 1/3 ≈ 33,33%, 2/3 ≈ 66,67%, 3/3 = 100%.
  const feitos = itens.filter((i) => i.feito).length;
  const percentual = itens.length ? (feitos / itens.length) * 100 : 0;
  return { itens, feitos, total: itens.length, percentual };
}

/** Percentual para exibição em pt-BR, com até 2 casas decimais (ex.: "66,67%", "100%"). */
export function formatarPercentual(valor: number, casas = 2): string {
  const seguro = Number.isFinite(valor) ? valor : 0;
  return `${seguro.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas })}%`;
}
