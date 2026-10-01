/**
 * Conversões de data entre os formatos da UI e do backend.
 *
 * - Postagem/Projeto usam `LocalDate` com @JsonFormat("dd/MM/yyyy").
 * - Contrato usa `LocalDateTime` sem formato explícito => ISO "yyyy-MM-ddTHH:mm[:ss]".
 * - ProjetoUsuario.dataVinculo usa `LocalDateTime` ISO.
 */

function doisDigitos(n: number) {
  return String(n).padStart(2, "0");
}

/** "2026-09-21" (input type=date) -> "21/09/2026" (API). */
export function inputDateToApi(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

/** "21/09/2026" (API) -> "2026-09-21" (input type=date). */
export function apiDateToInput(value: string | null | undefined): string {
  if (!value) return "";
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
}

/** Data de hoje no formato do <input type="date"> (fuso local). */
export function hojeInput(agora = new Date()): string {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

/**
 * "Hoje" para validar datas que o SERVIDOR confere com @FutureOrPresent/@Future
 * (formato do <input type="date">).
 *
 * O backend usa o próprio relógio/fuso. Com o servidor em UTC (padrão em contêineres) e o
 * usuário em UTC-3 à noite, o "hoje" do servidor já é o dia seguinte: uma data de início
 * igual ao "hoje" local seria recusada (400). Usamos a MAIOR entre a data local e a UTC,
 * aceita tanto por servidores em UTC quanto em horário de Brasília.
 */
export function hojeServidorInput(agora = new Date()): string {
  const local = hojeInput(agora);
  const utc = `${agora.getUTCFullYear()}-${doisDigitos(agora.getUTCMonth() + 1)}-${doisDigitos(agora.getUTCDate())}`;
  return utc > local ? utc : local;
}

/**
 * Data a enviar em `dataPostagem` (dd/MM/yyyy).
 *
 * O backend valida @FutureOrPresent usando o relógio/fuso DO SERVIDOR. Se o servidor
 * roda em UTC (padrão em contêineres) e o usuário está em UTC-3 à noite, a data local
 * seria "ontem" para o servidor e a postagem seria recusada. Usamos a MAIOR entre a
 * data local e a data UTC, o que é aceito tanto por servidores em UTC quanto em
 * horário de Brasília.
 */
export function dataPostagemHoje(agora = new Date()): string {
  const local = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const utc = new Date(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  const d = utc > local ? utc : local;
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Converte "dd/MM/yyyy" em Date local (ou null). */
export function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const partes = value.split("/");
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes.map(Number);
  if (!dia || !mes || !ano) return null;
  const data = new Date(ano, mes - 1, dia);
  return isNaN(data.getTime()) ? null : data;
}

/** Converte data ISO (LocalDateTime) ou "dd/MM/yyyy" em Date (ou null). */
export function parseDataFlexivel(value?: string | null): Date | null {
  if (!value) return null;
  if (value.includes("/")) return parseApiDate(value);
  const data = new Date(value);
  return isNaN(data.getTime()) ? null : data;
}

/** "2026-09-21T14:30:00" -> "21/09/2026 14:30". Valores inválidos voltam como "—". */
export function formatarDataHora(value?: string | null): string {
  const data = parseDataFlexivel(value);
  if (!data) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Qualquer data aceita -> "21/09/2026". */
export function formatarData(value?: string | null): string {
  const data = parseDataFlexivel(value);
  if (!data) return "—";
  return data.toLocaleDateString("pt-BR");
}

/**
 * Tempo relativo em português ("agora", "há 5 min", "há 3 h", "há 2 dias"); acima de
 * 7 dias, a data. O backend envia LocalDateTime sem fuso: é interpretado como horário local.
 */
export function tempoRelativo(value?: string | null, agora = new Date()): string {
  const data = parseDataFlexivel(value);
  if (!data) return "";
  const segundos = Math.round((agora.getTime() - data.getTime()) / 1000);
  if (segundos < 60) return "agora";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} dia${dias === 1 ? "" : "s"}`;
  return data.toLocaleDateString("pt-BR");
}

/** ISO do backend -> valor de <input type="datetime-local"> ("yyyy-MM-ddTHH:mm"). */
export function isoParaInputDataHora(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}

/**
 * Valida as datas de um projeto como o backend faz
 * (início @FutureOrPresent, término @Future) e ainda exige término >= início.
 * Retorna a mensagem de erro ou null.
 */
export function validarDatasProjeto(inicio: string, fim: string, hoje = hojeServidorInput()): string | null {
  if (!inicio || !fim) return "Informe as datas de início e de término.";
  if (inicio < hoje) return "A data de início não pode ser anterior a hoje.";
  if (fim <= hoje) return "A data de término deve ser uma data futura.";
  if (fim < inicio) return "A data de término não pode ser anterior à data de início.";
  return null;
}
