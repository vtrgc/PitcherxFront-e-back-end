/**
 * Situação de verificação de uma conta, derivada SOMENTE do que a API devolve.
 *
 * O que o backend tem hoje:
 *  - `Usuario.active` (conta ativa/desativada) e `roles` (USUARIO, EMPRESA, ADMIN);
 *  - `Usuario.emailUsuario`, confirmado pelo código de 6 dígitos enviado no cadastro
 *    (POST /usuario/verificar-conta). A API não devolve o campo `verificado`, mas a conta só
 *    fica ativa depois da verificação (e a migration V25 marcou as contas ativas como
 *    verificadas): conta ativa = e-mail confirmado;
 *  - `PerfilUsuario.identificador` (CPF/CNPJ) — sem conferência em órgão oficial; o front
 *    só consegue checar os dígitos verificadores.
 * Por isso nenhum item aparece como "Em análise": não há processo de análise no sistema.
 */

import { documentoValido, somenteDigitos } from "./validacao";

export type StatusVerificacao = "verificado" | "nao_verificado" | "em_analise" | "pendente";

export const ROTULO_STATUS: Record<StatusVerificacao, string> = {
  verificado: "Verificado",
  nao_verificado: "Não verificado",
  em_analise: "Em análise",
  pendente: "Pendente",
};

export interface ItemVerificacao {
  chave: "email" | "identidade" | "conta";
  titulo: string;
  status: StatusVerificacao;
  detalhe: string;
  /** Link para resolver a pendência (quando houver o que o usuário possa fazer). */
  acao?: { href: string; rotulo: string };
}

export function tipoDocumento(identificador?: string | null): "CPF" | "CNPJ" | null {
  const d = somenteDigitos(identificador ?? "");
  if (d.length === 11) return "CPF";
  if (d.length === 14) return "CNPJ";
  return null;
}

export function itensVerificacao(dados: {
  email?: string | null;
  ativo?: boolean | null;
  /** CPF/CNPJ do perfil profissional (null = sem perfil). */
  identificador?: string | null;
  /** true enquanto o perfil não carregou: identidade fica fora até saber. */
  perfilIndisponivel?: boolean;
}): ItemVerificacao[] {
  const itens: ItemVerificacao[] = [];

  itens.push({
    chave: "email",
    titulo: "E-mail",
    status: !dados.email ? "nao_verificado" : dados.ativo === false ? "pendente" : "verificado",
    detalhe: !dados.email
      ? "Nenhum e-mail informado."
      : dados.ativo === false
        ? `${dados.email} — aguardando o código de verificação enviado no cadastro.`
        : `${dados.email} — confirmado pelo código enviado no cadastro.`,
    acao: dados.email && dados.ativo === false ? { href: "/auth/verificar-conta", rotulo: "Verificar e-mail" } : undefined,
  });

  if (!dados.perfilIndisponivel) {
    const tipo = tipoDocumento(dados.identificador);
    if (!dados.identificador || !tipo) {
      itens.push({
        chave: "identidade",
        titulo: "Identidade (CPF/CNPJ)",
        status: "pendente",
        detalhe: "Informe seu CPF ou CNPJ nas informações profissionais.",
        acao: { href: "/perfil/editar#profissional", rotulo: "Informar documento" },
      });
    } else if (documentoValido(dados.identificador)) {
      itens.push({
        chave: "identidade",
        titulo: `Identidade (${tipo})`,
        status: "verificado",
        detalhe: `${tipo} com dígitos verificadores válidos. Não há conferência com órgãos oficiais.`,
      });
    } else {
      itens.push({
        chave: "identidade",
        titulo: `Identidade (${tipo})`,
        status: "nao_verificado",
        detalhe: `O ${tipo} salvo não passou na conferência dos dígitos verificadores. Corrija o documento.`,
        acao: { href: "/perfil/editar#profissional", rotulo: "Corrigir documento" },
      });
    }
  }

  itens.push({
    chave: "conta",
    titulo: "Conta",
    status: dados.ativo === false ? "nao_verificado" : "verificado",
    detalhe: dados.ativo === false ? "Conta desativada." : "Conta ativa.",
  });

  return itens;
}
