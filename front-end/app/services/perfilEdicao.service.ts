/**
 * Orquestra o salvamento das partes do perfil usando SOMENTE endpoints existentes:
 *
 *  - Foto: `POST /usuario/{id}/foto` (multipart, campo "arquivo") e `DELETE /usuario/{id}/foto`
 *  - Perfil profissional: `POST /perfil-usuario` ou `PUT /perfil-usuario/{id}`
 *  - Endereço: `POST /endereco`, `PUT /endereco/{id}` ou `DELETE /endereco/{id}`
 *
 * Cada parte é enviada separadamente (o backend não tem operação única de "salvar perfil"),
 * então o resultado informa o que deu certo e o que falhou, para a interface nunca
 * anunciar sucesso de algo que o servidor recusou.
 */

import { ApiError, mensagemErro } from "../lib/api";
import { FotoPendente } from "../lib/imagemPerfil";
import {
  CamposEnderecoValor,
  CamposProfissionalValor,
  paraRequestEndereco,
  paraRequestProfissional,
} from "../lib/perfil";
import { atualizarFotoUsuario, removerFotoUsuario } from "./usuario.service";
import { atualizarPerfilUsuario, criarPerfilUsuario } from "./perfilUsuario.service";
import { atualizarEndereco, criarEndereco, excluirEndereco } from "./endereco.service";
import { PerfilUsuario } from "../types/PerfilUsuario";
import { Endereco } from "../types/Endereco";

export type EtapaPerfil = "foto" | "profissional" | "endereco";

export const ROTULO_ETAPA: Record<EtapaPerfil, string> = {
  foto: "Foto de perfil",
  profissional: "Informações profissionais",
  endereco: "Localização",
};

/** Envia/remove a foto. Retorna a nova URL (ou null quando removida). */
export async function salvarFoto(idUsuario: number, foto: Exclude<FotoPendente, null>): Promise<string | null> {
  if (foto.tipo === "remover") {
    await removerFotoUsuario(idUsuario);
    return null;
  }
  const atualizado = await atualizarFotoUsuario(idUsuario, foto.arquivo);
  if (!atualizado?.urlImagemUsuario) {
    // Resposta sem URL: não afirmamos que a foto foi salva.
    throw new ApiError(500, null, "O servidor não confirmou a nova foto.");
  }
  return atualizado.urlImagemUsuario;
}

export function salvarProfissional(
  idUsuario: number,
  perfilAtual: PerfilUsuario | null,
  valor: CamposProfissionalValor
): Promise<PerfilUsuario> {
  const dados = paraRequestProfissional(valor, idUsuario);
  return perfilAtual ? atualizarPerfilUsuario(perfilAtual.idPerfilUsuario, dados) : criarPerfilUsuario(dados);
}

export async function salvarEndereco(
  idUsuario: number,
  enderecoAtual: Endereco | null,
  valor: CamposEnderecoValor | null
): Promise<Endereco | null> {
  if (valor === null) {
    if (enderecoAtual) await excluirEndereco(enderecoAtual.idEndereco);
    return null;
  }
  const dados = paraRequestEndereco(valor, idUsuario);
  return enderecoAtual ? atualizarEndereco(enderecoAtual.idEndereco, dados) : criarEndereco(dados);
}

/** Mensagem amigável por etapa, com o caso de permissão (403) explicado. */
export function mensagemErroEtapa(etapa: EtapaPerfil, error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    if (etapa === "profissional") {
      return "Sua conta não tem permissão para salvar informações profissionais (o servidor libera apenas contas do tipo Usuário).";
    }
    return "Você não tem permissão para realizar esta alteração.";
  }
  if (etapa === "foto" && error instanceof ApiError && error.status === 413) {
    return "A imagem é maior do que o servidor aceita (10 MB).";
  }
  return mensagemErro(error, `Não foi possível salvar: ${ROTULO_ETAPA[etapa].toLowerCase()}.`);
}
