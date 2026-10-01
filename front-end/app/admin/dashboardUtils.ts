import { parseApiDate, parseDataFlexivel } from "../lib/date";

export { parseApiDate };

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function agruparPorMes<T>(
  itens: T[],
  obterData: (item: T) => string | null | undefined,
  janelaMeses = 6
): { label: string; value: number }[] {
  const hoje = new Date();
  const chaves: string[] = [];
  const labels: string[] = [];

  for (let i = janelaMeses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    chaves.push(`${d.getFullYear()}-${d.getMonth()}`);
    labels.push(MESES_ABREV[d.getMonth()]);
  }

  const contagem = new Map<string, number>(chaves.map((c) => [c, 0]));

  itens.forEach((item) => {
    const data = parseDataFlexivel(obterData(item));
    if (!data) return;
    const chave = `${data.getFullYear()}-${data.getMonth()}`;
    if (contagem.has(chave)) {
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
  });

  return chaves.map((chave, i) => ({ label: labels[i], value: contagem.get(chave) ?? 0 }));
}

export function contarPorChave<T>(itens: T[], obterChave: (item: T) => string | number | null | undefined) {
  const mapa = new Map<string | number, number>();
  itens.forEach((item) => {
    const chave = obterChave(item);
    if (chave === null || chave === undefined) return;
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  });
  return mapa;
}
