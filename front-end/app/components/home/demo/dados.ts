/**
 * Conteúdo FICTÍCIO usado pelas réplicas da interface na página inicial.
 *
 * - Nenhum dado aqui vem da API nem representa pessoas reais.
 * - Todos os valores respeitam as regras reais do PitcherX (limites de caracteres,
 *   formatos de data, papéis de vínculo existentes: Criador, Sócio, Investidor, Visualizador).
 * - É a MESMA publicação e o MESMO projeto do início ao fim da história.
 */

export const ETIQUETA_FICTICIA = "Interface ilustrativa · dados fictícios";

export const CRIADORA = {
  nome: "Lia Campos",
  handle: "lia.campos",
  email: "lia.campos@example.com",
  especialidade: "Design de serviços",
  publicacoes: 1,
  projetos: 1,
};

export const INTERESSADO = {
  nome: "Rafael Moura",
  handle: "rafael.moura",
  email: "rafael.moura@example.com",
  especialidade: "Gestão de negócios de impacto",
};

/** A ideia, ainda num bloco de notas (antes do PitcherX). */
export const NOTA = {
  titulo: "ideia",
  linhas: ["hortas nos telhados das escolas??", "— alunos cuidam", "— bairro compra a colheita", "— falar com alguém…"],
};

/** Projeto (FormProjeto: nome, descrição, início, término, tipo). */
export const PROJETO = {
  nome: "Hortas no telhado",
  descricao:
    "Hortas comunitárias nos telhados de escolas públicas. Os alunos cultivam, o bairro compra a colheita e a renda volta para a escola.",
  /** Formato exibido pelo app (dd/MM/yyyy). */
  inicio: "02/03/2027",
  fim: "30/11/2027",
  /** Formato do campo <input type="date">. */
  inicioInput: "2027-03-02",
  fimInput: "2027-11-30",
  /** Tipos de projeto são cadastrados pelo administrador; este é só um exemplo. */
  tipo: "Impacto social",
  tiposExemplo: ["Tecnologia", "Impacto social", "Educação"],
};

/** Publicação (CriarPost: título até 80 caracteres + texto até 2000). */
export const PUBLICACAO = {
  titulo: "Procurando quem acredite: hortas nos telhados das escolas",
  texto:
    "Mapeei 12 escolas do bairro com telhado livre. Os alunos cultivam, o bairro compra a colheita e a renda volta para a escola. Procuro quem queira construir isso comigo.",
  data: "25/09/2026",
};

export const COMENTARIO = "Gostei muito. Qual o custo por escola? Podemos conversar?";
export const RESPOSTA = "Vamos! Te passo os números por e-mail.";

/** Papéis reais de vínculo (ProjetoUsuario / TIPOS_VINCULO). */
export const PAPEIS = ["Criador", "Sócio", "Investidor", "Visualizador"] as const;

export const EQUIPE_INICIAL = [{ nome: CRIADORA.nome, papel: "Criador", desde: "25/09/2026" }];
export const EQUIPE_FINAL = [
  { nome: CRIADORA.nome, papel: "Criador", desde: "25/09/2026" },
  { nome: INTERESSADO.nome, papel: "Investidor", desde: "02/10/2026" },
];
