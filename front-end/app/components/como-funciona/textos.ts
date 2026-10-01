/**
 * Textos da página /como-funciona (versão sem animação da página inicial).
 *
 * Regra: só o que o PitcherX faz hoje. Nada de números de uso, depoimentos, notas ou logos de
 * parceiros. Os números que aparecem são regras reais do produto (limites de caracteres, papéis).
 * Mensagens diretas ainda não existem (as notificações cobrem apenas conexões); pagamentos e
 * investimentos não passam pela plataforma.
 */

export const HERO = {
  titulo: ["Onde ideias encontram", "quem vai construí-las."],
  apoio:
    "No PitcherX você transforma uma ideia em projeto, publica para a comunidade e monta a equipe que vai tirá-la do papel.",
  nota: "Interface ilustrativa · dados fictícios",
};

export const FAIXA = {
  titulo: "O que você encontra na plataforma",
  itens: ["Feed", "Explorar", "Projetos", "Equipes", "Propostas", "Contratos", "Perfil profissional"],
};

export const PASSOS = {
  rotulo: "Como funciona",
  titulo: { forte: "Apresente a ideia, encontre as pessoas certas", suave: "e forme a equipe no mesmo lugar." },
  itens: {
    projeto: {
      etiqueta: "01 · Projeto",
      titulo: "Do caderno para o projeto",
      texto: "Nome, descrição, datas e tipo. Quem cria o projeto entra na equipe como Criador.",
    },
    publicacao: {
      etiqueta: "02 · Publicação",
      numero: "2.000",
      texto: "caracteres para contar a ideia no feed, com um título de até 80. A comunidade curte, comenta e responde.",
    },
    descoberta: {
      etiqueta: "03 · Descoberta",
      titulo: "Pessoas e projetos",
      texto: "No Explorar, busque pelo nome e filtre por área de atuação ou por tipo de projeto.",
    },
    equipe: {
      etiqueta: "04 · Equipe",
      numero: "4 papéis",
      texto: "Quem criou o projeto adiciona as pessoas e define o papel de cada uma.",
    },
  },
};

export const FERRAMENTAS = {
  rotulo: "Ferramentas",
  titulo: ["Do primeiro contato", "ao acordo registrado"],
  apoio:
    "Depois que as pessoas se encontram, o PitcherX ajuda a organizar a conversa sobre valores e a guardar o que foi combinado.",
  itens: [
    {
      id: "propostas",
      titulo: "Propostas",
      texto: "Registre uma proposta com descrição e valor sugerido. Se não fechar, a resposta vem como contraproposta.",
    },
    {
      id: "contratos",
      titulo: "Contratos",
      texto: "A partir de um projeto seu, registre contratos com título, descrição e período de vigência.",
    },
    {
      id: "perfil",
      titulo: "Perfil profissional",
      texto: "Informe sua área de atuação e seu LinkedIn para aparecer em Explorar › Pessoas.",
    },
  ],
};

export const PAPEIS = {
  rotulo: "Para quem é",
  titulo: "Três pontos de partida, um mesmo projeto.",
  itens: [
    {
      titulo: "Quem tem a ideia",
      texto: "Cria o projeto, publica no feed e decide quem entra na equipe.",
      papel: "Criador",
    },
    {
      titulo: "Quem tem a habilidade",
      texto: "Completa o perfil profissional, aparece no Explorar e pode entrar na equipe como Sócio.",
      papel: "Sócio",
    },
    {
      titulo: "Quem quer apoiar",
      texto: "Acompanha os projetos que publicam no feed e pode ser adicionado à equipe como Investidor.",
      papel: "Investidor",
    },
  ],
  nota:
    "O PitcherX não processa pagamentos nem investimentos. Os papéis mostram quem é quem na equipe; valores e acordos ficam registrados em propostas e contratos.",
};

export const PERGUNTAS = {
  rotulo: "Perguntas",
  titulo: "Antes de começar",
  itens: [
    {
      p: "Preciso preencher tudo para criar a conta?",
      r: "Não. Bastam nome, e-mail e senha. Foto, área de atuação, LinkedIn e localização podem ser completados depois, no seu perfil.",
    },
    {
      p: "Como alguém entra na equipe de um projeto?",
      r: "Quem criou o projeto adiciona a pessoa pela página do projeto e escolhe o papel: Sócio, Investidor ou Visualizador.",
    },
    {
      p: "Como as pessoas me encontram?",
      r: "Com o perfil profissional completo, você aparece em Explorar › Pessoas, onde é possível buscar pelo nome e filtrar por área de atuação.",
    },
    {
      p: "O PitcherX intermedeia pagamentos ou investimentos?",
      r: "Não. Propostas guardam uma descrição e um valor sugerido, e contratos registram o que foi combinado. Nenhum dinheiro passa pela plataforma.",
    },
    {
      p: "Existe outra forma de conhecer o PitcherX?",
      r: "Sim. A página inicial conta esta mesma história numa experiência animada, guiada pela rolagem.",
    },
  ],
};

export const CHAMADO = {
  titulo: ["Comece pela ideia.", "A equipe vem depois."],
  apoio: "Crie sua conta, cadastre o projeto e publique no feed.",
};
