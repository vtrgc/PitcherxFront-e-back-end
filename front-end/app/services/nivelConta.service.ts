import { api } from "../lib/api";
import { NivelConta } from "../types/Usuario";

let cache: Promise<NivelConta[]> | null = null;

/** GET /nivel-conta — catálogo ordenado (cacheado por sessão). */
export function listarNiveisConta(): Promise<NivelConta[]> {
  if (!cache) {
    cache = api<NivelConta[]>("/nivel-conta").catch((e) => {
      cache = null;
      throw e;
    });
  }
  return cache;
}

const ROTULOS: Record<string, string> = {
  INICIANTE: "Iniciante",
  EXPLORADOR: "Explorador",
  PROFISSIONAL: "Profissional",
  ESPECIALISTA: "Especialista",
  REFERENCIA: "Referência",
  ELITE: "Elite",
};

export function rotuloNivel(nome: string | null | undefined): string {
  if (!nome) return "—";
  return ROTULOS[nome] ?? nome.charAt(0) + nome.slice(1).toLowerCase();
}
