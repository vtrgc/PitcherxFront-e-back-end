/**
 * Auditoria no navegador (Playwright) do PitcherX, com front e backend reais.
 *
 *   ADMIN_EMAIL=... ADMIN_SENHA=... MAILS_LOG=/caminho/mails.log node e2e/navegador_auditoria.js
 *
 * 1) Percorre todas as páginas como administrador e como usuários comuns, em computador, tablet e
 *    celular, registrando erros de execução, respostas HTTP de erro, imagens quebradas e rolagem
 *    horizontal.
 * 2) Executa fluxos reais: logout, credenciais erradas, recuperação de senha, edição de conta e
 *    foto, capa do perfil, publicação/curtida/comentário, busca, conexões, troca de senha e
 *    cadastros do administrador — conferindo a persistência depois de recarregar a página.
 * Os dados são criados com e-mails aleatórios (nada existente é apagado).
 */
const { chromium, devices } = require("playwright");
const fs = require("fs");

const BASE = (process.env.FRONT_URL || "http://localhost:3000").replace(/\/+$/, "");
const API = BASE + "/backend";
const { ADMIN_EMAIL, ADMIN_SENHA, MAILS_LOG } = process.env;
if (!ADMIN_EMAIL || !ADMIN_SENHA) {
  console.error("Defina ADMIN_EMAIL e ADMIN_SENHA.");
  process.exit(2);
}

const resultados = [];
let secao = "";
const ok = (nome, cond, info = "") => {
  resultados.push({ secao, nome, status: cond ? "APROVADO" : "REPROVADO", detalhe: cond ? "" : String(info).slice(0, 300) });
  console.log(`${cond ? "  ok  " : "  FAIL"} ${nome}${cond ? "" : " -> " + String(info).slice(0, 300)}`);
  return cond;
};
const naoTestado = (nome, motivo) => {
  resultados.push({ secao, nome, status: "NÃO TESTADO", detalhe: motivo });
  console.log(`  --   ${nome} (não testado: ${motivo})`);
};
const titulo = (t) => {
  secao = t;
  console.log(`\n== ${t}`);
};
const ve = async (loc, t = 12000) => {
  try {
    await loc.first().waitFor({ timeout: t });
    return true;
  } catch {
    return false;
  }
};

async function api(path, token, method = "GET", body) {
  const r = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  let corpo = null;
  try {
    corpo = t ? JSON.parse(t) : null;
  } catch {
    corpo = t;
  }
  return { status: r.status, body: corpo };
}

function codigoNoEmail(destinatario, depoisDe) {
  if (!MAILS_LOG || !fs.existsSync(MAILS_LOG)) return null;
  const msgs = fs.readFileSync(MAILS_LOG, "utf8").split("\n=====\n").slice(depoisDe);
  for (const bruto of msgs.reverse()) {
    if (!bruto.toLowerCase().includes(destinatario.toLowerCase())) continue;
    // corpo em base64 ou quoted-printable: decodifica os blocos e procura 6 dígitos
    const blocos = bruto.split(/\n\n/).slice(1).join("\n");
    const decodificado = blocos
      .split(/\n--/)
      .map((p) => {
        const b64 = p.replace(/^[\s\S]*?\n\n/, "").replace(/\s+/g, "");
        if (/content-transfer-encoding:\s*base64/i.test(p)) {
          try {
            return Buffer.from(b64, "base64").toString("utf8");
          } catch {
            return p;
          }
        }
        return p.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
      })
      .join(" ");
    const achados = decodificado.match(/(?<!\d)\d{6}(?!\d)/g);
    if (achados) return achados[achados.length - 1];
  }
  return null;
}
const qtdEmails = () => (MAILS_LOG && fs.existsSync(MAILS_LOG) ? fs.readFileSync(MAILS_LOG, "utf8").split("\n=====\n").length - 1 : 0);

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c63606060000000040001f61738550000000049454e44ae426082",
  "hex"
);

