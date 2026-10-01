/** Validações de formulário feitas no cliente (o backend continua validando). */

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailValido(email: string): boolean {
  return REGEX_EMAIL.test(email.trim());
}

export const SENHA_MINIMA = 6;

export interface ErrosCadastro {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
  confirmarSenha?: string;
}

export function validarCadastro(dados: {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone?: string;
}): ErrosCadastro {
  const erros: ErrosCadastro = {};
  if (!dados.nome.trim()) erros.nome = "Informe seu nome.";
  if (!dados.email.trim()) erros.email = "Informe seu e-mail.";
  else if (!emailValido(dados.email)) erros.email = "Informe um e-mail válido.";
  if (dados.telefone && dados.telefone.trim() && !telefoneValido(dados.telefone)) {
    erros.telefone = "Informe um telefone válido (com DDD).";
  }
  if (!dados.senha) erros.senha = "Crie uma senha.";
  else if (dados.senha.length < SENHA_MINIMA) erros.senha = `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (dados.senha && dados.confirmarSenha !== dados.senha) erros.confirmarSenha = "As senhas não coincidem.";
  return erros;
}

export function telefoneValido(telefone: string): boolean {
  const digitos = telefone.replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 13;
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** CPF (11) ou CNPJ (14) — valida os dígitos verificadores. */
export function documentoValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length === 11) return cpfValido(d);
  if (d.length === 14) return cnpjValido(d);
  return false;
}

function cpfValido(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (fatorInicial: number) => {
    let soma = 0;
    for (let i = 0; i < fatorInicial - 1; i++) soma += Number(cpf[i]) * (fatorInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calc(10) === Number(cpf[9]) && calc(11) === Number(cpf[10]);
}

function cnpjValido(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (tamanho: number) => {
    const pesos = tamanho === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((acc, peso, i) => acc + Number(cnpj[i]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

/** Formata CPF/CNPJ para exibição (000.000.000-00 / 00.000.000/0000-00). */
export function formatarDocumento(valor: string): string {
  const d = somenteDigitos(valor);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return valor;
}

/** Converte "1.234,56" ou "1234.56" em número; retorna null se vazio e NaN se inválido. */
export function parseValorMonetario(valor: string): number | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return NaN;
  return Number(normalizado);
}

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "Valor a combinar";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
