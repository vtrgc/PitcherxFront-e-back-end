/**
 * Mensagens privadas pela tela (Playwright), com front e backend reais e duas pessoas em
 * navegadores separados.
 *
 *   ADMIN_EMAIL=... ADMIN_SENHA=... MAILS_LOG=/caminho/mails.log node e2e/mensagens_navegador.js
 *
 * Cobre: botão "Enviar mensagem" só com conexão aceita, aviso de conexão pendente, envio e
 * recebimento sem recarregar a página, contador de não lidas, confirmação de leitura, editar e
 * apagar, conexão removida (somente leitura), conversa de terceiros, estado vazio, queda de
 * rede (aviso + reenvio sem duplicar), histórico após novo login e telas no celular.
 * SAIDA_DIR (opcional) recebe as capturas de tela.
 */
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = (process.env.FRONT_URL || "http://localhost:3000").replace(/\/+$/, "");
const API = BASE + "/backend";
const { ADMIN_EMAIL, ADMIN_SENHA, MAILS_LOG } = process.env;
const SAIDA = process.env.SAIDA_DIR || "";
if (!ADMIN_EMAIL || !ADMIN_SENHA) {
  console.error("Defina ADMIN_EMAIL e ADMIN_SENHA.");
  process.exit(2);
}

const resultados = [];
const ok = (nome, cond, info = "") => {
  resultados.push({ nome, aprovado: !!cond });
  console.log(`${cond ? "  ok  " : "  FAIL"} ${nome}${cond ? "" : " -> " + String(info).slice(0, 300)}`);
  return cond;
};
const titulo = (t) => console.log(`\n== ${t}`);
const ve = async (loc, t = 12000) => {
  try {
    await loc.first().waitFor({ timeout: t });
    return true;
  } catch {
    return false;
  }
};
const some = async (loc, t = 12000) => {
  try {
    await loc.first().waitFor({ state: "detached", timeout: t });
    return true;
  } catch {
    return (await loc.count()) === 0;
  }
};

