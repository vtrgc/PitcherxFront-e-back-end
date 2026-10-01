import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Cria um JWT sem assinatura válida (o front só lê o payload; quem valida é o servidor). */
function jwt(payload: Record<string, unknown>) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64(payload)}.assinatura`;
}

function respostaJson(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

class StorageMemoria {
  private dados = new Map<string, string>();
  getItem(k: string) {
    return this.dados.has(k) ? this.dados.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.dados.set(k, v);
  }
  removeItem(k: string) {
    this.dados.delete(k);
  }
}

type ErroTeste = Error & { status?: number };

let eventos: string[] = [];

beforeEach(() => {
  eventos = [];
  vi.stubGlobal("window", {
    localStorage: new StorageMemoria(),
    dispatchEvent: (e: Event) => {
      eventos.push(e.type);
      return true;
    },
  });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lib/api", () => {
  it("decodifica o token e detecta expiração", async () => {
    const { decodificarToken, tokenExpirado } = await import("../app/lib/api");
    const valido = jwt({ sub: "a@b.com", idUsuario: 7, roles: ["USUARIO"], exp: Math.floor(Date.now() / 1000) + 3600 });
    const vencido = jwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    expect(decodificarToken(valido)?.idUsuario).toBe(7);
    expect(tokenExpirado(valido)).toBe(false);
    expect(tokenExpirado(vencido)).toBe(true);
    expect(tokenExpirado("lixo")).toBe(true);
    expect(tokenExpirado(null)).toBe(true);
  });

  it("envia Authorization Bearer e Content-Type JSON", async () => {
    const { api, setToken } = await import("../app/lib/api");
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    setToken(token);
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(200, [{ idArea: 1 }]));
    vi.stubGlobal("fetch", fetchMock);

    const dados = await api<unknown[]>("/area", { method: "POST", body: "{}" });
    expect(dados).toEqual([{ idArea: 1 }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/area");
    expect(init.headers.Authorization).toBe(`Bearer ${token}`);
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("não envia token em rotas públicas (semAutenticacao)", async () => {
    const { api, setToken } = await import("../app/lib/api");
    setToken(jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    await api("/usuario/login", { method: "POST", body: "{}", semAutenticacao: true });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("204 retorna undefined", async () => {
    const { api } = await import("../app/lib/api");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api("/x", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("usa a mensagem do GlobalExceptionHandler e os erros de campo", async () => {
    const { api, ApiError } = await import("../app/lib/api");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaJson(400, { message: "Erro de validação nos campos.", errors: { nomeArea: "O nome da área é obrigatório!" } })
      )
    );
    const erro = (await api("/area").catch((e) => e)) as ErroTeste;
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(400);
    expect(erro.message).toBe("O nome da área é obrigatório!");
  });

  it("não expõe detalhes de erros 5xx", async () => {
    const { api } = await import("../app/lib/api");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson(500, { message: "NullPointerException em X" })));
    const erro = (await api("/x").catch((e) => e)) as ErroTeste;
    expect(erro.message).not.toContain("NullPointer");
  });

  it("403 com token vencido => sessão expirada (o backend não responde 401)", async () => {
    const { api, setToken, getToken, EVENTO_SESSAO_EXPIRADA } = await import("../app/lib/api");
    setToken(jwt({ exp: Math.floor(Date.now() / 1000) - 5 }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    const erro = (await api("/postagem").catch((e) => e)) as ErroTeste;
    expect(erro.message).toMatch(/sessão expirou/i);
    expect(getToken()).toBeNull();
    expect(eventos).toContain(EVENTO_SESSAO_EXPIRADA);
  });

  it("403 com token válido é falta de permissão, não logout", async () => {
    const { api, setToken, getToken } = await import("../app/lib/api");
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    setToken(token);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson(403, { message: "Acesso negado: Access Denied" })));
    const erro = (await api("/area", { method: "POST", body: "{}" }).catch((e) => e)) as ErroTeste;
    expect(erro.message).toBe("Você não tem permissão para realizar esta ação.");
    expect(getToken()).toBe(token);
    expect(eventos).toHaveLength(0);
  });

  it("falha de rede vira NetworkError", async () => {
    const { api, NetworkError } = await import("../app/lib/api");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api("/x")).rejects.toBeInstanceOf(NetworkError);
  });

  it("mapComLimite respeita o limite de concorrência e a ordem", async () => {
    const { mapComLimite } = await import("../app/lib/api");
    let ativos = 0;
    let maximo = 0;
    const r = await mapComLimite([1, 2, 3, 4, 5], 2, async (n) => {
      ativos++;
      maximo = Math.max(maximo, ativos);
      await new Promise((res) => setTimeout(res, 5));
      ativos--;
      if (n === 3) throw new Error("x");
      return n * 10;
    });
    expect(maximo).toBeLessThanOrEqual(2);
    expect(r.map((x) => x.status)).toEqual(["fulfilled", "fulfilled", "rejected", "fulfilled", "fulfilled"]);
    expect(r[4]).toEqual({ status: "fulfilled", value: 50 });
  });
});

describe("contratos dos serviços com o backend", () => {
  it("GET /usuario/{id} envia também ?id= (o controller não usa @PathVariable)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(200, { idUsuario: 5 }));
    vi.stubGlobal("fetch", fetchMock);
    const { buscarUsuario } = await import("../app/services/usuario.service");
    await buscarUsuario(5);
    await buscarUsuario(5); // cache
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/usuario/5?id=5");
  });

  it("redefinir senha usa PUT", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    const { redefinirSenha } = await import("../app/services/usuario.service");
    await redefinirSenha(3, "a", "b");
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/usuario/redefinir-senha/3");
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  });

  it("curtidas: rota de contagem e objeto de status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respostaJson(200, 4))
      .mockResolvedValueOnce(respostaJson(200, { jaCurtiu: false, quantidadeCurtidas: 2 }));
    vi.stubGlobal("fetch", fetchMock);
    const { buscarContagemCurtidas, buscarStatusCurtida } = await import("../app/services/curtida.service");
    expect(await buscarContagemCurtidas(1, 9)).toBe(4);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/curtida/contar-curtidas/1/9");
    // Antes o objeto {jaCurtiu:false} era tratado como boolean "true".
    expect(await buscarStatusCurtida(7, 1, 9)).toEqual({ jaCurtiu: false, quantidadeCurtidas: 2 });
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8080/curtida/status/7/1/9");
  });

  it("login guarda o token e rejeita resposta sem token", async () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respostaJson(200, { idUsuario: 1, nomeUsuario: "A", emailUsuario: "a@a.com", isActive: true, token, roles: [{ idRole: 3, nomeRole: "USUARIO" }] }))
      .mockResolvedValueOnce(respostaJson(200, { idUsuario: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const { login } = await import("../app/services/usuario.service");
    const { getToken } = await import("../app/lib/api");
    await login({ emailUsuario: "a@a.com", senhaUsuario: "x" });
    expect(getToken()).toBe(token);
    await expect(login({ emailUsuario: "a@a.com", senhaUsuario: "x" })).rejects.toThrow();
  });
});