(async () => {
  const sufixo = Date.now().toString(36);
  const SENHA = "Segura123";
  const adm = (await api("/usuario/login", null, "POST", { emailUsuario: ADMIN_EMAIL, senhaUsuario: ADMIN_SENHA })).body?.token;
  if (!adm) throw new Error("login do administrador falhou");

  // ---------------------------------------------------------------- dados iniciais (API)
  const contas = {};
  for (const [chave, nome] of [["ana", "Ana Navegador"], ["bia", "Bia Navegador"]]) {
    const email = `${chave}.${sufixo}@teste.com`;
    const c = await api("/usuario/cadastro-usuario", null, "POST", { nomeUsuario: nome, emailUsuario: email, senhaUsuario: SENHA });
    await api(`/usuario/admin/analise-identidade/${c.body.idUsuario}`, adm, "POST", { status: "APROVADA" });
    const l = await api("/usuario/login", null, "POST", { emailUsuario: email, senhaUsuario: SENHA });
    // o código do e-mail é pedido no primeiro acesso; estas contas só servem de cenário
    const cod = codigoNoEmail(email, 0);
    if (cod) await api("/usuario/verificar-conta", l.body.token, "POST", { codigoVerificacao: cod });
    contas[chave] = { nome, email, id: c.body.idUsuario, token: l.body.token, senha: SENHA };
  }
  const { ana, bia } = contas;
  const esp = (await api("/especialidade", ana.token)).body[0].idEspecialidade;
  const cpf = (n) => {
    const d = String(n).padStart(9, "0").slice(-9).split("").map(Number);
    for (let k = 0; k < 2; k++) {
      const s = d.reduce((acc, v, i) => acc + v * (d.length + 1 - i), 0);
      const r = 11 - (s % 11);
      d.push(r >= 10 ? 0 : r);
    }
    return d.join("");
  };
  for (const [i, c] of [ana, bia].entries())
    await api("/perfil-usuario", c.token, "POST", { linkedin: `https://linkedin.com/in/${c.email.split("@")[0]}`, identificador: cpf(parseInt(sufixo, 36) % 1e8 + i), idEspecialidade: esp, idUsuario: c.id });
  const tipo = (await api("/tipo-projeto", ana.token)).body[0].idTipoProjeto;
  const f = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const proj = (
    await api(`/projeto/${ana.id}`, ana.token, "POST", {
      nomeProjeto: `Horta Vertical ${sufixo}`, descricaoProjeto: "Hortas em prédios", dataInicioProjeto: f(new Date()),
      dataFimProjeto: f(new Date(Date.now() + 200 * 864e5)), tipoProjetoId: tipo, metaFinanceira: 50000, investimentoMinimo: 500,
      participacaoOferecida: 5, riscoProjetoIds: [],
    })
  ).body;
  const prop = (await api("/proposta", bia.token, "POST", { descricaoProposta: "Aporte inicial", valorProposta: 5000, projetoId: proj.idProjeto })).body;
  const agora = new Date();
  const contrato = (
    await api("/contrato", ana.token, "POST", {
      tituloContrato: "Aporte inicial", descricaoContrato: "Formaliza o aporte", dataInicioContrato: agora.toISOString().slice(0, 19),
      dataFimContrato: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 19), projetoId: proj.idProjeto, propostaId: prop.idProposta,
    })
  ).body;
  const post = (await api("/postagem", ana.token, "POST", { tituloPostagem: "Primeira colheita", textoPostagem: "Colhemos alfaces!", dataPostagem: f(new Date()), usuarioId: ana.id })).body;

  const browser = await chromium.launch();
  const contextos = [];
  async function abrir({ viewport, dispositivo, token, usuario, movel } = {}) {
    const ctx = await browser.newContext(
      dispositivo
        ? { ...devices[dispositivo] }
        : { viewport: viewport || { width: 1366, height: 900 }, ...(movel ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) }
    );
    contextos.push(ctx);
    if (token)
      await ctx.addInitScript(
        ([t, u]) => {
          try {
            localStorage.setItem("pitcherx:token", t);
            localStorage.setItem("pitcherx:usuario", JSON.stringify(u));
          } catch {}
        },
        [token, usuario]
      );
    const page = await ctx.newPage();
    page.erros = [];
    page.on("pageerror", (e) => page.erros.push("ERRO DE EXECUÇÃO: " + e.message));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && page.erros.push("console: " + m.text()));
    page.on("response", (r) => r.status() >= 400 && page.erros.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(BASE, "")}`));
    return page;
  }
  const authUser = (c, roles = ["USUARIO"]) => ({ idUsuario: c.id, nomeUsuario: c.nome, emailUsuario: c.email, isActive: true, roles });

  // ---------------------------------------------------------------- 1. todas as páginas
  titulo("Navegação por todas as páginas (computador, tablet e celular)");
  const admLogin = (await api("/usuario/login", null, "POST", { emailUsuario: ADMIN_EMAIL, senhaUsuario: ADMIN_SENHA })).body;
  const perfis = [
    {
      quem: "visitante",
      token: null,
      rotas: ["/", "/como-funciona", "/auth/login", "/auth/cadastro", "/auth/esqueci-senha", "/rota-inexistente"],
    },
    {
      quem: "admin",
      token: adm,
      usuario: { idUsuario: admLogin.idUsuario, nomeUsuario: admLogin.nomeUsuario, emailUsuario: ADMIN_EMAIL, isActive: true, roles: ["ADMIN"] },
      rotas: ["/admin", "/admin/usuarios", "/admin/identidades", "/admin/denuncias", "/admin/perfis", "/admin/projetos", "/admin/solicitacoes",
        "/admin/postagens", "/admin/propostas", "/admin/interacoes", "/admin/tipos-projeto", "/admin/riscos", "/admin/areas", "/admin/subareas",
        "/admin/especialidades", "/admin/enderecos", "/admin/termos", "/admin/termos-postagem", "/admin/termos-vinculo", "/contratos",
        `/contratos/${contrato.idContrato}`, `/projetos/${proj.idProjeto}`, "/notificacoes", "/configuracoes", "/perfil", `/perfil/${ana.id}`, "/termos", "/tipos-projeto"],
    },
    {
      quem: "criadora",
      token: ana.token,
      usuario: authUser(ana),
      rotas: ["/feed", "/explorar", "/projetos", `/projetos/${proj.idProjeto}`, "/propostas", `/propostas/${prop.idProposta}`, "/contratos",
        `/contratos/${contrato.idContrato}`, "/solicitacoes", "/conexoes", "/notificacoes", "/mensagens", "/denuncias", "/perfil", "/perfil/editar",
        `/perfil/${bia.id}`, `/publicacao/${post.idPostagem}`, `/comentarios/${post.idPostagem}`, "/comentarios", "/configuracoes", "/termos",
        "/tipos-projeto", "/auth/completar-cadastro", "/auth/verificar-conta"],
    },
    {
      quem: "investidora",
      token: bia.token,
      usuario: authUser(bia),
      rotas: ["/feed", `/projetos/${proj.idProjeto}`, "/propostas", `/propostas/${prop.idProposta}`, "/contratos", `/contratos/${contrato.idContrato}`, "/perfil", `/perfil/${ana.id}`],
    },
  ];
  // TELAS=completo: seis tamanhos (responsividade); padrão: computador, tablet e celular.
  const telas =
    process.env.TELAS === "completo"
      ? [
          { nome: "desktop 1920", viewport: { width: 1920, height: 1080 } },
          { nome: "notebook 1366", viewport: { width: 1366, height: 768 } },
          { nome: "tablet paisagem 1024", viewport: { width: 1024, height: 768 } },
          { nome: "tablet retrato 768", viewport: { width: 768, height: 1024 } },
          { nome: "celular 390", dispositivo: "iPhone 13" },
          { nome: "celular pequeno 360", viewport: { width: 360, height: 740 }, movel: true },
        ]
      : [
          { nome: "computador", viewport: { width: 1366, height: 900 } },
          { nome: "tablet", viewport: { width: 768, height: 1024 } },
          { nome: "celular", dispositivo: "iPhone 13" },
        ];
  const PRINTS = process.env.SAIDA_DIR ? require("path").join(process.env.SAIDA_DIR, "responsivo") : "";
  // 404 esperados: a rota inexistente e o portão de termos (a investidora ainda não aceitou os termos).
  const esperado = (e) => /HTTP 404 GET \/rota-inexistente/.test(e) || /HTTP 403 GET \/backend\/projeto\/\d+$/.test(e);
  let paginas = 0;
  const problemas = [];
  const imagensExternas = new Set();
  for (const p of perfis) {
    for (const t of telas) {
      const page = await abrir({ viewport: t.viewport, dispositivo: t.dispositivo, movel: t.movel, token: p.token, usuario: p.usuario });
      for (const rota of p.rotas) {
        page.erros = [];
        try {
          await page.goto(BASE + rota, { waitUntil: "networkidle", timeout: 30000 });
        } catch (e) {
          page.erros.push("timeout: " + e.message.split("\n")[0]);
        }
        await page.waitForTimeout(400);
        paginas++;
        const info = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          quebrada: /Application error|Unhandled Runtime Error|This page could not be found/.test(document.body.innerText) && !location.pathname.includes("inexistente"),
          imagensQuebradas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:")).map((i) => i.src),
          // Ícone que o layout encolheu por falta de espaço (botão estreito demais para o texto):
          // largura de layout abaixo de 75% da declarada. Usa o estilo calculado, que não sofre
          // efeito de transform/escala (animações da página inicial).
          iconesEncolhidos: [...document.querySelectorAll("svg[width]")]
            .filter((s) => {
              const declarada = parseFloat(s.getAttribute("width"));
              if (!declarada || s.getClientRects().length === 0) return false;
              return parseFloat(getComputedStyle(s).width) < declarada * 0.75;
            })
            .slice(0, 3)
            .map((s) => `${(s.getAttribute("class") || "svg").replace("lucide ", "").split(" ")[0]} ${parseFloat(getComputedStyle(s).width).toFixed(1)}/${s.getAttribute("width")}px em "${(s.closest("button,a") || s.parentElement).textContent.trim().slice(0, 25)}"`),
          // Texto ou controle (link, botão, campo) que passa da borda da tela sem ter como ser
          // alcançado: ignora o que está em contêiner com rolagem própria (carrossel, tabela), o que
          // é cortado dentro da tela de propósito (reticências) e o que é decorativo/oculto.
          // Validado injetando um parágrafo de 520px em <main> e em <form> a 360px: detectado.
          foraDaTela: (() => {
            const W = window.innerWidth;
            const fora = (r) => r.right > W + 1 || r.left < -1;
            const temTexto = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
            const controle = (el) => /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL)$/.test(el.tagName);
            return [...document.querySelectorAll("body *")]
              .filter((el) => {
                if (!temTexto(el) && !controle(el)) return false;
                const r = el.getBoundingClientRect();
                if (r.width <= 1 || r.height <= 1 || !fora(r)) return false;
                const cs = getComputedStyle(el);
                if (cs.visibility === "hidden" || cs.display === "none" || cs.position === "fixed" || Number(cs.opacity) === 0) return false;
                for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
                  const ca = getComputedStyle(a);
                  if (a.getAttribute("aria-hidden") === "true" || ca.position === "fixed" || Number(ca.opacity) === 0 || ca.visibility === "hidden") return false;
                  if (/(auto|scroll)/.test(ca.overflowX)) return false;
                  const ra = a.getBoundingClientRect();
                  if (ca.overflowX !== "visible" && !fora(ra) && ra.width < W - 2) return false;
                }
                return true;
              })
              .slice(0, 3)
              .map((el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${el.textContent.trim().slice(0, 30)}" (${Math.round(el.getBoundingClientRect().left)}→${Math.round(el.getBoundingClientRect().right)})`);
          })(),
        }));
        if (PRINTS && t.movel) {
          require("fs").mkdirSync(PRINTS, { recursive: true });
          await page.screenshot({ path: require("path").join(PRINTS, `${p.quem}${rota.replace(/[/?=&]+/g, "_") || "_inicio"}.png`) }).catch(() => {});
        }
        const erros = page.erros.filter((e) => !esperado(e));
        const prob = [];
        if (erros.length) prob.push(...new Set(erros));
        if (info.overflow > 1) prob.push(`rolagem horizontal de ${info.overflow}px`);
        if (info.foraDaTela.length) prob.push(`fora da tela: ${info.foraDaTela.join(", ")}`);
        if (info.iconesEncolhidos.length) prob.push(`ícone encolhido: ${info.iconesEncolhidos.join(", ")}`);
        if (info.quebrada) prob.push("página com erro");
        // Imagens de bancos externos (Unsplash) dependem da rede do ambiente: contadas à parte.
        const externas = info.imagensQuebradas.filter((src) => !src.startsWith(BASE) && !src.includes("localhost"));
        const internas = info.imagensQuebradas.filter((src) => !externas.includes(src));
        externas.forEach((src) => imagensExternas.add(new URL(src).host));
        if (internas.length) prob.push("imagens quebradas: " + internas.join(", "));
        if (prob.length) problemas.push(`[${p.quem}/${t.nome}] ${rota}: ${prob.join(" | ")}`);
      }
      await page.context().close();
    }
  }
  if (problemas.length) console.log("  Problemas encontrados:\n    " + problemas.join("\n    "));
  ok(`${paginas} aberturas de página sem erros, sem rolagem horizontal e sem imagens quebradas`, problemas.length === 0, `${problemas.length} página(s) com problema (lista acima)`);
  if (imagensExternas.size) naoTestado(`imagens externas (${[...imagensExternas].join(", ")})`, "o host não é acessível pela rede deste ambiente");

  // SOMENTE_PAGINAS=1: só a varredura de páginas (ex.: responsividade em seis tamanhos).
  if (process.env.SOMENTE_PAGINAS) {
    await browser.close();
    const r = resultados.filter((x) => x.status === "REPROVADO").length;
    console.log(`\n${resultados.filter((x) => x.status === "APROVADO").length}/${resultados.length} verificações aprovadas · ${r} reprovadas`);
    process.exit(r ? 1 : 0);
  }

  // ---------------------------------------------------------------- 2. autenticação
  titulo("Autenticação");
  let page = await abrir();
  await page.goto(BASE + "/feed");
  ok("página protegida sem login leva ao login", await ve(page.getByRole("heading", { name: /Bem-vindo de volta/ })) && page.url().includes("/auth/login"), page.url());
  await page.fill("input[name=email]", ana.email);
  await page.fill("input[type=password]", "senhaErrada1");
  await page.click("button[type=submit]");
  ok("credenciais incorretas mostram aviso", await ve(page.getByText("E-mail ou senha inválidos.")));
  await page.fill("input[type=password]", SENHA);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/auth/login"), { timeout: 15000 }).catch(() => {});
  ok("login pela tela", !page.url().includes("/auth/login"), page.url());
  await page.goto(BASE + "/feed", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  ok("sessão persiste ao recarregar", page.url().includes("/feed"), page.url());
  await page.getByRole("button", { name: "Sair da conta" }).first().click();
  await page.waitForURL(/\/auth\/login/, { timeout: 10000 }).catch(() => {});
  await page.goto(BASE + "/perfil");
  ok("logout encerra a sessão", await ve(page.getByRole("heading", { name: /Bem-vindo de volta/ })), page.url());
  const tokenGuardado = await page.evaluate(() => localStorage.getItem("pitcherx:token"));
  ok("logout remove o token do navegador", !tokenGuardado);

  if (MAILS_LOG) {
    const antes = qtdEmails();
    await page.goto(BASE + "/auth/esqueci-senha");
    await page.fill("input[name=email]", bia.email);
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.waitForTimeout(2500);
    const codigo = codigoNoEmail(bia.email, antes);
    if (ok("e-mail com código de redefinição enviado", !!codigo)) {
      await page.getByLabel("Dígito 1 de 6").fill(codigo);
      await page.getByRole("button", { name: "Confirmar código" }).click();
      await ve(page.locator("input[name=new-password]"));
      await page.fill("input[name=new-password]", "NovaSenha1");
      await page.fill("input[name=confirm-password]", "NovaSenha1");
      await page.getByRole("button", { name: "Salvar nova senha" }).click();
      await page.waitForTimeout(2000);
      const novo = await api("/usuario/login", null, "POST", { emailUsuario: bia.email, senhaUsuario: "NovaSenha1" });
      ok("redefinir senha pela tela e entrar com a nova", novo.status === 200, novo.status);
      if (novo.status === 200) {
        bia.senha = "NovaSenha1";
        bia.token = novo.body.token;
      }
    }
  } else naoTestado("recuperação de senha pela tela", "sem log de e-mails (MAILS_LOG)");
  await page.context().close();

  // ---------------------------------------------------------------- primeiro acesso: código do e-mail
  titulo("Primeiro acesso (código de verificação)");
  if (MAILS_LOG) {
    const caio = { nome: "Caio Navegador", email: `caio.${sufixo}@teste.com` };
    const c = await api("/usuario/cadastro-usuario", null, "POST", { nomeUsuario: caio.nome, emailUsuario: caio.email, senhaUsuario: SENHA });
    await api(`/usuario/admin/analise-identidade/${c.body.idUsuario}`, adm, "POST", { status: "APROVADA" });
    const pv = await abrir();
    await pv.goto(BASE + "/auth/login", { waitUntil: "networkidle" });
    await pv.fill("input[name=email]", caio.email);
    await pv.fill("input[name=password]", SENHA);
    await pv.getByRole("button", { name: "Entrar" }).click();
    await pv.waitForURL(/\/auth\/verificar-conta/, { timeout: 15000 }).catch(() => {});
    ok("primeiro acesso depois da aprovação pede o código do e-mail", pv.url().includes("/auth/verificar-conta"), pv.url());
    await pv.goto(BASE + "/feed");
    await pv.waitForURL(/\/auth\/verificar-conta/, { timeout: 10000 }).catch(() => {});
    ok("sem o código, as páginas protegidas voltam para a verificação", pv.url().includes("/auth/verificar-conta"), pv.url());
    await pv.getByLabel("Código de verificação").fill("000000");
    await pv.getByRole("button", { name: "Verificar conta" }).click();
    ok("código errado mostra aviso", await ve(pv.getByText(/Código inválido/)));
    const antesReenvio = qtdEmails();
    await pv.getByRole("button", { name: /peça um novo código/ }).click();
    ok("pedir um novo código pela tela", await ve(pv.getByText(/Enviamos um novo código/)));
    const novoCodigo = codigoNoEmail(caio.email, antesReenvio);
    ok("novo código chega por e-mail", !!novoCodigo);
    if (novoCodigo) {
      await pv.getByLabel("Código de verificação").fill(novoCodigo);
      await pv.getByRole("button", { name: "Verificar conta" }).click();
      await pv.waitForURL((u) => !u.pathname.startsWith("/auth/verificar-conta"), { timeout: 15000 }).catch(() => {});
      ok("código correto conclui o cadastro (segue para completar o perfil)", pv.url().includes("/auth/completar-cadastro"), pv.url());
      await pv.goto(BASE + "/feed", { waitUntil: "networkidle" });
      ok("depois de verificar, as páginas ficam liberadas", pv.url().includes("/feed"), pv.url());
    }
    await pv.context().close();
  } else naoTestado("código de verificação no primeiro acesso", "sem log de e-mails (MAILS_LOG)");

  // ---------------------------------------------------------------- 3. perfil
  titulo("Perfil");
  page = await abrir({ token: ana.token, usuario: authUser(ana) });
  await page.goto(BASE + "/perfil/editar", { waitUntil: "networkidle" });
  await page.fill("#conta-nome", "Ana Navegador Silva");
  await page.fill("#conta-telefone", "(11) 97777-6666");
  await page.fill("#conta-senha", "errada123");
  await page.getByRole("button", { name: "Salvar dados da conta" }).click();
  ok("dados da conta: senha errada é recusada", await ve(page.getByText("Senha atual incorreta.")));
  await page.fill("#conta-senha", SENHA);
  await page.getByRole("button", { name: "Salvar dados da conta" }).click();
  ok("dados da conta salvos", await ve(page.getByText("Dados da conta atualizados.")));
  await page.fill("#prof-biografia", "Engenheira agrônoma apaixonada por hortas urbanas.");
  await page.locator("[data-testid=input-foto]").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.waitForTimeout(2500);
  await page.goto(BASE + "/perfil", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  ok("nome novo persiste após recarregar", await ve(page.getByRole("heading", { name: "Ana Navegador Silva" })));
  ok("biografia salva e exibida no perfil", await ve(page.getByText("Engenheira agrônoma apaixonada por hortas urbanas.")));
  const u = (await api(`/usuario/${ana.id}`, ana.token)).body;
  ok("foto salva no servidor e exibida", !!u.urlImagemUsuario && (await page.locator(`img[src*="${u.urlImagemUsuario.split("/").pop()}"]`).count()) > 0, u.urlImagemUsuario);
  ok("telefone salvo", u.telefoneUsuario === "11977776666", u.telefoneUsuario);
  ok("login continua funcionando após editar a conta", (await api("/usuario/login", null, "POST", { emailUsuario: ana.email, senhaUsuario: SENHA })).status === 200);
  const inputCapa = page.locator('input[type=file]').filter({ hasNot: page.locator("[data-testid=input-foto]") });
  await page.locator("section[aria-labelledby=perfil-nome] input[type=file]").first().setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: PNG });
  await page.waitForTimeout(2500);
  await page.reload({ waitUntil: "networkidle" });
  const perfilAna = (await api("/perfil-usuario", ana.token)).body.find((p) => p.usuario?.idUsuario === ana.id);
  ok("capa do perfil enviada e persistida", !!perfilAna?.urlBanner && (await ve(page.getByRole("button", { name: /Trocar capa/ }))), perfilAna?.urlBanner);
  void inputCapa;
  await page.goto(`${BASE}/perfil/${bia.id}`, { waitUntil: "networkidle" });
  ok("perfil de outra pessoa não oferece edição", (await page.getByRole("link", { name: "Editar perfil" }).count()) === 0);

  // ---------------------------------------------------------------- 4. feed, curtidas e comentários
  titulo("Feed, curtidas, comentários e busca");
  await page.goto(BASE + "/feed", { waitUntil: "networkidle" });
  const tituloPost = `Post pela tela ${sufixo}`;
  await page.fill("#post-titulo", tituloPost);
  await page.fill("#post-texto", "Texto publicado pelo teste de navegador");
  await page.getByRole("button", { name: "Publicar" }).click();
  ok("publicar pelo feed", await ve(page.getByRole("heading", { name: tituloPost })));
  const card = page.locator("article", { has: page.getByRole("heading", { name: tituloPost }) });
  await card.getByRole("button", { name: /^Curtir/ }).click();
  ok("curtir atualiza o contador", await ve(card.getByText("1 curtida")));
  await card.getByRole("button", { name: /coment/i }).first().click();
  await card.getByPlaceholder("Escreva um comentário...").fill("Comentário pelo navegador");
  await card.getByRole("button", { name: "Comentar" }).click();
  ok("comentar", await ve(card.getByText("Comentário pelo navegador")));
  await page.reload({ waitUntil: "networkidle" });
  const card2 = page.locator("article", { has: page.getByRole("heading", { name: tituloPost }) });
  ok("curtida e comentário persistem", (await ve(card2.getByText("1 curtida"))) && (await ve(card2.getByText("1 comentário"))));
  await card2.getByRole("button", { name: /^Descurtir/ }).click();
  ok("descurtir", await ve(card2.getByText("0 curtidas")));
  await page.goto(BASE + "/explorar", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Pesquisar pessoas...").fill("Bia Navegador");
  ok("buscar pessoas no Explorar", await ve(page.getByText("Bia Navegador")));
  await page.getByRole("tab", { name: /Projetos/ }).click();
  await page.getByPlaceholder("Pesquisar projetos...").fill(`Horta Vertical ${sufixo}`);
  ok("buscar projetos no Explorar", await ve(page.getByText(`Horta Vertical ${sufixo}`)));

  // ---------------------------------------------------------------- 5. conexões e notificações
  titulo("Conexões e notificações");
  await page.goto(`${BASE}/perfil/${bia.id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Seguir/ }).first().click();
  ok("pedir para seguir", await ve(page.getByRole("button", { name: /Solicitação enviada|Pendente|Aguardando/ })));
  const pageBia = await abrir({ token: bia.token, usuario: authUser(bia) });
  await pageBia.goto(BASE + "/notificacoes", { waitUntil: "networkidle" });
  await pageBia.getByRole("button", { name: "Aceitar" }).first().click();
  ok("aceitar o pedido pela notificação", await ve(pageBia.getByText("Solicitação aceita")));
  await pageBia.getByRole("button", { name: "Marcar todas como lidas" }).click().catch(() => {});
  await page.reload({ waitUntil: "networkidle" });
  ok("quem pediu passa a ver 'Seguindo'", await ve(page.getByRole("button", { name: /Seguindo/ })));
  await pageBia.goto(BASE + "/conexoes?aba=seguidores", { waitUntil: "networkidle" });
  ok("lista de seguidores", await ve(pageBia.getByText("Ana Navegador Silva")));

  // ---------------------------------------------------------------- 6. configurações
  titulo("Configurações");
  await page.goto(BASE + "/configuracoes", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Alterar senha" }).first().click();
  await page.fill("#senhaAtual", SENHA);
  await page.fill("#novaSenha", "Trocada123");
  await page.fill("#confirmarNovaSenha", "Trocada123");
  await page.locator("#painel-senha").getByRole("button", { name: "Alterar senha" }).click();
  await page.waitForTimeout(1500);
  ok("trocar senha pela tela", (await api("/usuario/login", null, "POST", { emailUsuario: ana.email, senhaUsuario: "Trocada123" })).status === 200);

  // ---------------------------------------------------------------- 7. administração
  titulo("Administração");
  const pageAdm = await abrir({ token: adm, usuario: { idUsuario: admLogin.idUsuario, nomeUsuario: admLogin.nomeUsuario, emailUsuario: ADMIN_EMAIL, isActive: true, roles: ["ADMIN"] } });
  await pageAdm.goto(BASE + "/admin/areas", { waitUntil: "networkidle" });
  await pageAdm.getByRole("button", { name: /^Cadastrar/ }).first().click();
  await pageAdm.fill("#crud-nomeArea", `Área navegador ${sufixo}`);
  await pageAdm.fill("#crud-descricaoArea", "Criada pelo teste");
  await pageAdm.getByRole("dialog").getByRole("button", { name: "Cadastrar" }).click();
  ok("admin cadastra área pela tela", await ve(pageAdm.getByText(`Área navegador ${sufixo}`)));
  await pageAdm.goto(BASE + "/admin/termos-postagem", { waitUntil: "networkidle" });
  await pageAdm.getByRole("button", { name: /^Cadastrar/ }).first().click();
  await pageAdm.fill("#crud-titulo", `Regra ${sufixo}`);
  await pageAdm.fill("#crud-descricao", "Respeite as pessoas");
  await pageAdm.getByRole("dialog").getByRole("button", { name: "Cadastrar" }).click();
  ok("admin cadastra termo de postagem (antes o backend bloqueava o admin)", await ve(pageAdm.getByText(`Regra ${sufixo}`)));
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  ok("usuário comum não entra no painel administrativo", !page.url().includes("/admin"), page.url());

  for (const c of contextos) await c.close().catch(() => {});
  await browser.close();

  const reprov = resultados.filter((r) => r.status === "REPROVADO");
  const nt = resultados.filter((r) => r.status === "NÃO TESTADO");
  console.log(`\n${resultados.length - reprov.length - nt.length}/${resultados.length - nt.length} verificações aprovadas · ${reprov.length} reprovadas · ${nt.length} não testadas`);
  if (process.env.RESULTADO_JSON) fs.writeFileSync(process.env.RESULTADO_JSON, JSON.stringify({ paginas, resultados }, null, 1));
  process.exit(reprov.length ? 1 : 0);
})().catch((e) => {
  console.error("ERRO", e.message.split("\n").slice(0, 3).join(" | "));
  process.exit(1);
});