async function api(caminho, token, method = "GET", body) {
  const r = await fetch(API + caminho, {
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

function codigoNoEmail(destinatario) {
  if (!MAILS_LOG || !fs.existsSync(MAILS_LOG)) return null;
  const msgs = fs.readFileSync(MAILS_LOG, "utf8").split("\n=====\n").reverse();
  for (const bruto of msgs) {
    if (!bruto.toLowerCase().includes(destinatario.toLowerCase())) continue;
    const texto = bruto.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const achados = texto.match(/(?<!\d)\d{6}(?!\d)/g);
    if (achados) return achados[achados.length - 1];
  }
  return null;
}

async function print(page, nome, opcoes = {}) {
  if (!SAIDA) return;
  fs.mkdirSync(SAIDA, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SAIDA, `${nome}.png`), ...opcoes });
}

(async () => {
  const sufixo = Date.now().toString(36);
  const SENHA = "Segura123";
  const adm = (await api("/usuario/login", null, "POST", { emailUsuario: ADMIN_EMAIL, senhaUsuario: ADMIN_SENHA })).body?.token;
  if (!adm) throw new Error("login do administrador falhou");

  // Contas reais (cadastro → aprovação → código do e-mail).
  async function conta(nome) {
    const email = `${nome.split(" ")[0].toLowerCase()}.msg.${sufixo}@teste.com`;
    const c = await api("/usuario/cadastro-usuario", null, "POST", { nomeUsuario: nome, emailUsuario: email, senhaUsuario: SENHA });
    await api(`/usuario/admin/analise-identidade/${c.body.idUsuario}`, adm, "POST", { status: "APROVADA" });
    const l = await api("/usuario/login", null, "POST", { emailUsuario: email, senhaUsuario: SENHA });
    const cod = codigoNoEmail(email);
    if (cod) await api("/usuario/verificar-conta", l.body.token, "POST", { codigoVerificacao: cod });
    return { nome, email, id: c.body.idUsuario, token: l.body.token };
  }
  const ana = await conta("Ana Conversa");
  const beto = await conta("Beto Conversa");
  const caio = await conta("Caio Conversa");

  const browser = await chromium.launch();
  const erros = [];
  async function abrir(pessoa, opcoes = { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 }) {
    const ctx = await browser.newContext(opcoes);
    await ctx.addInitScript(
      ([t, u]) => {
        try {
          localStorage.setItem("pitcherx:token", t);
          localStorage.setItem("pitcherx:usuario", JSON.stringify(u));
        } catch {}
      },
      [pessoa.token, { idUsuario: pessoa.id, nomeUsuario: pessoa.nome, emailUsuario: pessoa.email, isActive: true, verificado: true, roles: ["USUARIO"] }]
    );
    const page = await ctx.newPage();
    page.on("pageerror", (e) => erros.push(`${pessoa.nome}: ERRO DE EXECUÇÃO ${e.message}`));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erros.push(`${pessoa.nome}: console ${m.text()}`));
    return page;
  }

  // ------------------------------------------------------------------ conexão obrigatória
  titulo("Perfil: mensagem só com conexão aceita");
  const pa = await abrir(ana);
  await pa.goto(`${BASE}/perfil/${beto.id}`, { waitUntil: "networkidle" });
  await ve(pa.getByRole("button", { name: /^Seguir$/ }));
  ok("sem conexão: perfil não oferece 'Enviar mensagem'", (await pa.getByRole("link", { name: /Enviar mensagem/ }).count()) === 0);
  await pa.getByRole("button", { name: /^Seguir$/ }).first().click();
  ok("pendente: perfil avisa que é preciso aceitar a conexão", await ve(pa.getByText(/As mensagens ficam disponíveis quando Beto Conversa aceitar/)));
  ok("pendente: ainda sem 'Enviar mensagem'", (await pa.getByRole("link", { name: /Enviar mensagem/ }).count()) === 0);
  await print(pa, "01_perfil_pendente");

  const pb = await abrir(beto);
  await pb.goto(`${BASE}/perfil/${ana.id}`, { waitUntil: "networkidle" });
  ok("quem recebeu vê 'Aceite para poder trocar mensagens'", await ve(pb.getByText(/Aceite para poder trocar mensagens/)));
  await pb.getByRole("button", { name: "Aceitar" }).first().click();
  ok("aceitou: o perfil passa a oferecer 'Enviar mensagem'", await ve(pb.getByRole("link", { name: /Enviar mensagem/ })));

  await pa.reload({ waitUntil: "networkidle" });
  ok("do outro lado o botão também aparece", await ve(pa.getByRole("link", { name: /Enviar mensagem/ })));
  await print(pa, "02_perfil_conectado");

  // ------------------------------------------------------------------ envio e recebimento
  titulo("Envio e recebimento sem recarregar a página");
  await pb.goto(`${BASE}/mensagens`, { waitUntil: "networkidle" });
  ok("estado vazio para quem ainda não conversou", await ve(pb.getByText("Nenhuma conversa ainda")));

  await pa.getByRole("link", { name: /Enviar mensagem/ }).first().click();
  await pa.waitForURL(/\/mensagens\?com=/, { timeout: 15000 });
  ok("'Enviar mensagem' abre a conversa nova com a pessoa", await ve(pa.getByText(/Envie a primeira mensagem/)));
  const campoA = pa.getByLabel(/Mensagem para Beto Conversa/);
  await campoA.fill("Oi, Beto! Vi seu projeto e queria conversar.");
  await campoA.press("Enter");
  await pa.waitForURL(/\/mensagens\?conversa=\d+/, { timeout: 15000 });
  const conversaId = Number(new URL(pa.url()).searchParams.get("conversa"));
  ok("primeira mensagem enviada cria a conversa", conversaId > 0, pa.url());
  ok("mensagem enviada aparece no histórico de quem enviou", await ve(pa.getByText("Oi, Beto! Vi seu projeto e queria conversar.")));

  ok("a conversa chega para o outro lado sem recarregar", await ve(pb.getByRole("link", { name: /Ana Conversa/ }), 20000));
  ok("contador de não lidas na lista", await ve(pb.locator("a[href*='conversa=']").filter({ hasText: "Ana Conversa" }).filter({ hasText: "1 não lidas" }), 5000));
  ok("contador de não lidas na navegação", await ve(pb.locator("aside nav a[href='/mensagens']").getByText("1"), 40000));
  await print(pb, "03_lista_com_nao_lida");

  await pb.getByRole("link", { name: /Ana Conversa/ }).first().click();
  ok("o destinatário lê a mensagem", await ve(pb.getByText("Oi, Beto! Vi seu projeto e queria conversar.")));
  ok("abrir a conversa zera o contador", await some(pb.locator("aside nav a[href='/mensagens']").getByText("1", { exact: true }), 15000));
  ok("quem enviou vê 'Vista' depois da leitura", await ve(pa.getByText("Vista"), 15000));

  const campoB = pb.getByLabel(/Mensagem para Ana Conversa/);
  await campoB.fill("Oi, Ana! Claro, vamos conversar.\nPode ser amanhã?");
  await pb.getByRole("button", { name: "Enviar mensagem" }).click();
  ok("a resposta aparece para a Ana sem recarregar", await ve(pa.getByText(/Claro, vamos conversar/), 15000));
  ok("quebra de linha preservada", await ve(pa.getByText(/Pode ser amanhã\?/)));
  ok("mensagens enviadas e recebidas com lados diferentes",
    (await pa.locator(".justify-end").filter({ hasText: "Vi seu projeto" }).count()) > 0 &&
      (await pa.locator(".justify-start").filter({ hasText: "Claro, vamos conversar" }).count()) > 0);
  await print(pa, "04_conversa_ana");
  await print(pb, "05_conversa_beto");

  // ------------------------------------------------------------------ editar e apagar
  titulo("Editar e apagar");
  await pa.locator(".group").filter({ hasText: "Vi seu projeto" }).hover();
  await pa.locator(".group").filter({ hasText: "Vi seu projeto" }).getByRole("button", { name: "Opções da mensagem" }).click();
  await pa.getByRole("menuitem", { name: "Editar" }).click();
  await pa.getByLabel("Editar mensagem").fill("Oi, Beto! Vi seu projeto de energia e queria conversar.");
  await pa.getByRole("button", { name: "Salvar" }).click();
  ok("edição salva e marcada como editada", await ve(pa.getByText(/· editada/)));
  ok("a edição aparece para o Beto sem recarregar", await ve(pb.getByText(/projeto de energia/), 15000));
  await pa.getByLabel(/Mensagem para Beto Conversa/).fill("Mensagem que vou apagar");
  await pa.getByLabel(/Mensagem para Beto Conversa/).press("Enter");
  await ve(pb.getByText("Mensagem que vou apagar"), 15000);
  await pa.locator(".group").filter({ hasText: "Mensagem que vou apagar" }).hover();
  await pa.locator(".group").filter({ hasText: "Mensagem que vou apagar" }).getByRole("button", { name: "Opções da mensagem" }).click();
  await pa.getByRole("menuitem", { name: "Apagar" }).click();
  await pa.getByRole("alertdialog").getByRole("button", { name: "Apagar", exact: true }).click();
  ok("mensagem apagada para quem enviou", await ve(pa.getByText("Mensagem apagada")));
  ok("mensagem apagada também para o Beto, inclusive na prévia da lista",
    (await ve(pb.getByText("Mensagem apagada"), 15000)) && (await some(pb.getByText("Mensagem que vou apagar"), 15000)));

  // ------------------------------------------------------------------ queda de rede
  titulo("Falha de conexão");
  await pa.route("**/backend/mensagem/**", (r) => r.abort());
  await pa.route("**/backend/mensagem", (r) => r.abort());
  ok("aviso de sem conexão durante a queda", await ve(pa.getByText(/Sem conexão com o servidor/), 15000));
  await pa.getByLabel(/Mensagem para Beto Conversa/).fill("Enviada durante a queda");
  await pa.getByLabel(/Mensagem para Beto Conversa/).press("Enter");
  ok("envio sem rede fica marcado como não enviado", await ve(pa.getByText(/Não enviada/)));
  await pa.unroute("**/backend/mensagem/**");
  await pa.unroute("**/backend/mensagem");
  await pa.getByRole("button", { name: /Tentar de novo/ }).click();
  ok("reenvio depois que a rede volta", await some(pa.getByText(/Não enviada/), 15000));
  await ve(pb.getByText("Enviada durante a queda"), 15000);
  const hist = await api(`/mensagem/conversas/${conversaId}/mensagens`, beto.token);
  const repetidas = (hist.body?.mensagens ?? []).filter((m) => m.conteudo === "Enviada durante a queda").length;
  ok("o reenvio não duplica a mensagem no servidor", repetidas === 1, repetidas);
  ok("o aviso de sem conexão some quando a rede volta", await some(pa.getByText(/Sem conexão com o servidor/), 15000));

  // ------------------------------------------------------------------ terceiros e estado vazio
  titulo("Privacidade e estado vazio");
  const pc = await abrir(caio);
  await pc.goto(`${BASE}/mensagens?conversa=${conversaId}`, { waitUntil: "networkidle" });
  ok("terceiro não abre a conversa dos outros", await ve(pc.getByText("Você não tem acesso a esta conversa.")));
  ok("e não vê nenhuma mensagem dela", (await pc.getByText(/Vi seu projeto/).count()) === 0);
  await pc.goto(`${BASE}/mensagens`, { waitUntil: "networkidle" });
  await pc.getByRole("button", { name: "Nova mensagem" }).first().click();
  ok("sem conexões: 'Nova mensagem' explica que é preciso ter conexão aceita", await ve(pc.getByText("Você ainda não tem conexões aceitas")));
  await print(pc, "06_nova_mensagem_sem_conexoes");
  await pc.keyboard.press("Escape");
  await pc.goto(`${BASE}/mensagens?com=${ana.id}`, { waitUntil: "networkidle" });
  ok("abrir conversa com quem não é conexão mostra o bloqueio, sem campo de envio",
    (await ve(pc.getByText(/não estão conectados/))) && (await pc.getByLabel(/Mensagem para Ana Conversa/).count()) === 0);

  // ------------------------------------------------------------------ celular
  titulo("Celular");
  const pm = await abrir(beto, { ...devices["iPhone 13"] });
  await pm.goto(`${BASE}/mensagens`, { waitUntil: "networkidle" });
  ok("celular: lista de conversas", await ve(pm.getByRole("link", { name: /Ana Conversa/ })));
  await print(pm, "07_celular_lista");
  await pm.getByRole("link", { name: /Ana Conversa/ }).first().click();
  ok("celular: conversa em tela cheia com botão voltar", (await ve(pm.getByRole("button", { name: "Voltar para as conversas" }))) && (await ve(pm.getByText(/projeto de energia/))));
  const largura = await pm.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok("celular: sem rolagem horizontal", largura[0] <= largura[1], largura);
  await pm.getByLabel(/Mensagem para Ana Conversa/).fill("Respondendo pelo celular");
  await pm.getByRole("button", { name: "Enviar mensagem" }).click();
  ok("celular: envio", await ve(pm.getByText("Respondendo pelo celular")));
  ok("a mensagem do celular chega no computador da Ana", await ve(pa.getByText("Respondendo pelo celular"), 15000));
  await print(pm, "08_celular_conversa");
  await pm.getByRole("button", { name: "Voltar para as conversas" }).click();
  ok("celular: voltar para a lista", await ve(pm.getByRole("link", { name: /Ana Conversa/ })));

  // ------------------------------------------------------------------ conexão removida
  titulo("Conexão removida");
  await pa.goto(`${BASE}/perfil/${beto.id}`, { waitUntil: "networkidle" });
  await pa.getByRole("button", { name: /Seguindo/ }).first().click();
  await pa.getByRole("menuitem", { name: /Parar de seguir/ }).click();
  const dialogo = pa.getByRole("alertdialog");
  if (await ve(dialogo, 3000)) await dialogo.getByRole("button").last().click();
  ok("conexão desfeita pelo perfil", await ve(pa.getByRole("button", { name: /^Seguir$/ }), 15000));
  ok("sem conexão, o perfil deixa de oferecer 'Enviar mensagem'", (await pa.getByRole("link", { name: /Enviar mensagem/ }).count()) === 0);
  await pa.goto(`${BASE}/mensagens?conversa=${conversaId}`, { waitUntil: "networkidle" });
  ok("histórico antigo continua visível", await ve(pa.getByText(/projeto de energia/)));
  ok("mas a conversa fica somente leitura", (await ve(pa.getByText(/não estão conectados/))) && (await pa.getByLabel(/Mensagem para Beto Conversa/).count()) === 0);
  ok("o outro lado também passa a somente leitura sem recarregar", await some(pb.getByLabel(/Mensagem para Ana Conversa/), 20000));
  const tentativa = await api("/mensagem", beto.token, "POST", { destinatarioId: ana.id, conteudo: "burlando pela API", chaveCliente: "x" + sufixo });
  ok("e nem uma requisição direta à API consegue enviar", tentativa.status === 403, tentativa.status);
  await print(pa, "09_somente_leitura");

  // ------------------------------------------------------------------ histórico após novo login
  titulo("Histórico após sair e entrar");
  const pl = await browser.newContext({ viewport: { width: 1366, height: 900 } }).then((c) => c.newPage());
  await pl.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  await pl.fill("input[name=email]", ana.email);
  await pl.fill("input[type=password]", SENHA);
  await pl.click("button[type=submit]");
  await pl.waitForURL((u) => !u.pathname.startsWith("/auth/login"), { timeout: 15000 }).catch(() => {});
  await pl.goto(`${BASE}/mensagens`, { waitUntil: "networkidle" });
  await pl.getByRole("link", { name: /Beto Conversa/ }).first().click();
  ok("depois de um novo login, a conversa e o histórico continuam lá",
    (await ve(pl.getByText(/projeto de energia/))) && (await ve(pl.getByText("Respondendo pelo celular"))));

  titulo("Erros no navegador");
  ok("nenhum erro de execução ou de console nas telas", erros.length === 0, erros.join(" | "));

  await browser.close();
  const reprovadas = resultados.filter((r) => !r.aprovado).length;
  console.log(`\n${resultados.length - reprovadas}/${resultados.length} verificações aprovadas · ${reprovadas} reprovadas`);
  process.exit(reprovadas ? 1 : 0);
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
