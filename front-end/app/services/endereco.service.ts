import { api } from "../lib/api";
import { Endereco, EnderecoRequest } from "../types/Endereco";

export function listarEnderecos() {
  return api<Endereco[]>("/endereco");
}

export function buscarEndereco(id: number) {
  return api<Endereco>(`/endereco/${id}`);
}

export function criarEndereco(data: EnderecoRequest) {
  return api<Endereco>("/endereco", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarEndereco(id: number, data: EnderecoRequest) {
  return api<Endereco>(`/endereco/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirEndereco(id: number) {
  return api<void>(`/endereco/${id}`, {
    method: "DELETE",
  });
}
