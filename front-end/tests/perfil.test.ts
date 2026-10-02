import { describe, expect, it } from "vitest";
import {
  LINKEDIN_NAO_INFORMADO,
  completudePerfil,
  formatarPercentual,
  linkedinDoPerfil,
  enderecoIgual,
  enderecoInicial,
  enderecoVazio,
  localizacaoPublica,
  paraRequestEndereco,
  paraRequestProfissional,
  profissionalIgual,
  profissionalInicial,
  profissionalVazio,
  validarEndereco,
  validarProfissional,
} from "../app/lib/perfil";
import { extensaoDoArquivo, TAMANHO_MAXIMO_FOTO, validarArquivoFoto } from "../app/lib/imagemPerfil";

describe("perfil profissional (PerfilUsuarioRequestDTO)", () => {
  const valido = { linkedin: "linkedin.com/in/ana", identificador: "52998224725", idEspecialidade: 3 as const };

  it("exige área e CPF/CNPJ; LinkedIn é opcional", () => {
    expect(validarProfissional(valido)).toEqual({});
    const parcial = validarProfissional({ linkedin: "linkedin.com/in/ana", identificador: "", idEspecialidade: "" });
    expect(Object.keys(parcial).sort()).toEqual(["idEspecialidade", "identificador"]);
  });

  it("rejeita link perigoso, CPF inválido e LinkedIn acima da coluna VARCHAR(80)", () => {
    expect(validarProfissional({ ...valido, linkedin: "javascript:alert(1)" }).linkedin).toBeTruthy();
    expect(validarProfissional({ ...valido, identificador: "111.111.111-11" }).identificador).toBeTruthy();
    expect(validarProfissional({ ...valido, linkedin: `linkedin.com/in/${"a".repeat(80)}` }).linkedin).toMatch(/80/);
  });

  it("aceita perfil sem LinkedIn e envia o marcador exigido pelo @NotBlank do backend", () => {
    const semLinkedin = { ...valido, linkedin: "" };
    expect(validarProfissional(semLinkedin)).toEqual({});
    expect(validarProfissional({ ...semLinkedin, linkedin: "   " })).toEqual({});
    expect(paraRequestProfissional(semLinkedin, 9).linkedin).toBe(LINKEDIN_NAO_INFORMADO);
  });

  it("o marcador nunca vira link nem aparece no formulário", () => {
    expect(linkedinDoPerfil({ linkedin: LINKEDIN_NAO_INFORMADO })).toBeNull();
    expect(linkedinDoPerfil({ linkedin: "" })).toBeNull();
    expect(linkedinDoPerfil({ linkedin: "linkedin.com/in/ana" })).toBe("https://linkedin.com/in/ana");
    const perfil = { idPerfilUsuario: 1, linkedin: LINKEDIN_NAO_INFORMADO, identificador: "529.982.247-25", especialidade: { idEspecialidade: 3, nomeEspecialidade: "X" }, usuario: { idUsuario: 9, nomeUsuario: "A", emailUsuario: "a@a.com", active: true } };
    expect(profissionalInicial(perfil).linkedin).toBe("");
  });

  it("monta o request no formato da API", () => {
    expect(paraRequestProfissional(valido, 9)).toEqual({
      linkedin: "https://linkedin.com/in/ana",
      identificador: "529.982.247-25",
      idEspecialidade: 3,
      idUsuario: 9,
    });
  });

  it("detecta alterações e estado vazio", () => {
    const base = profissionalInicial(null);
    expect(profissionalVazio(base)).toBe(true);
    expect(profissionalIgual(base, { ...base })).toBe(true);
    expect(profissionalIgual({ ...valido, identificador: "529.982.247-25" }, valido)).toBe(true);
    expect(profissionalIgual(valido, { ...valido, idEspecialidade: 4 })).toBe(false);
  });
});

describe("endereço (EnderecoRequestDTO)", () => {
  const ok = { cep: "01310-100", uf: "SP", bairro: "Bela Vista", logradouro: "Av. Paulista", complemento: "Apto 1", numeroCasa: "1000" };

  it("valida todos os campos obrigatórios", () => {
    expect(validarEndereco(ok)).toEqual({});
    expect(Object.keys(validarEndereco(enderecoInicial(null))).length).toBe(6);
    expect(validarEndereco({ ...ok, bairro: "x".repeat(156) }).bairro).toBeTruthy();
  });

  it("envia CEP só com dígitos e número como inteiro", () => {
    expect(paraRequestEndereco(ok, 2)).toMatchObject({ cep: "01310100", numeroCasa: 1000, usuarioId: 2 });
  });

  it("compara e detecta vazio", () => {
    expect(enderecoVazio(enderecoInicial(null))).toBe(true);
    expect(enderecoIgual(ok, { ...ok, cep: "01310100" })).toBe(true);
    expect(enderecoIgual(ok, { ...ok, uf: "RJ" })).toBe(false);
  });

  it("localização pública mostra apenas o estado", () => {
    expect(localizacaoPublica({ uf: "SP" })).toBe("São Paulo, Brasil");
    expect(localizacaoPublica({ uf: "XX" })).toBeNull();
    expect(localizacaoPublica(null)).toBeNull();
  });
});

describe("completude do perfil", () => {
  it("usa somente os 3 itens: feitos / 3", () => {
    expect(completudePerfil({ temFoto: false, temPerfilProfissional: false, temEndereco: false }).percentual).toBe(0);
    expect(completudePerfil({ temFoto: true, temPerfilProfissional: false, temEndereco: false }).percentual).toBeCloseTo(33.333, 2);
    const dois = completudePerfil({ temFoto: true, temPerfilProfissional: true, temEndereco: false });
    expect(dois.percentual).toBeCloseTo(66.667, 2);
    expect(dois.feitos).toBe(2);
    expect(dois.total).toBe(3);
    expect(completudePerfil({ temFoto: true, temPerfilProfissional: true, temEndereco: true }).percentual).toBe(100);
  });

  it("formata em pt-BR com até 2 casas", () => {
    expect(formatarPercentual(200 / 3)).toBe("66,67%");
    expect(formatarPercentual(100 / 3)).toBe("33,33%");
    expect(formatarPercentual(100)).toBe("100%");
    expect(formatarPercentual(0)).toBe("0%");
  });
});

describe("arquivo de foto (regras do ImagemUploadUtil)", () => {
  it("aceita apenas JPG/JPEG/PNG/WEBP até 10 MB", () => {
    expect(validarArquivoFoto({ name: "eu.JPG", size: 1000, type: "image/jpeg" })).toBeNull();
    expect(validarArquivoFoto({ name: "eu.webp", size: 1000, type: "" })).toBeNull();
    expect(validarArquivoFoto({ name: "eu.gif", size: 1000, type: "image/gif" })).toMatch(/Formato/);
    expect(validarArquivoFoto({ name: "semextensao", size: 1000, type: "image/png" })).toMatch(/Formato/);
    expect(validarArquivoFoto({ name: "doc.png", size: 1000, type: "application/pdf" })).toBeTruthy();
    expect(validarArquivoFoto({ name: "g.png", size: TAMANHO_MAXIMO_FOTO + 1, type: "image/png" })).toMatch(/10 MB/);
    expect(validarArquivoFoto({ name: "v.png", size: 0, type: "image/png" })).toMatch(/vazio/);
    expect(extensaoDoArquivo("a.b.PNG")).toBe(".png");
  });
});
