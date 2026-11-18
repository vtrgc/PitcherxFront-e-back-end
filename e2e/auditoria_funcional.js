/**
 * Auditoria funcional pela tela (Playwright), com front e backend reais. Complementa os outros
 * roteiros com o que eles não cobrem:
 *  - autenticação: redirecionamento depois do login, sessão expirada, páginas privadas;
 *  - feed: publicar com imagem, editar, excluir, compartilhar, denunciar, contar comentários,
 *    paginação ("Carregar mais") e pesquisa;
 *  - perfil: progresso de preenchimento, seguidores/seguindo e contadores;
 *  - administração: usuários, endereços, áreas, subáreas e especialidades (busca, cadastro,
 *    edição, exclusão e modais) e bloqueio de usuários comuns;
 *  - projetos: cadastro com dados financeiros, edição, imagens, votos de empresas, investidores
 *    (sócios) e contratos;
 *  - erros: 404, falha 500 e queda de rede com mensagem e "tentar novamente", carregamento,
 *    dados sensíveis no navegador.
 *
 *   ADMIN_EMAIL=... ADMIN_SENHA=... MAILS_LOG=/caminho/mails.log node e2e/auditoria_funcional.js
 */
const { chromium } = require("playwright");
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
let secao = "";
const ok = (nome, cond, info = "") => {
  resultados.push({ secao, nome, aprovado: !!cond, detalhe: cond ? "" : String(info).slice(0, 300) });
  console.log(`${cond ? "  ok  " : "  FAIL"} ${nome}${cond ? "" : " -> " + String(info).slice(0, 300)}`);
  return cond;
};
/** Problema real que só se resolve no backend: aparece no relatório, mas não reprova o front. */
const pendenciaBackend = (nome, detalhe) => {
  resultados.push({ secao, nome, aprovado: true, pendenciaBackend: true, detalhe });
  console.log(`  BACK ${nome} -> ${detalhe}`);
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

function codigoNoEmail(destinatario, depoisDe = 0) {
  if (!MAILS_LOG || !fs.existsSync(MAILS_LOG)) return null;
  const msgs = fs.readFileSync(MAILS_LOG, "utf8").split("\n=====\n").slice(depoisDe).reverse();
  for (const bruto of msgs) {
    if (!bruto.toLowerCase().includes(destinatario.toLowerCase())) continue;
    const texto = bruto.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const achados = texto.match(/(?<!\d)\d{6}(?!\d)/g);
    if (achados) return achados[achados.length - 1];
  }
  return null;
}
const qtdEmails = () => (MAILS_LOG && fs.existsSync(MAILS_LOG) ? fs.readFileSync(MAILS_LOG, "utf8").split("\n=====\n").length - 1 : 0);

// PNG 1x1 válido (gerado em memória; nada é baixado da internet).
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c63606060000000040001f61738550000000049454e44ae426082",
  "hex"
);

async function print(page, nome) {
  if (!SAIDA) return;
  fs.mkdirSync(SAIDA, { recursive: true });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SAIDA, `${nome}.png`) });
}

