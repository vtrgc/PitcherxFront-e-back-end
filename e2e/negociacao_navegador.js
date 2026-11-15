/**
 * Fluxo completo de negociação pela tela (Playwright): cadastro (válido, inválido, e-mail duplicado),
 * aprovação pelo admin, criar/editar/excluir projeto, acesso sem permissão, proposta, contrapropostas
 * (rejeitar, nova, aceitar), aceite final, recusa e telas no celular.
 *   ADMIN_EMAIL=... ADMIN_SENHA=... node e2e/negociacao_navegador.js
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:3000';
const MAILS_LOG = process.env.MAILS_LOG;
/** Último código de 6 dígitos enviado ao destinatário (SMTP de teste que grava em MAILS_LOG). */
function codigoNoEmail(destinatario) {
  if (!MAILS_LOG || !fs.existsSync(MAILS_LOG)) return null;
  const msgs = fs.readFileSync(MAILS_LOG, 'utf8').split('\n=====\n').reverse();
  for (const bruto of msgs) {
    if (!bruto.toLowerCase().includes(destinatario.toLowerCase())) continue;
    const texto = bruto.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const achados = texto.match(/(?<!\d)\d{6}(?!\d)/g);
    if (achados) return achados[achados.length - 1];
  }
  return null;
}
const res = []; const consoleErros = [];
const ok = (n, c, x = '') => { res.push({ n, c: !!c }); console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + String(x).slice(0, 300))); };
const sufixo = Date.now().toString(36);
const iso = (d) => d.toISOString().slice(0, 10);
async function novaPagina(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', e => consoleErros.push('PAGEERROR ' + e.message));
  page.on('response', r => { if (r.status() >= 400 && !/\/backend\/proposta\/\d+$/.test(r.url())) consoleErros.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`); });
  return { ctx, page };
}
async function entrar(page, email, senha) {
  await page.goto(BASE + '/auth/login');
  await page.fill('input[name=email]', email);
  await page.fill('input[type=password]', senha);
  await page.click('button[type=submit]');
}
const ve = async (loc, t = 12000) => { try { await loc.first().waitFor({ timeout: t }); return true; } catch { return false; } };
async function confirmar(page, rotulo) { await page.getByRole('alertdialog').getByRole('button', { name: rotulo, exact: true }).click(); }
async function api(path, token, method = 'GET', body) {
  const r = await fetch(BASE + '/backend' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : null };
}

(async () => {
  const browser = await chromium.launch();
  const adm = (await api('/usuario/login', null, 'POST', { emailUsuario: process.env.ADMIN_EMAIL, senhaUsuario: process.env.ADMIN_SENHA })).body.token;
  const contas = { criador: { nome: 'Carla Criadora', email: `carla.${sufixo}@teste.com` }, investidor: { nome: 'Igor Investidor', email: `igor.${sufixo}@teste.com` } };
  const SENHA = 'segura123';

  // ============================== USUÁRIOS
  let { ctx, page } = await novaPagina(browser);
  await page.goto(BASE + '/auth/cadastro');
  await page.click('button[type=submit]');
  ok('cadastro com campos vazios mostra erros', await page.getByText('Informe seu nome.').count() > 0 && await page.getByText('Informe seu e-mail.').count() > 0);
  await page.fill('input[name=nome]', 'Al'); await page.fill('input[name=email]', 'invalido'); await page.fill('input[name=password]', '123456'); await page.fill('input[name=confirm-password]', '654321');
  await page.click('button[type=submit]');
  ok('cadastro inválido: nome curto, e-mail, senha fraca e confirmação', (await page.getByText('pelo menos 3 caracteres').count()) > 0 && (await page.getByText('e-mail válido').count()) > 0 && (await page.getByText('letras e números').count()) > 0 && (await page.getByText('não coincidem').count()) > 0);
  await page.fill('input[name=nome]', 'Duplicado Teste'); await page.fill('input[name=email]', process.env.ADMIN_EMAIL); await page.fill('input[name=password]', SENHA); await page.fill('input[name=confirm-password]', SENHA);
  await page.click('button[type=submit]');
  await page.waitForTimeout(1500);
  ok('e-mail duplicado aparece no campo', await page.getByText('Este e-mail já está cadastrado.').count() > 0);
  for (const c of Object.values(contas)) {
    await page.goto(BASE + '/auth/cadastro');
    await page.fill('input[name=nome]', c.nome); await page.fill('input[name=email]', c.email); await page.fill('input[name=telefone]', '(11) 98888-7777');
    await page.fill('input[name=password]', SENHA); await page.fill('input[name=confirm-password]', SENHA);
    await page.click('button[type=submit]');
    await page.getByRole('heading', { name: 'Conta criada!' }).waitFor({ timeout: 15000 }).catch(() => {});
    ok(`cadastro válido (${c.nome}) mostra "Conta criada" e próximos passos`, await page.getByRole('heading', { name: 'Conta criada!' }).count() > 0);
  }
  await entrar(page, contas.criador.email, SENHA);
  await page.waitForTimeout(1500);
  ok('login antes da aprovação explica que a conta aguarda análise', await page.getByText('ainda não foi ativada').count() > 0);
  await ctx.close();

  // admin ativa as contas pela tela de identidades (aprovação → fallback de ativação)
  ({ ctx, page } = await novaPagina(browser));
  await entrar(page, process.env.ADMIN_EMAIL, process.env.ADMIN_SENHA); await page.waitForURL(/\/admin/);
  await page.goto(BASE + '/admin/identidades', { waitUntil: 'networkidle' });
  for (const c of Object.values(contas)) {
    await page.fill('#busca-identidades', c.email);
    const card = page.locator('li', { hasText: c.email });
    await card.getByRole('button', { name: 'Aprovar' }).click();
    await confirmar(page, 'Aprovar');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Ativar conta' }).click({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  const usuarios = (await api('/usuario', adm)).body;
  for (const c of Object.values(contas)) { c.id = usuarios.find(u => u.emailUsuario === c.email).idUsuario; ok(`conta de ${c.nome} ativada pelo admin (pela tela de identidades)`, usuarios.find(u => u.emailUsuario === c.email).active); }
  await ctx.close();

  const cri = await novaPagina(browser); await entrar(cri.page, contas.criador.email, SENHA); await cri.page.waitForURL(u => !u.pathname.startsWith('/auth/login'), { timeout: 15000 }).catch(() => {});
  ok('login após aprovação (criador)', !cri.page.url().includes('/auth/login'), cri.page.url());
  const inv = await novaPagina(browser); await entrar(inv.page, contas.investidor.email, SENHA); await inv.page.waitForURL(u => !u.pathname.startsWith('/auth/login'), { timeout: 15000 }).catch(() => {});
  ok('login após aprovação (investidor)', !inv.page.url().includes('/auth/login'), inv.page.url());
  // primeiro acesso: o backend pede o código enviado por e-mail no cadastro
  for (const [p, conta] of [[cri.page, contas.criador], [inv.page, contas.investidor]]) {
    await p.waitForURL(/\/auth\/verificar-conta/, { timeout: 10000 }).catch(() => {});
    ok(`primeiro acesso pede o código do e-mail (${conta.nome})`, p.url().includes('/auth/verificar-conta'), p.url());
    const cod = codigoNoEmail(conta.email);
    if (cod) {
      await p.getByLabel('Código de verificação').fill(cod);
      await p.getByRole('button', { name: 'Verificar conta' }).click();
      await p.waitForURL(u => !u.pathname.startsWith('/auth/verificar-conta'), { timeout: 15000 }).catch(() => {});
    }
    await p.goto(BASE + '/feed', { waitUntil: 'networkidle' });
    ok(`código confirmado e plataforma liberada (${conta.nome})`, p.url().includes('/feed'), p.url());
  }
  ok('autenticação persiste ao recarregar', !(await cri.page.reload().then(() => cri.page.url())).includes('/auth/login'));

  // ============================== PROJETOS
  const P = cri.page;
  await P.goto(BASE + '/projetos', { waitUntil: 'networkidle' });
  await P.getByRole('button', { name: /Novo projeto|Criar projeto|Publicar/ }).first().click();
  await P.getByRole('button', { name: 'Publicar projeto' }).click();
  ok('criar projeto sem campos obrigatórios é bloqueado', await P.getByText(/Preencha o nome e a descrição/).count() > 0);
  const nomeProj = `Energia Solar Comunitária ${sufixo}`;
  await P.fill('#proj-nome', nomeProj);
  await P.fill('#proj-descricao', 'Placas solares em telhados de escolas públicas.');
  await P.selectOption('#proj-tipo', { index: 1 });
  const hoje = new Date(); const fim = new Date(Date.now() + 300 * 864e5);
  await P.fill('#proj-inicio', iso(hoje)); await P.fill('#proj-fim', iso(fim));
  await P.fill('#proj-ficha-meta', '200000');
  await P.getByRole('button', { name: 'Publicar projeto' }).click();
  ok('investimento mínimo e participação obrigatórios', await P.getByText('Informe o investimento mínimo por aporte.').count() > 0 && await P.getByText('Informe a participação oferecida aos investidores.').count() > 0);
  await P.fill('#proj-ficha-minimo', '5000'); await P.fill('#proj-ficha-participacao', '12'); await P.fill('#proj-ficha-uso', 'Compra de placas e instalação');
  await P.getByRole('button', { name: 'Publicar projeto' }).click();
  await P.waitForURL(/\/projetos\/\d+$/, { timeout: 20000 }).catch(() => {});
  const pid = Number(P.url().split('/').pop());
  ok('projeto criado e aberto', pid > 0 && await ve(P.getByRole('heading', { name: nomeProj })), P.url());
  ok('detalhes mostram participação e investimento mínimo', (await ve(P.getByText(/12\s?%/))) && (await ve(P.getByText(/5\.000/))));
  await P.getByRole('button', { name: 'Editar' }).click();
  await P.fill('#proj-nome', nomeProj + ' (editado)');
  await P.getByRole('button', { name: 'Salvar alterações' }).click();
  await P.waitForTimeout(1500);
  ok('editar projeto atualiza a tela', await P.getByRole('heading', { name: nomeProj + ' (editado)' }).count() > 0);
  await P.goto(BASE + '/projetos', { waitUntil: 'networkidle' });
  ok('projeto aparece na listagem', await P.getByText(nomeProj + ' (editado)').count() > 0);

  // projeto descartável para testar exclusão
  const tp = (await api('/tipo-projeto', adm)).body[0].idTipoProjeto;
  const tokCri = (await api('/usuario/login', null, 'POST', { emailUsuario: contas.criador.email, senhaUsuario: SENHA })).body.token;
  const f = (d) => d.toLocaleDateString('pt-BR');
  const desc = (await api(`/projeto/${contas.criador.id}`, tokCri, 'POST', { nomeProjeto: 'Projeto descartável ' + sufixo, descricaoProjeto: 'x', dataInicioProjeto: f(hoje), dataFimProjeto: f(fim), tipoProjetoId: tp, metaFinanceira: 10, investimentoMinimo: 1, participacaoOferecida: 1, riscoProjetoIds: [] })).body;
  await P.goto(`${BASE}/projetos/${desc.idProjeto}`, { waitUntil: 'networkidle' });
  await P.getByRole('button', { name: 'Excluir projeto' }).click();
  await confirmar(P, 'Excluir');
  await P.waitForURL(/\/projetos$/, { timeout: 15000 }).catch(() => {});
  ok('excluir projeto (pelo criador)', (await api(`/projeto`, tokCri)).body.every(p => p.idProjeto !== desc.idProjeto));

  // acesso sem autorização: investidor abre o projeto da criadora
  const I = inv.page;
  await I.goto(`${BASE}/projetos/${pid}`, { waitUntil: 'networkidle' });
  ok('outra conta não vê Editar/Excluir', (await I.getByRole('button', { name: 'Editar' }).count()) === 0 && (await I.getByRole('button', { name: 'Excluir projeto' }).count()) === 0);
  ok('outra conta precisa aceitar os termos para ver os detalhes', await I.getByRole('heading', { name: /termos|Termos/ }).count() > 0);

  // ============================== PROPOSTAS
  await I.goto(`${BASE}/propostas?projetoId=${pid}`, { waitUntil: 'networkidle' });
  await I.waitForSelector('#proposta-descricao');
  const textoProp1 = 'Aporte de 20 mil por 10% ' + sufixo;
  await I.fill('#proposta-descricao', textoProp1); await I.fill('#proposta-valor', '20000');
  await I.getByRole('button', { name: 'Enviar proposta' }).click();
  await I.waitForTimeout(2500);
  const itemI = I.locator('li', { hasText: textoProp1 });
  ok('proposta enviada aparece em "Enviadas por mim" com status', (await itemI.count()) > 0 && (await itemI.getByText('Proposta enviada').count()) > 0);
  // duplicada no mesmo projeto
  await I.getByRole('button', { name: 'Nova proposta' }).click();
  await I.selectOption('#proposta-projeto', String(pid));
  await I.fill('#proposta-descricao', 'duplicada'); await I.fill('#proposta-valor', '1');
  await I.getByRole('button', { name: 'Enviar proposta' }).click(); await I.waitForTimeout(1200);
  ok('segunda proposta em aberto no mesmo projeto é bloqueada', await I.getByText(/já tem a proposta #\d+ em negociação/).count() > 0);
  await I.getByRole('button', { name: 'Cancelar' }).first().click().catch(() => {});

  await P.goto(BASE + '/propostas', { waitUntil: 'networkidle' }); await P.waitForTimeout(1500);
  const itemP = P.locator('li', { hasText: textoProp1 });
  ok('criadora recebe a proposta com nome do autor', (await itemP.count()) > 0 && (await itemP.getByText('Enviada por Igor Investidor').count()) > 0);
  ok('status "Proposta recebida" para a criadora', await itemP.getByText('Proposta recebida').count() > 0);

  // ============================== CONTRAPROPOSTAS
  await itemP.getByRole('link').first().click();
  await P.waitForURL(/\/propostas\/\d+$/); await P.waitForTimeout(1200);
  const propId = Number(P.url().split('/').pop());
  await P.getByRole('button', { name: 'Fazer contraproposta' }).click();
  await P.fill('#contra-descricao', 'Aceito com 8% de participação'); await P.fill('#contra-valor', '25000');
  await P.getByRole('button', { name: 'Enviar contraproposta' }).click(); await P.waitForTimeout(2000);
  ok('contraproposta enviada aparece no histórico', await P.getByText('Contraproposta de você').count() > 0);
  ok('não dá para enviar outra contraproposta com uma pendente', await P.getByRole('button', { name: 'Fazer contraproposta' }).isDisabled());
  ok('não dá para aceitar a proposta com contraproposta pendente', await P.getByRole('button', { name: 'Aceitar proposta' }).isDisabled());

  await I.goto(`${BASE}/propostas/${propId}`, { waitUntil: 'networkidle' }); await I.waitForTimeout(1200);
  ok('investidor vê "Contraproposta recebida"', await I.getByText('Contraproposta recebida').count() > 0);
  ok('investidor não pode editar/cancelar com contraproposta pendente', await I.getByRole('button', { name: 'Cancelar proposta' }).isDisabled());
  await I.getByRole('button', { name: 'Rejeitar' }).click();
  await I.getByRole('button', { name: 'Rejeitar', exact: true }).last().click();
  ok('rejeitar sem justificativa é bloqueado', await I.getByText('A justificativa é obrigatória para rejeitar.').count() > 0);
  await I.fill('#rejeicao-justificativa', 'Prefiro manter 10%.');
  await I.getByRole('dialog').getByRole('button', { name: 'Rejeitar' }).click(); await I.waitForTimeout(1500);
  ok('contraproposta rejeitada no histórico', await ve(I.locator('li', { hasText: 'Aceito com 8%' }).getByText('Rejeitada')));

  await P.reload({ waitUntil: 'networkidle' }); await ve(P.getByText('Histórico da negociação'));
  ok('criadora vê "Contraproposta rejeitada" e pode responder de novo', (await ve(P.getByText('Contraproposta rejeitada'))) && !(await P.getByRole('button', { name: 'Fazer contraproposta' }).isDisabled()));
  await P.getByRole('button', { name: 'Fazer contraproposta' }).click();
  await P.fill('#contra-descricao', 'Fechamos em 22 mil com 10%'); await P.fill('#contra-valor', '22000');
  await P.getByRole('button', { name: 'Enviar contraproposta' }).click(); await P.waitForTimeout(2000);

  await I.reload({ waitUntil: 'networkidle' }); await I.waitForTimeout(1200);
  await I.locator('li', { hasText: 'Fechamos em 22 mil' }).getByRole('button', { name: 'Aceitar' }).click();
  await confirmar(I, 'Aceitar'); await I.waitForTimeout(2500);
  ok('investidor aceita a nova contraproposta', await ve(I.locator('li', { hasText: 'Fechamos em 22 mil' }).getByText('Aceita')));
  ok('valor da proposta atualizado para o acordado', await ve(I.getByRole('heading', { name: /22\.000/ })));

  await P.reload({ waitUntil: 'networkidle' }); await P.waitForTimeout(1200);
  ok('criadora vê "Contraproposta aceita" e é a vez dela', await ve(P.getByText('Contraproposta aceita')));
  await P.getByRole('button', { name: 'Aceitar proposta' }).click(); await confirmar(P, 'Aceitar'); await P.waitForTimeout(2500);
  ok('proposta aceita: histórico completo (enviada, 2 contrapropostas, aceite)', (await ve(P.getByText('Proposta aceita pelo criador do projeto'))) && (await P.getByText(/Contraproposta de/).count()) === 2);
  const vinc = (await api(`/projeto-usuario/projeto/${pid}`, tokCri)).body;
  ok('investidor virou SÓCIO no backend', vinc.some(v => v.usuarioId === contas.investidor.id && v.nomeTipoVinculo === 'SOCIO'));
  const proj = (await api('/projeto', tokCri)).body.find(p => p.idProjeto === pid);
  ok('valor arrecadado = valor acordado (22 mil)', proj.valorArrecadado === 22000, proj.valorArrecadado);

  // recusar: nova proposta → recusada
  await I.goto(`${BASE}/propostas?projetoId=${pid}`, { waitUntil: 'networkidle' }); await I.waitForSelector('#proposta-descricao');
  const textoProp2 = 'Segunda proposta ' + sufixo;
  await I.fill('#proposta-descricao', textoProp2); await I.fill('#proposta-valor', '1000');
  await I.getByRole('button', { name: 'Enviar proposta' }).click(); await I.waitForTimeout(2500);
  await P.goto(BASE + '/propostas', { waitUntil: 'networkidle' }); await P.waitForTimeout(1500);
  await P.locator('li', { hasText: textoProp2 }).getByRole('button', { name: 'Recusar' }).click(); await confirmar(P, 'Recusar'); await P.waitForTimeout(2000);
  ok('recusar proposta atualiza o status', await ve(P.locator('li', { hasText: textoProp2 }).getByText('Proposta recusada')));
  await I.goto(BASE + '/propostas?aba=enviadas', { waitUntil: 'networkidle' }); await I.waitForTimeout(1500);
  ok('investidor vê as duas situações finais', (await I.locator('li', { hasText: textoProp2 }).getByText('Proposta recusada').count()) > 0 && (await I.locator('li', { hasText: textoProp1 }).getByText('Proposta aceita').count()) > 0);
  // inválido: investidor tenta contrapropor (API)
  const tokInv = (await api('/usuario/login', null, 'POST', { emailUsuario: contas.investidor.email, senhaUsuario: SENHA })).body.token;
  ok('backend recusa contraproposta de quem não é dono', (await api('/contra-proposta', tokInv, 'POST', { descricaoContraProposta: 'x', idProposta: propId })).status === 400);
  await I.goto(BASE + '/notificacoes', { waitUntil: 'networkidle' });
  ok('notificações de contraproposta chegam ao investidor', await I.getByText('Nova contraproposta recebida').count() > 0);

  // ============================== CELULAR
  const mob = await novaPagina(browser, { ...devices['iPhone 13'] });
  await mob.page.goto(BASE + '/auth/cadastro', { waitUntil: 'networkidle' });
  for (const rota of ['/auth/cadastro']) {
    const larg = await mob.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`celular ${rota} sem rolagem horizontal`, larg <= 1, larg); await mob.page.screenshot({ path: (process.env.SAIDA_DIR || '/tmp') + '/rev_cadastro.png' });
  }
  await entrar(mob.page, contas.criador.email, SENHA); await mob.page.waitForTimeout(2500);
  for (const rota of ['/propostas', `/propostas/${propId}`, `/projetos/${pid}`, '/projetos']) {
    await mob.page.goto(BASE + rota, { waitUntil: 'networkidle' }); await mob.page.waitForTimeout(800);
    const larg = await mob.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`celular ${rota} sem rolagem horizontal`, larg <= 1, larg);
    await mob.page.screenshot({ path: `/var/tmp/pxtest/rev${rota.replace(/[/?=]/g, '_')}.png`, fullPage: rota.startsWith('/propostas/') });
  }
  await browser.close();
  console.log('\nErros HTTP/execução no navegador:'); [...new Set(consoleErros)].forEach(e => console.log('  ' + e));
  console.log(`\n${res.filter(r => r.c).length}/${res.length} OK`);
})().catch(e => { console.error('ERRO', e.message.split('\n').slice(0, 4).join(' | ')); console.log(`\n${res.filter(r => r.c).length}/${res.length} OK até aqui`); process.exit(1); });
