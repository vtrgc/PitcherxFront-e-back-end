/**
 * Textos da narrativa (um lugar só: usados pelo palco cinematográfico e pela versão estática).
 * Marque a palavra de destaque com *asteriscos*.
 */
export const TEXTOS = {
  c01: { rotulo: "01 — Ideia", titulo: "Toda ideia começa em algum *lugar*.", apoio: "Numa mesa de cozinha. Num ônibus. Às 23h47." },
  c02: { rotulo: "02 — O celular", titulo: "Mas ideia *guardada* não sai do lugar.", apoio: "Num bloco de notas, ela existe só para quem a teve." },
  c03: { rotulo: "03 — PitcherX", titulo: "Então ela abriu o *PitcherX*.", apoio: "Um lugar para a ideia sair do papel e encontrar pessoas." },
  c04: {
    rotulo: "04 — Projeto",
    titulo: "Primeiro, a ideia vira *projeto*.",
    apoio: "Nome, descrição, datas e tipo. Quem cria o projeto entra na equipe como Criador.",
  },
  c05: { rotulo: "05 — Publicação", titulo: "Depois, ela ganha *voz*.", apoio: "Uma publicação no feed, para toda a comunidade ver." },
  c06: {
    rotulo: "06 — Plataforma",
    titulo: "E entra onde as pessoas *procuram*.",
    apoio: "No feed e no Explorar, com busca e filtros por tipo de projeto e especialidade.",
  },
  c07: { rotulo: "07 — Descoberta", titulo: "Do outro lado da cidade, alguém procurava *exatamente* isso." },
  c08: {
    rotulo: "08 — Análise",
    titulo: "Ele lê. Curte. Pergunta.",
    apoio: "A página do projeto, o perfil de quem criou, curtidas e comentários.",
  },
  c09: {
    rotulo: "09 — Conexão",
    titulo: "Uma conversa vira *equipe*.",
    apoio: "Quem cria o projeto adiciona quem acredita nele — como Sócio ou Investidor.",
  },
  c10: { titulo: "Uma ideia. Alguém que *acredita* nela.", apoio: "É para isso que o PitcherX existe." },
  final: {
    titulo: "Sua ideia merece ser *encontrada*.",
    apoio: "Crie seu projeto, publique e encontre quem quer construir com você.",
  },
} as const;

/** Rótulos do indicador de cena (01–10). */
export const ROTULOS_CENAS = [
  "A ideia",
  "O celular",
  "Entrando",
  "Projeto",
  "Publicação",
  "Plataforma",
  "Descoberta",
  "Análise",
  "Conexão",
  "Conclusão",
] as const;
