import { api } from "../lib/api";
import { ProjetoUsuario, TIPO_VINCULO_ID } from "../types/ProjetoUsuario";

export function listarPorProjeto(idProjeto: number) {
  return api<ProjetoUsuario[]>(`/projeto-usuario/projeto/${idProjeto}`);
}

export function listarPorUsuario(idUsuario: number) {
  return api<ProjetoUsuario[]>(`/projeto-usuario/usuario/${idUsuario}`);
}

export function buscarProjetoUsuario(id: number) {
  return api<ProjetoUsuario>(`/projeto-usuario/${id}`);
}

// O backend não tem mais POST/PUT/DELETE em /projeto-usuario: o vínculo CRIADOR nasce com o
// projeto, o VISUALIZADOR com o aceite dos termos e SÓCIO/INVESTIDOR com solicitações aprovadas.

/** IDs dos projetos em que o usuário é CRIADOR (dono). */
export async function listarIdsProjetosCriados(idUsuario: number): Promise<Set<number>> {
  const vinculos = await listarPorUsuario(idUsuario);
  return new Set(
    (vinculos ?? []).filter((v) => v.tipoVinculoId === TIPO_VINCULO_ID.CRIADOR).map((v) => v.projetoId)
  );
}

/**
 * Vínculos que tornam alguém PARTE de um projeto para fins de contrato e do registro de
 * autoria (verificador antiplágio): criador, sócio e investidor. "Visualizador" não é parte.
 */
export const VINCULOS_PARTE_CONTRATO: number[] = [TIPO_VINCULO_ID.CRIADOR, TIPO_VINCULO_ID.SOCIO, TIPO_VINCULO_ID.INVESTIDOR];

export function ehParteDoContrato(vinculos: Pick<ProjetoUsuario, "usuarioId" | "tipoVinculoId">[], idUsuario: number | null | undefined): boolean {
  if (!idUsuario) return false;
  return vinculos.some((v) => v.usuarioId === idUsuario && VINCULOS_PARTE_CONTRATO.includes(v.tipoVinculoId));
}

/** IDs dos projetos em que o usuário é parte (criador, sócio ou investidor). */
export async function listarIdsProjetosParte(idUsuario: number): Promise<Set<number>> {
  const vinculos = await listarPorUsuario(idUsuario);
  return new Set((vinculos ?? []).filter((v) => VINCULOS_PARTE_CONTRATO.includes(v.tipoVinculoId)).map((v) => v.projetoId));
}

const TIPOS_COM_ACESSO = ["CRIADOR", "SOCIO", "INVESTIDOR", "VISUALIZADOR"];

/** Vínculo mais forte do usuário no projeto (criador > sócio > investidor > visualizador). */
export function vinculoDoUsuario(vinculos: ProjetoUsuario[], idUsuario: number | null | undefined): ProjetoUsuario | null {
  if (!idUsuario) return null;
  const meus = vinculos.filter((v) => v.usuarioId === idUsuario);
  if (meus.length === 0) return null;
  const prioridade: number[] = [TIPO_VINCULO_ID.CRIADOR, TIPO_VINCULO_ID.SOCIO, TIPO_VINCULO_ID.INVESTIDOR, TIPO_VINCULO_ID.VISUALIZADOR];
  return [...meus].sort((a, b) => prioridade.indexOf(a.tipoVinculoId) - prioridade.indexOf(b.tipoVinculoId))[0];
}

/**
 * Regra de ProjetoService.validarAcessoProjeto: vê o projeto quem tem vínculo com ele
 * (criador, sócio, investidor, visualizador) ou aceitou os termos de vínculo.
 */
export function temAcessoAoProjeto(vinculos: ProjetoUsuario[], idUsuario: number | null | undefined): boolean {
  const meu = vinculoDoUsuario(vinculos, idUsuario);
  if (!meu) return false;
  return !!meu.aceitouTermos || TIPOS_COM_ACESSO.includes(meu.nomeTipoVinculo);
}