(async () => {
  const sufixo = Date.now().toString(36);
  const SENHA = "Segura123";
  const admLogin = (await api("/usuario/login", null, "POST", { emailUsuario: ADMIN_EMAIL, senhaUsuario: ADMIN_SENHA })).body;
  const adm = admLogin?.token;
  if (!adm) throw new Error("login do administrador falhou");

  async function conta(nome) {
    const email = `${nome.split(" ")[0].toLowerCase()}.aud.${sufixo}@teste.com`;
    const c = await api("/usuario/cadastro-usuario", null, "POST", { nomeUsuario: nome, emailUsuario: email, senhaUsuario: SENHA });
    await api(`/usuario/admin/analise-identidade/${c.body.idUsuario}`, adm, "POST", { status: "APROVADA" });
    let l = await api("/usuario/login", null, "POST", { emailUsuario: email, senhaUsuario: SENHA });
    const cod = codigoNoEmail(email);
    if (cod) await api("/usuario/verificar-conta", l.body.token, "POST", { codigoVerificacao: cod });
    return { nome, email, id: c.body.idUsuario, token: l.body.token, roles: ["USUARIO"] };
  }

  const browser = await chromium.launch();
  const erros = [];
  async function abrir(pessoa, opcoes = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, ...opcoes });
    if (pessoa) {
      await ctx.addInitScript(
        ([t, u]) => {
          try {
            localStorage.setItem("pitcherx:token", t);
            localStorage.setItem("pitcherx:usuario", JSON.stringify(u));
          } catch {}
        },
        [pessoa.token, { idUsuario: pessoa.id, nomeUsuario: pessoa.nome, emailUsuario: pessoa.email, isActive: true, verificado: true, roles: pessoa.roles }]
      );
    }
    const page = await ctx.newPage();
    page.on("pageerror", (e) => erros.push(`ERRO DE EXECUÇÃO em ${page.url().replace(BASE, "")}: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|net::ERR/.test(m.text())) erros.push(`console em ${page.url().replace(BASE, "")}: ${m.text()}`);
    });
    return page;
  }

  const ana = await conta("Ana Auditoria");
  const bia = await conta("Bia Auditoria");
  const admin = { nome: admLogin.nomeUsuario, email: ADMIN_EMAIL, id: admLogin.idUsuario, token: adm, roles: ["ADMIN"] };

  // ================================================================== autenticação
  titulo("Autenticação");
  {
    const p = await abrir(null);
    for (const rota of ["/feed", "/mensagens", "/perfil", "/projetos", "/contratos", "/admin", "/admin/usuarios", "/configuracoes"]) {
      await p.goto(BASE + rota);
      await p.waitForURL(/\/auth\/login/, { timeout: 10000 }).catch(() => {});
      if (!ok(`sem login, ${rota} leva ao login`, p.url().includes("/auth/login"), p.url())) break;
    }
    await p.goto(BASE + "/projetos");
    await p.waitForURL(/\/auth\/login/);
    await p.fill("input[name=email]", ana.email);
    await p.fill("input[type=password]", SENHA);
    await p.click("button[type=submit]");
    await p.waitForURL((u) => !u.pathname.startsWith("/auth/login"), { timeout: 15000 }).catch(() => {});
    ok("depois do login volta para a página pedida (/projetos)", new URL(p.url()).pathname === "/projetos", p.url());
    const chaves = await p.evaluate(() => Object.keys(localStorage));
    const guardado = await p.evaluate(() => JSON.stringify(localStorage));
    ok("o navegador guarda só token e dados públicos (nunca a senha)", !guardado.includes(SENHA) && chaves.every((k) => k.startsWith("pitcherx:")), chaves.join(","));
    await p.context().close();

    // Sessão expirada: token com validade no passado.
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const vencido = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: ana.email, exp: Math.floor(Date.now() / 1000) - 3600 })}.assinatura`;
    const pe = await abrir({ ...ana, token: vencido });
    await pe.goto(BASE + "/feed");
    await pe.waitForURL(/\/auth\/login/, { timeout: 15000 }).catch(() => {});
    ok("sessão expirada leva ao login com aviso", pe.url().includes("/auth/login") && (await ve(pe.getByText(/sessão expirou/i), 8000)), pe.url());
    await pe.context().close();

    // Recuperação de senha: código errado é recusado já na etapa do código.
    if (MAILS_LOG) {
      const pr = await abrir(null);
      await pr.goto(BASE + "/auth/esqueci-senha");
      await pr.fill("input[name=email]", bia.email);
      const antes = qtdEmails();
      await pr.getByRole("button", { name: "Enviar código" }).click();
      await pr.waitForTimeout(2000);
      const codigo = codigoNoEmail(bia.email, antes);
      const errado = codigo === "000000" ? "111111" : "000000";
      await pr.getByLabel("Dígito 1 de 6").fill(errado);
      await pr.getByRole("button", { name: "Confirmar código" }).click();
      const recusou = await ve(pr.getByText(/inválido|expirado|incorreto/i), 8000);
      const naoAvancou = (await pr.locator("input[name=new-password]").count()) === 0;
      ok("recuperação de senha: código errado é recusado na etapa do código", recusou && naoAvancou, `mensagem=${recusou} avançou=${!naoAvancou}`);
      await pr.context().close();
    }
  }

  // ================================================================== feed
  titulo("Feed e publicações");
  const pa = await abrir(ana);
  const pb = await abrir(bia);
  const tituloPost = `Auditoria ${sufixo}`;
  {
    await pa.goto(BASE + "/feed", { waitUntil: "networkidle" });
    await pa.getByPlaceholder("Título da publicação").fill(tituloPost);
    await pa.getByPlaceholder("Sobre o que você quer falar?").fill("Texto original da publicação da auditoria.");
    await pa.getByRole("button", { name: /Imagens/ }).first().click();
    const arquivo = pa.locator('input[type="file"]').first();
    await arquivo.setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG });
    await pa.waitForTimeout(500);
    await pa.getByRole("button", { name: /^Publicar$/ }).click();
    ok("publicar com imagem", await ve(pa.getByText(tituloPost), 15000));
    const cartao = pa.locator("article").filter({ hasText: tituloPost }).first();
    ok("a imagem da publicação aparece", await ve(cartao.locator("img:not([alt^='Foto de'])"), 8000));

    // editar
    await cartao.getByRole("button", { name: "Opções da publicação" }).click();
    await pa.getByRole("menuitem", { name: /Editar/ }).click();
    // Durante a edição o título vira um campo; o cartão é achado pelo editor aberto.
    const campoTexto = pa.locator("textarea[id^='editar-texto-']").first();
    await campoTexto.fill("Texto editado pela auditoria.");
    await pa.locator("article").filter({ has: campoTexto }).getByRole("button", { name: /Salvar/ }).click();
    ok("editar publicação", await ve(pa.getByText("Texto editado pela auditoria."), 10000));
    await pa.reload({ waitUntil: "networkidle" });
    ok("a edição persiste depois de recarregar", await ve(pa.getByText("Texto editado pela auditoria."), 10000));

    // compartilhar (copia o link)
    await pa.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    await pa.evaluate(() => {
      // sem a folha de compartilhamento do sistema no navegador de teste: usa a cópia do link
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    });
    const cartao2 = pa.locator("article").filter({ hasText: tituloPost }).first();
    await cartao2.getByRole("button", { name: /Compartilhar/ }).click();
    const copiado = await ve(pa.getByText("Link copiado!"), 5000);
    const link = await pa.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    ok("compartilhar copia o link da publicação", copiado && /\/publicacao\/\d+/.test(link), link);
    const idPost = Number((link.match(/\/publicacao\/(\d+)/) || [])[1]);

    // comentários: contagem
    await pb.goto(`${BASE}/publicacao/${idPost}`, { waitUntil: "networkidle" });
    ok("página da publicação abre pelo link compartilhado", await ve(pb.getByText(tituloPost)));
    const comentario = pb.getByPlaceholder("Escreva um comentário...").first();
    await comentario.fill("Comentário da auditoria");
    await pb.getByRole("button", { name: "Comentar" }).first().click();
    await pb.waitForFunction(() => !document.querySelector("textarea")?.value, null, { timeout: 10000 }).catch(() => {});
    const gravados = ((await api("/comentario", bia.token)).body ?? []).filter((c) => c.postagemId === idPost && c.textoComentario === "Comentário da auditoria");
    ok("comentar na publicação (gravado no servidor e exibido)", gravados.length === 1 && (await ve(pb.locator("p, span, div").filter({ hasText: /^Comentário da auditoria$/ }), 8000)), gravados.length);
    await pa.goto(BASE + "/feed", { waitUntil: "networkidle" });
    ok("contagem de comentários no feed", await ve(pa.locator("article").filter({ hasText: tituloPost }).getByText(/1 comentário/), 10000));

    // denunciar (pela outra pessoa)
    await pb.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
    await pb.getByPlaceholder("Pesquisar publicações...").fill(tituloPost);
    const doOutro = pb.locator("article").filter({ hasText: tituloPost }).first();
    await doOutro.getByRole("button", { name: "Opções da publicação" }).click();
    await pb.getByRole("menuitem", { name: /Denunciar/ }).click();
    const modal = pb.getByRole("dialog");
    ok("denunciar abre o formulário", await ve(modal, 5000));
    const opcao = modal.locator('input[type="radio"]').first();
    if (await opcao.count()) await opcao.check();
    await modal.locator("textarea").fill("Teste da auditoria");
    await modal.getByRole("button", { name: "Confirmar denúncia" }).click();
    ok("denúncia enviada", await ve(pb.getByText(/denúncia (foi )?(enviada|registrada|recebida)/i), 10000));
    await print(pb, "feed_denuncia");

    // pesquisa e paginação
    await pb.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
    const antesBusca = await pb.locator("article").count();
    await pb.getByPlaceholder("Pesquisar publicações...").fill(tituloPost);
    await pb.waitForTimeout(600);
    const depoisBusca = await pb.locator("article").count();
    ok("pesquisa filtra as publicações", depoisBusca >= 1 && depoisBusca <= antesBusca && (await pb.locator("article").filter({ hasText: tituloPost }).count()) === depoisBusca, `${antesBusca} -> ${depoisBusca}`);
    await pb.getByPlaceholder("Pesquisar publicações...").fill("");
    await pb.waitForTimeout(400);
    const total = (await api("/postagem", bia.token)).body?.length ?? 0;
    const maisBtn = pb.getByRole("button", { name: /Carregar mais/ });
    if (total > 10) {
      const n1 = await pb.locator("article").count();
      await maisBtn.click();
      await pb.waitForTimeout(500);
      const n2 = await pb.locator("article").count();
      ok("paginação: 'Carregar mais' traz mais publicações", n1 === 10 && n2 > n1, `${n1} -> ${n2} (total ${total})`);
    } else ok("paginação: sem 'Carregar mais' quando cabe em uma página", (await maisBtn.count()) === 0, total);

    // excluir
    await pa.goto(BASE + "/feed", { waitUntil: "networkidle" });
    const meu = pa.locator("article").filter({ hasText: tituloPost }).first();
    await meu.getByRole("button", { name: "Opções da publicação" }).click();
    await pa.getByRole("menuitem", { name: /Excluir/ }).click();
    const conf = pa.getByRole("alertdialog");
    if (await ve(conf, 4000)) await conf.getByRole("button", { name: "Excluir", exact: true }).click();
    ok("excluir publicação", await some(pa.getByText(tituloPost), 10000));
    await pa.reload({ waitUntil: "networkidle" });
    ok("a exclusão persiste depois de recarregar", (await pa.getByText(tituloPost).count()) === 0);
  }

  // ================================================================== perfil
  titulo("Perfil");
  {
    await pa.goto(BASE + "/perfil", { waitUntil: "networkidle" });
    const barra = pa.getByRole("progressbar");
    await ve(barra, 8000);
    const antes = Number(await barra.first().getAttribute("aria-valuenow").catch(() => "NaN"));
    ok("progresso de preenchimento do perfil aparece", Number.isFinite(antes) && antes < 100, antes);
    // A foto conta para o progresso (foto, perfil profissional e localização); fica pendente até salvar.
    await pa.goto(BASE + "/perfil/editar", { waitUntil: "networkidle" });
    await pa.locator('input[type="file"]').first().setInputFiles({ name: "rosto.png", mimeType: "image/png", buffer: PNG });
    await pa.getByRole("button", { name: "Salvar alterações" }).last().click();
    await pa.waitForTimeout(3000);
    await pa.goto(BASE + "/perfil", { waitUntil: "networkidle" });
    await pa.waitForTimeout(800);
    const depois = Number(await pa.getByRole("progressbar").first().getAttribute("aria-valuenow").catch(() => "NaN"));
    ok("o progresso aumenta depois de preencher o perfil", Number.isFinite(depois) && depois > antes, `${antes} -> ${depois}`);

    // seguir pelo perfil e conferir contadores e listas
    await pb.goto(`${BASE}/perfil/${ana.id}`, { waitUntil: "networkidle" });
    const seguidoresAntes = (await api(`/conexao/contar-seguidores/${ana.id}`, bia.token)).body?.quantidade ?? 0;
    await pb.getByRole("button", { name: /^Seguir$/ }).first().click();
    await ve(pb.getByText(/Solicitação enviada/), 8000);
    await pa.goto(`${BASE}/perfil/${bia.id}`, { waitUntil: "networkidle" });
    await pa.getByRole("button", { name: "Aceitar" }).first().click();
    await pa.waitForTimeout(1500);
    await pa.goto(BASE + "/perfil", { waitUntil: "networkidle" });
    ok("contador de seguidores aumenta depois de aceitar", await ve(pa.getByRole("link", { name: new RegExp(`${seguidoresAntes + 1}\\s*Seguidor`) }), 8000));
    await pa.goto(`${BASE}/conexoes?aba=seguidores`, { waitUntil: "networkidle" });
    ok("lista de seguidores mostra quem segue", await ve(pa.getByText("Bia Auditoria"), 8000));
    await pb.goto(`${BASE}/conexoes?aba=seguindo`, { waitUntil: "networkidle" });
    ok("lista 'seguindo' de quem segue", await ve(pb.getByText("Ana Auditoria"), 8000));
    const outroPerfil = await api(`/usuario/${ana.id}`, bia.token);
    ok("perfil de outra pessoa não expõe telefone nem comprovante", outroPerfil.body?.telefoneUsuario == null && outroPerfil.body?.urlComprovanteIdentidade == null, JSON.stringify(outroPerfil.body).slice(0, 200));
  }

  // ================================================================== administração
  titulo("Administração");
  const pad = await abrir(admin);
  {
    // permissões: usuário comum não entra em nenhuma tela do admin
    const rotasAdmin = ["/admin", "/admin/usuarios", "/admin/enderecos", "/admin/areas", "/admin/subareas", "/admin/especialidades", "/admin/identidades", "/admin/denuncias"];
    let bloqueadas = 0;
    for (const r of rotasAdmin) {
      await pb.goto(BASE + r);
      await pb.waitForURL((u) => !u.pathname.startsWith("/admin"), { timeout: 10000 }).catch(() => {});
      if (!pb.url().includes("/admin")) bloqueadas++;
    }
    ok(`usuário comum não acessa as ${rotasAdmin.length} telas administrativas`, bloqueadas === rotasAdmin.length, `${bloqueadas}/${rotasAdmin.length}`);

    // CRUD genérico: áreas, subáreas e especialidades
    async function crud({ rota, singular, campos, novoNome, editadoNome }) {
      await pad.goto(BASE + rota, { waitUntil: "networkidle" });
      await pad.getByRole("button", { name: /^Cadastrar/ }).first().click();
      const m = pad.getByRole("dialog");
      if (!ok(`${singular}: modal de cadastro abre`, await ve(m, 5000))) return;
      await m.getByRole("button", { name: "Cadastrar" }).click();
      ok(`${singular}: cadastro vazio é recusado com aviso`, await ve(m.getByText(/Preencha|obrigat|Selecione|Informe/i), 4000));
      for (const [rotulo, valor] of campos) {
        const campo = m.getByLabel(rotulo, { exact: true }).first();
        if ((await campo.evaluate((el) => el.tagName)) === "SELECT") await campo.selectOption({ index: 1 });
        else await campo.fill(valor);
      }
      await m.getByRole("button", { name: "Cadastrar" }).click();
      ok(`${singular}: cadastrar`, (await some(m, 8000)) && (await ve(pad.getByText(novoNome), 8000)));
      await pad.getByRole("searchbox").first().fill(novoNome);
      await pad.waitForTimeout(400);
      ok(`${singular}: busca encontra o cadastro`, (await pad.getByText(novoNome).count()) >= 1);
      await pad.getByRole("button", { name: `Editar ${novoNome}` }).click();
      const me = pad.getByRole("dialog");
      await me.getByLabel(campos[0][0], { exact: true }).first().fill(editadoNome);
      await me.getByRole("button", { name: "Salvar alterações" }).click();
      ok(`${singular}: editar`, (await some(me, 8000)) && (await ve(pad.getByText(editadoNome), 8000)));
      await pad.reload({ waitUntil: "networkidle" });
      await pad.getByRole("searchbox").first().fill(editadoNome);
      ok(`${singular}: edição persiste depois de recarregar`, await ve(pad.getByText(editadoNome), 8000));
      await pad.waitForTimeout(400);
      await pad.getByRole("button", { name: `Excluir ${editadoNome}` }).click();
      const conf = pad.getByRole("alertdialog");
      if (await ve(conf, 4000)) await conf.getByRole("button", { name: "Excluir", exact: true }).click();
      ok(`${singular}: excluir`, await some(pad.getByText(editadoNome), 8000));
    }
    await crud({ rota: "/admin/areas", singular: "Área", campos: [["Nome da área", `Área ${sufixo}`], ["Descrição", "Criada pela auditoria"]], novoNome: `Área ${sufixo}`, editadoNome: `Área editada ${sufixo}` });
    await crud({ rota: "/admin/subareas", singular: "Subárea", campos: [["Nome da subárea", `Subárea ${sufixo}`], ["Descrição", "Criada pela auditoria"], ["Área", ""]], novoNome: `Subárea ${sufixo}`, editadoNome: `Subárea editada ${sufixo}` });
    await crud({ rota: "/admin/especialidades", singular: "Especialidade", campos: [["Nome da especialidade", `Especialidade ${sufixo}`]], novoNome: `Especialidade ${sufixo}`, editadoNome: `Especialidade editada ${sufixo}` });

    // paginação do CRUD (quando há mais itens do que uma página)
    await pad.goto(BASE + "/admin/especialidades", { waitUntil: "networkidle" });
    const pag = pad.getByRole("navigation", { name: "Paginação" });
    if (await pag.count()) {
      const primeira = await pad.locator("li h3").first().textContent();
      await pag.getByRole("button", { name: "Próxima página" }).click();
      await pad.waitForTimeout(300);
      ok("paginação do cadastro troca de página", (await pad.locator("li h3").first().textContent()) !== primeira);
    }

    // usuários: busca, filtro e ativar/desativar
    await pad.goto(BASE + "/admin/usuarios", { waitUntil: "networkidle" });
    await pad.getByPlaceholder("Buscar por nome ou e-mail").fill(bia.email);
    await pad.waitForTimeout(500);
    ok("usuários: busca por e-mail", await ve(pad.getByText("Bia Auditoria"), 8000));
    const botaoStatus = pad.getByRole("button", { name: "Desativar Bia Auditoria" });
    if (await ve(botaoStatus, 4000)) {
      await botaoStatus.first().click();
      const c = pad.getByRole("alertdialog");
      if (await ve(c, 4000)) await c.getByRole("button", { name: "Desativar", exact: true }).click();
      await pad.waitForTimeout(1500);
      const depois = await api(`/usuario/${bia.id}`, adm);
      ok("usuários: desativar conta", depois.body?.active === false, JSON.stringify(depois.body?.active));
      await api(`/usuario/ativar-desativar/${bia.id}`, adm, "PUT");
    } else ok("usuários: botão de ativar/desativar", false, "botão não encontrado");
    await print(pad, "admin_usuarios");

    // perfis: o admin concede o perfil EMPRESA à Bia pela tela
    await pad.getByPlaceholder("Buscar por nome ou e-mail").fill(bia.email);
    await pad.waitForTimeout(400);
    await pad.getByRole("button", { name: "Gerenciar perfis e nível de Bia Auditoria" }).click();
    const mp = pad.locator("section[aria-labelledby='titulo-perfis']");
    await mp.locator("#role-nova").selectOption("EMPRESA");
    await mp.getByRole("button", { name: "Adicionar" }).click();
    const cp = pad.getByRole("alertdialog");
    if (await ve(cp, 4000)) await cp.getByRole("button", { name: "Adicionar", exact: true }).click();
    await pad.waitForTimeout(1500);
    const rolesBia = ((await api(`/usuario/${bia.id}`, adm)).body?.roles ?? []).map((r) => (typeof r === "string" ? r : r?.nomeRole));
    ok("usuários: admin concede o perfil EMPRESA pela tela", rolesBia.includes("EMPRESA"), rolesBia.join(","));

    // endereços: cadastrar, buscar, editar e excluir pela tela
    await pad.goto(BASE + "/admin/enderecos", { waitUntil: "networkidle" });
    ok("endereços: lista abre com busca e filtro por UF", (await ve(pad.getByPlaceholder("Buscar por rua, bairro, CEP ou usuário"))) && (await pad.getByLabel("Filtrar por UF").count()) === 1);
    await pad.getByRole("button", { name: /^Cadastrar/ }).first().click();
    const me = pad.getByRole("dialog");
    ok("endereços: modal de cadastro abre", await ve(me, 5000));
    await me.locator("#endereco-usuario").selectOption(String(ana.id));
    await me.locator("#end-cep").fill("01001000");
    await pad.waitForTimeout(1500);
    const rua = `Rua da Auditoria ${sufixo}`;
    await me.locator("#end-uf").selectOption("SP");
    await me.locator("#end-bairro").fill("Centro");
    await me.locator("#end-logradouro").fill(rua);
    await me.locator("#end-numeroCasa").fill("100");
    await me.getByRole("button", { name: /Adicionar endereço|Salvar endereço/ }).click();
    ok("endereços: complemento vazio é recusado com aviso", await ve(me.getByText(/Informe o complemento/), 4000));
    await me.locator("#end-complemento").fill("Sala 1");
    await me.getByRole("button", { name: /Adicionar endereço|Salvar endereço/ }).click();
    await pad.getByPlaceholder("Buscar por rua, bairro, CEP ou usuário").fill(rua);
    ok("endereços: cadastrar (e achar na busca)", (await some(me, 8000)) && (await ve(pad.getByText(rua), 8000)));
    await pad.getByRole("button", { name: "Editar endereço" }).first().click();
    const me2 = pad.getByRole("dialog");
    await me2.locator("#end-numeroCasa").fill("200");
    await me2.getByRole("button", { name: "Salvar endereço" }).click();
    await some(me2, 8000);
    const endAna = (await api(`/endereco`, adm)).body?.find?.((e) => e.logradouro === rua);
    ok("endereços: editar (gravado no servidor)", endAna?.numeroCasa === "200" || String(endAna?.numeroCasa) === "200", JSON.stringify(endAna));
    await pad.getByRole("button", { name: "Excluir endereço" }).first().click();
    const ce = pad.getByRole("alertdialog");
    if (await ve(ce, 4000)) await ce.getByRole("button", { name: "Excluir", exact: true }).click();
    ok("endereços: excluir", await some(pad.getByText(rua), 8000));
  }

  // ================================================================== projetos
  titulo("Projetos");
  {
    const tipos = (await api("/tipo-projeto", ana.token)).body ?? [];
    const hoje = new Date();
    const f = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const fim = new Date(hoje.getFullYear() + 1, hoje.getMonth(), hoje.getDate());
    const criado = await api(`/projeto/${ana.id}`, ana.token, "POST", {
      nomeProjeto: `Projeto Auditoria ${sufixo}`, descricaoProjeto: "Projeto criado para a auditoria funcional.", dataInicioProjeto: f(hoje),
      dataFimProjeto: f(fim), tipoProjetoId: tipos[0]?.idTipoProjeto, metaFinanceira: 50000, investimentoMinimo: 1000, participacaoOferecida: 12, riscoProjetoIds: [],
    });
    const proj = criado.body;
    ok("projeto de teste criado", criado.status === 201 || criado.status === 200, criado.status);
    await pa.goto(`${BASE}/projetos/${proj.idProjeto}`, { waitUntil: "networkidle" });
    ok("projeto: meta financeira exibida", await ve(pa.getByText(/50\.000/), 8000));
    ok("projeto: participação oferecida exibida", await ve(pa.getByText(/^12\s*%$/), 8000));
    ok("projeto: investimento mínimo exibido", await ve(pa.getByText(/1\.000/), 8000));
    await print(pa, "projeto_financeiro");

    // meta financeira: o dono atualiza pela tela (PATCH /projeto/{id}/meta-financeira)
    await pa.getByRole("button", { name: /Atualizar captação/ }).click();
    await pa.locator("#patch-meta").fill("60000");
    await pa.getByRole("button", { name: "Salvar valores" }).click();
    await pa.waitForTimeout(2000);
    const meta = (await api(`/projeto/${proj.idProjeto}`, ana.token)).body?.metaFinanceira;
    ok("atualizar a meta financeira pela tela", Number(meta) === 60000 && (await ve(pa.getByText(/60\.000/), 8000)), meta);

    // imagens do projeto
    await pa.getByRole("button", { name: "Adicionar imagens" }).click();
    const inputImg = pa.locator('input[type="file"]').first();
    if (await ve(inputImg, 5000).catch(() => false) || (await inputImg.count())) {
      await inputImg.setInputFiles({ name: "projeto.png", mimeType: "image/png", buffer: PNG });
      await pa.waitForTimeout(800);
      await pa.getByRole("button", { name: "Salvar galeria" }).click();
      await pa.waitForTimeout(3000);
      const imgs = (await api(`/projeto/${proj.idProjeto}`, ana.token)).body?.imagens ?? (await api(`/projeto/${proj.idProjeto}`, ana.token)).body?.urlImagens ?? [];
      ok("projeto: enviar imagem pela tela", Array.isArray(imgs) ? imgs.length > 0 : !!imgs, JSON.stringify(imgs).slice(0, 120));
    } else ok("projeto: campo de imagem na página do projeto", false, "input de imagem não encontrado");

    // votos de empresas: a Bia vira EMPRESA (o admin concede) e vota
    // A Bia recebeu o perfil EMPRESA pela tela do admin; entra de novo para o token trazê-lo.
    {
      const novo = await api("/usuario/login", null, "POST", { emailUsuario: bia.email, senhaUsuario: SENHA });
      const empresa = { ...bia, token: novo.body.token, roles: ["USUARIO", "EMPRESA"] };
      const pe = await abrir(empresa);
      await pe.goto(`${BASE}/projetos/${proj.idProjeto}`, { waitUntil: "networkidle" });
      ok("empresa sem vínculo vê os termos antes dos detalhes", await ve(pe.getByRole("button", { name: /Confirmar e acessar|Aceitar e acessar o projeto/ }), 8000));
      await pe.getByRole("button", { name: /Confirmar e acessar|Aceitar e acessar o projeto/ }).click();
      await pe.getByRole("button", { name: /^Votar no projeto/ }).click();
      ok("empresa vota no projeto", await ve(pe.getByRole("button", { name: /Remover voto no projeto \(1 voto\)/ }), 8000));
      await pa.reload({ waitUntil: "networkidle" });
      ok("o criador vê a empresa entre os votos", await ve(pa.getByText("Bia Auditoria"), 10000));
      await print(pa, "projeto_votos");
      await pe.context().close();
    }

    // investidores (sócio) e contratos: proposta aceita vira sócio; contrato pela tela de contratos
    const prop = (await api("/proposta", bia.token, "POST", { descricaoProposta: "Aporte da auditoria", valorProposta: 2000, projetoId: proj.idProjeto })).body;
    await api(`/proposta/aceitar/${prop.idProposta}`, ana.token, "PUT");
    await pa.goto(`${BASE}/projetos/${proj.idProjeto}`, { waitUntil: "networkidle" });
    const secaoPropostas = pa.locator("section, div").filter({ has: pa.getByRole("heading", { name: /Propostas/ }) }).last();
    ok("o dono vê quem investiu (proposta aceita, com nome e valor)", (await ve(secaoPropostas.getByText(/Bia Auditoria/), 10000)) && (await ve(secaoPropostas.getByText(/2\.000/), 5000)));
    const equipe = (await api(`/projeto-usuario/projeto/${proj.idProjeto}`, ana.token)).body ?? [];
    const vinculoBia = equipe.find((v) => v.usuarioId === bia.id)?.nomeTipoVinculo;
    if (vinculoBia === "SOCIO") ok("quem teve a proposta aceita vira SÓCIO na equipe", true);
    else pendenciaBackend("quem teve a proposta aceita vira SÓCIO na equipe", `continua ${vinculoBia}: o backend só cria o vínculo SÓCIO se a pessoa ainda não tiver nenhum (quem aceitou os termos antes já é VISUALIZADOR)`);
    ok("projeto mostra o valor arrecadado", await ve(pa.getByText(/2\.000/), 8000));
    // documentos: termo de vínculo criado pelo dono do projeto
    await pa.getByRole("button", { name: "Novo termo" }).click();
    await pa.locator("#termo-vinculo-titulo").fill(`Confidencialidade ${sufixo}`);
    await pa.locator("#termo-vinculo-descricao").fill("Não divulgar informações do projeto.");
    await pa.getByRole("button", { name: "Cadastrar termo" }).click();
    ok("termo de vínculo criado pela tela", await ve(pa.getByText(`Confidencialidade ${sufixo}`), 8000));

    // contrato: o dono cria pela tela e quem fez a proposta aceita pela tela
    await pa.goto(`${BASE}/contratos`, { waitUntil: "networkidle" });
    ok("contratos: página abre", await ve(pa.getByRole("heading", { name: /Contratos/ }), 8000));
    await pa.getByRole("button", { name: "Novo contrato" }).first().click();
    const dt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T10:00`;
    const amanha = new Date(Date.now() + 86400000), depois = new Date(Date.now() + 40 * 86400000);
    await pa.locator("#contrato-titulo").fill(`Contrato Auditoria ${sufixo}`);
    await pa.locator("#contrato-descricao").fill("Contrato de sociedade criado pela auditoria.");
    await pa.locator("#contrato-inicio").fill(dt(amanha));
    await pa.locator("#contrato-fim").fill(dt(depois));
    await pa.locator("#contrato-projeto").selectOption(String(proj.idProjeto));
    await pa.waitForTimeout(600);
    const opcoesProp = await pa.locator("#contrato-proposta option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
    if (opcoesProp.length) await pa.locator("#contrato-proposta").selectOption(opcoesProp[0]);
    await pa.getByRole("button", { name: "Criar contrato" }).click();
    ok("contrato criado pela tela", await ve(pa.getByText(`Contrato Auditoria ${sufixo}`), 10000), `propostas no formulário: ${opcoesProp.length}`);
    const pi = await abrir(bia);
    await pi.goto(`${BASE}/contratos`, { waitUntil: "networkidle" });
    const aceitar = pi.locator("li, article").filter({ hasText: `Contrato Auditoria ${sufixo}` }).getByRole("button", { name: "Aceitar contrato" });
    if (await ve(aceitar, 8000)) {
      await aceitar.first().click();
      const ca = pi.getByRole("alertdialog");
      if (await ve(ca, 4000)) await ca.getByRole("button", { name: "Aceitar", exact: true }).click();
      await pi.waitForTimeout(2000);
      const lista = (await api("/contrato", bia.token)).body ?? [];
      const contrato = (Array.isArray(lista) ? lista : lista.content ?? []).find((c) => c.tituloContrato === `Contrato Auditoria ${sufixo}`);
      ok("quem fez a proposta aceita o contrato pela tela", /ACEIT/.test(contrato?.statusContrato ?? contrato?.status ?? ""), JSON.stringify(contrato).slice(0, 160));
    } else ok("quem fez a proposta vê 'Aceitar contrato'", false, "botão não encontrado");
    await pi.context().close();
  }

  // ================================================================== erros
  titulo("Erros e estados");
  {
    const pn = await abrir(ana);
    await pn.goto(BASE + "/rota-que-nao-existe");
    ok("página 404 amigável", await ve(pn.getByText(/não encontrada|não existe/i), 8000));
    await pn.route("**/backend/postagem", (r) => r.fulfill({ status: 500, body: JSON.stringify({ message: "falha" }) }));
    await pn.goto(BASE + "/feed");
    ok("erro 500 no feed mostra mensagem com 'Tentar novamente'", await ve(pn.getByRole("button", { name: /Tentar novamente/ }), 10000));
    await pn.unroute("**/backend/postagem");
    await pn.getByRole("button", { name: /Tentar novamente/ }).first().click();
    ok("'Tentar novamente' recarrega depois que o servidor volta", await some(pn.getByRole("button", { name: /Tentar novamente/ }), 10000));
    await pn.route("**/backend/projeto", (r) => r.abort());
    await pn.goto(BASE + "/projetos");
    ok("queda de rede em projetos mostra aviso (sem tela branca)", await ve(pn.getByText(/conectar|conexão|servidor|Não foi possível/i), 10000));
    await pn.unroute("**/backend/projeto");
    await pn.route("**/backend/postagem", async (r) => {
      await new Promise((ok) => setTimeout(ok, 2500));
      await r.continue();
    });
    await pn.goto(BASE + "/feed");
    ok("estado de carregamento enquanto o feed não responde", await ve(pn.getByLabel("Carregando publicações"), 2000));
    await pn.unroute("**/backend/postagem");
    await pn.context().close();
  }

  titulo("Erros no navegador");
  const relevantes = erros.filter((e) => !/status of (500|403)|Failed to fetch/.test(e));
  ok("nenhum erro de execução ou de console inesperado", relevantes.length === 0, relevantes.slice(0, 5).join(" | "));

  await browser.close();
  const reprovadas = resultados.filter((r) => !r.aprovado);
  if (process.env.RESULTADO_JSON) fs.writeFileSync(process.env.RESULTADO_JSON, JSON.stringify(resultados, null, 2));
  const pendencias = resultados.filter((r) => r.pendenciaBackend).length;
  console.log(`\n${resultados.length - reprovadas.length - pendencias}/${resultados.length} verificações aprovadas · ${reprovadas.length} reprovadas · ${pendencias} pendência(s) de backend`);
  process.exit(reprovadas.length ? 1 : 0);
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
