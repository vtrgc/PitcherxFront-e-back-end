import { mapComLimite } from "../lib/api";
import { tipoDocumento } from "../lib/verificacao";
import { PerfilUsuario } from "../types/PerfilUsuario";
import { Usuario } from "../types/Usuario";
import { buscarStatusCurtida, TIPO_CONTEUDO } from "./curtida.service";
import { listarPerfisUsuario } from "./perfilUsuario.service";
import { buscarUsuario, listarUsuarios } from "./usuario.service";

/**
 * Empresas no PitcherX.
 *
 * O backend não tem entidade "Empresa": uma empresa é uma conta (`Usuario`) com a role
 * `EMPRESA` (atribuída pelo administrador em POST /usuario/alterar-role) — ou, para quem
 * ainda não recebeu a role, um perfil profissional cadastrado com CNPJ. Todas as
 * funcionalidades de empresa usam os endpoints de usuário/perfil/projeto/conexão/curtida.
 *
 * Não há endpoint que liste usuários por role para contas comuns (`GET /usuario` é só do
 * ADMIN), por isso a lista parte dos perfis profissionais (`GET /perfil-usuario`) e lê as
 * roles de cada conta em `GET /usuario/{id}` (com cache).
 */

export interface Empresa {
  idUsuario: number;
  nome: string;
  email: string;
  urlImagem: string | null;
  perfil: PerfilUsuario | null;
  /** "ROLE": conta com role EMPRESA; "CNPJ": perfil com CNPJ (sem a role). */
  origem: "ROLE" | "CNPJ";
}

export function ehEmpresa(usuario: Pick<Usuario, "roles"> | null | undefined, perfil?: Pick<PerfilUsuario, "identificador"> | null): boolean {
  return !!usuario?.roles?.includes("EMPRESA") || tipoDocumento(perfil?.identificador) === "CNPJ";
}

function montar(usuario: Usuario, perfil: PerfilUsuario | null): Empresa {
  return {
    idUsuario: usuario.idUsuario,
    nome: usuario.nomeUsuario,
    email: usuario.emailUsuario,
    urlImagem: usuario.urlImagemUsuario,
    perfil,
    origem: usuario.roles?.includes("EMPRESA") ? "ROLE" : "CNPJ",
  };
}

/**
 * Empresas cadastradas (contas ativas). Para o administrador, inclui também contas com a
 * role EMPRESA que ainda não têm perfil profissional.
 */
export async function listarEmpresas({ admin = false }: { admin?: boolean } = {}): Promise<Empresa[]> {
  const perfis = await listarPerfisUsuario();
  const porUsuario = new Map(perfis.map((p) => [p.usuario.idUsuario, p]));
  const encontradas = new Map<number, Empresa>();

  const usuarios = await mapComLimite(perfis, 6, (p) => buscarUsuario(p.usuario.idUsuario));
  usuarios.forEach((r, i) => {
    const perfil = perfis[i];
    if (r.status === "fulfilled") {
      if (r.value.active !== false && ehEmpresa(r.value, perfil)) encontradas.set(r.value.idUsuario, montar(r.value, perfil));
    } else if (tipoDocumento(perfil.identificador) === "CNPJ" && perfil.usuario.active !== false) {
      // Sem a conta, ainda dá para reconhecer pelo CNPJ do perfil.
      encontradas.set(perfil.usuario.idUsuario, {
        idUsuario: perfil.usuario.idUsuario,
        nome: perfil.usuario.nomeUsuario,
        email: perfil.usuario.emailUsuario,
        urlImagem: null,
        perfil,
        origem: "CNPJ",
      });
    }
  });

  if (admin) {
    try {
      for (const u of (await listarUsuarios()) ?? []) {
        if (u.active !== false && !encontradas.has(u.idUsuario) && u.roles?.includes("EMPRESA")) {
          encontradas.set(u.idUsuario, montar(u, porUsuario.get(u.idUsuario) ?? null));
        }
      }
    } catch {
      /* sem a listagem completa, ficam as empresas com perfil */
    }
  }

  return [...encontradas.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export interface VotosEmpresas {
  /** Empresas que curtiram (votaram a favor de) o projeto. */
  aFavor: Empresa[];
  /** Empresas cujo voto foi consultado com sucesso. */
  consultadas: number;
  /** Empresas cuja consulta falhou (não entram no percentual). */
  falhas: number;
}

/**
 * Votos das empresas em um projeto. O "voto" é a curtida do projeto (tipo de conteúdo
 * PROJETO), consultada por empresa em GET /curtida/status/{empresa}/4/{projeto}.
 */
export async function votosDeEmpresas(projetoId: number, empresas: Empresa[]): Promise<VotosEmpresas> {
  const status = await mapComLimite(empresas, 6, (e) => buscarStatusCurtida(e.idUsuario, TIPO_CONTEUDO.PROJETO, projetoId));
  const aFavor: Empresa[] = [];
  let falhas = 0;
  status.forEach((r, i) => {
    if (r.status === "fulfilled") {
      if (r.value.jaCurtiu) aFavor.push(empresas[i]);
    } else falhas++;
  });
  return { aFavor, consultadas: empresas.length - falhas, falhas };
}

/** Projetos (dentre os informados) que a empresa apoiou com voto/curtida. */
export async function projetosApoiadosPor(idEmpresa: number, idsProjetos: number[]): Promise<{ ids: number[]; falhas: number }> {
  const status = await mapComLimite(idsProjetos, 6, (id) => buscarStatusCurtida(idEmpresa, TIPO_CONTEUDO.PROJETO, id));
  const ids: number[] = [];
  let falhas = 0;
  status.forEach((r, i) => {
    if (r.status === "fulfilled") {
      if (r.value.jaCurtiu) ids.push(idsProjetos[i]);
    } else falhas++;
  });
  return { ids, falhas };
}
