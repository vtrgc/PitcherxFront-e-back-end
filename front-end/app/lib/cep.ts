/**
 * Consulta de CEP feita direto no navegador (o backend do PitcherX não tem esse serviço).
 *
 * Fonte principal: ViaCEP (https://viacep.com.br). Se ela não responder (rede, timeout ou
 * erro 5xx), tenta a BrasilAPI (https://brasilapi.com.br). As duas são públicas, gratuitas e
 * aceitam chamadas do navegador (CORS liberado).
 *
 * O endereço salvo no backend tem cep, uf, bairro, logradouro, complemento e número; a cidade
 * não existe no `EnderecoRequestDTO`, então ela só é exibida no formulário, nunca enviada.
 */

import { somenteDigitos } from "./validacao";
import { UFS } from "../types/Endereco";

export interface EnderecoCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Motivo de uma consulta sem endereço. */
export type FalhaCep = "invalido" | "inexistente" | "indisponivel";

export class ErroCep extends Error {
  motivo: FalhaCep;
  constructor(motivo: FalhaCep) {
    super(MENSAGEM_FALHA_CEP[motivo]);
    this.name = "ErroCep";
    this.motivo = motivo;
  }
}

export const MENSAGEM_FALHA_CEP: Record<FalhaCep, string> = {
  invalido: "CEP inválido. Informe os 8 dígitos.",
  inexistente: "CEP não encontrado. Confira o número ou preencha o endereço manualmente.",
  indisponivel: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente.",
};

const TIMEOUT_MS = 8000;

/** "01001000" ou "01001-000" → "01001-000" (enquanto digita, devolve o que já dá para formatar). */
export function formatarCep(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** CEP com 8 dígitos e que não seja uma sequência repetida (00000000, 11111111...). */
export function cepValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  return d.length === 8 && !/^(\d)\1{7}$/.test(d);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function ufValida(uf: string): string {
  const sigla = uf.toUpperCase();
  return (UFS as readonly string[]).includes(sigla) ? sigla : "";
}

/** Normaliza a resposta da ViaCEP. `null` quando o CEP não existe (`{ "erro": true }`). */
export function lerRespostaViaCep(dados: unknown, cep: string): EnderecoCep | null {
  const d = (dados ?? {}) as Record<string, unknown>;
  // A ViaCEP já devolveu `erro: true` e `erro: "true"`, conforme a versão.
  if (d.erro === true || d.erro === "true") return null;
  return {
    cep,
    logradouro: texto(d.logradouro),
    bairro: texto(d.bairro),
    cidade: texto(d.localidade),
    uf: ufValida(texto(d.uf)),
  };
}

/** Normaliza a resposta da BrasilAPI (CEP v1). */
export function lerRespostaBrasilApi(dados: unknown, cep: string): EnderecoCep {
  const d = (dados ?? {}) as Record<string, unknown>;
  return {
    cep,
    logradouro: texto(d.street),
    bairro: texto(d.neighborhood),
    cidade: texto(d.city),
    uf: ufValida(texto(d.state)),
  };
}

async function buscarJson(url: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abortar = () => controller.abort();
  signal?.addEventListener("abort", abortar, { once: true });
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortar);
  }
}

/**
 * Consulta o CEP. Lança `ErroCep` com o motivo (inválido, inexistente ou serviço
 * indisponível). Um `AbortError` do chamador é repassado sem conversão.
 */
export async function consultarCep(valor: string, signal?: AbortSignal): Promise<EnderecoCep> {
  const cep = somenteDigitos(valor);
  if (!cepValido(cep)) throw new ErroCep("invalido");

  try {
    const resposta = await buscarJson(`https://viacep.com.br/ws/${cep}/json/`, signal);
    // 400 = formato inválido para a ViaCEP.
    if (resposta.status === 400) throw new ErroCep("invalido");
    if (resposta.ok) {
      const endereco = lerRespostaViaCep(await resposta.json(), cep);
      if (!endereco) throw new ErroCep("inexistente");
      return endereco;
    }
  } catch (error) {
    if (error instanceof ErroCep) throw error;
    if (signal?.aborted) throw error;
    // Falha de rede/timeout na ViaCEP: tenta a alternativa abaixo.
  }

  try {
    const resposta = await buscarJson(`https://brasilapi.com.br/api/cep/v1/${cep}`, signal);
    if (resposta.status === 404) throw new ErroCep("inexistente");
    if (!resposta.ok) throw new ErroCep("indisponivel");
    return lerRespostaBrasilApi(await resposta.json(), cep);
  } catch (error) {
    if (error instanceof ErroCep) throw error;
    if (signal?.aborted) throw error;
    throw new ErroCep("indisponivel");
  }
}
