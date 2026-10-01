import { api } from "../lib/api";
import { Area, AreaRequest } from "../types/Area";

export function listarAreas() {
  return api<Area[]>("/area");
}

export function buscarArea(id: number) {
  return api<Area>(`/area/${id}`);
}

export function criarArea(data: AreaRequest) {
  return api<Area>("/area", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarArea(id: number, data: AreaRequest) {
  return api<Area>(`/area/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirArea(id: number) {
  return api<void>(`/area/${id}`, {
    method: "DELETE",
  });
}
