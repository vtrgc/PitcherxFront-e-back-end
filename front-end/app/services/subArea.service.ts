import { api } from "../lib/api";
import { SubArea, SubAreaRequest } from "../types/SubArea";

export function listarSubAreas() {
  return api<SubArea[]>("/subarea");
}

export function buscarSubArea(id: number) {
  return api<SubArea>(`/subarea/${id}`);
}

export function criarSubArea(data: SubAreaRequest) {
  return api<SubArea>("/subarea", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarSubArea(id: number, data: SubAreaRequest) {
  return api<SubArea>(`/subarea/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirSubArea(id: number) {
  return api<void>(`/subarea/${id}`, {
    method: "DELETE",
  });
}
