# PitcherX — Auditoria e correções do front-end (rodada 3)

Data: 23/09/2026 · Escopo: somente o front-end (`front-pitcherx-perfil.zip`). O backend
(`PitcherX-BackEnd-main 7.zip`) foi usado apenas como referência de contrato e **não foi alterado** (seção 8).

---

## 1. Resumo da auditoria

O front recebido já compilava, passava no TypeScript/ESLint (0 erros) e tinha 37 testes unitários. As rodadas
anteriores tinham corrigido os contratos de API mais visíveis. Esta rodada comparou cada formulário e cada ação
com o que o **banco e os serviços Java realmente aceitam** (migrations Flyway, FKs, colunas `UNIQUE`, tamanhos de
coluna, `@PreAuthorize`) e executou todos os fluxos num navegador real. Foram encontrados 15 problemas:

- **Tela travada:** `/auth/completar-cadastro` ficava em "Carregando…" para sempre para quem já tinha perfil.
- **Perda de dados silenciosa:** excluir um tipo de projeto ou uma especialidade em uso apagava em cascata, no
  banco, os projetos ou perfis profissionais ligados a eles (`ON DELETE CASCADE`). A interface permitia isso sem aviso.
- **Erros 500 evitáveis:** textos maiores que a coluna (título de publicação 80, URL de imagem do projeto 155,
  termo 255, logradouro/bairro 155), nomes duplicados em colunas `UNIQUE` (área, especialidade, tipo de projeto)
  e exclusões bloqueadas por FK sem cascade (projeto com contratos, contrato com termos, área com subáreas).
- **Mensagens inúteis:** em qualquer 5xx a tela mostrava só "Ocorreu um erro no servidor", mesmo quando ela
  tinha uma explicação melhor (por exemplo, "o registro pode estar em uso").
- **Login:** quem digitava o e-mail com maiúsculas recebia "e-mail ou senha inválidos", porque o cadastro grava
  em minúsculas e o backend compara o texto exato.
- **Permissões:** se a lista da equipe do projeto falhasse, a tela concluía "projeto sem criador" e liberava
  Editar/Excluir para qualquer usuário.
- **Interface:** formulários do admin que não enviavam com Enter, rolagem horizontal no dashboard em 360 px,
  rótulos sobrepostos nos gráficos, botões sem `type`/nome acessível e a lista do feed trocada por esqueletos a
  cada atualização.

## 2. Arquivos do front-end modificados

| Arquivo | Correção |
| --- | --- |
| `app/lib/limites.ts` (novo) | Limites das colunas do banco (fonte única) e `mesmoNome()` para checar duplicidade. |
| `app/lib/api.ts` | `mensagemErro`: em 5xx usa a mensagem de contexto da tela, se houver. |
| `app/lib/date.ts` | `hojeServidorInput()`: "hoje" conferido pelo servidor, que pode estar em UTC. `validarDatasProjeto` usa essa data. |
| `app/hook/useDadosPerfil.ts` | Continua "carregando" até os dados do id atual chegarem. Corrige a tela travada. |
| `app/context/AuthContext.tsx` | Nova tentativa de login com o e-mail em minúsculas. Informa quando a sessão salva já tinha vencido. |
| `app/hook/useRequireAuth.ts`, `useRequireAdmin.ts` | Redirecionam com `?expirada=1`, para o login avisar que a sessão expirou. |
| `app/components/CriarPost.tsx`, `PostCard.tsx` | Título limitado a 80 caracteres (antes 150). |
| `app/components/FormProjeto.tsx` | URL da imagem limitada a 155 caracteres, com mensagem. Data mínima pelo "hoje" do servidor. |
| `app/components/FormEndereco.tsx` | Bairro e logradouro limitados a 155 (antes 120/160). |
| `app/components/FormValorDescricao.tsx` | Valor máximo aceito (coluna `DECIMAL(19,2)`). |
| `app/projetos/[id]/page.tsx` | Não exclui projeto com contratos. Se equipe ou contratos não carregarem, nada é liberado e aparece "Tentar novamente". |
| `app/contratos/page.tsx`, `app/contratos/[id]/page.tsx` | Não exclui contrato com termos. Mostra erro se os termos não carregarem. |
| `app/admin/projetos/page.tsx` | Não exclui projeto com contratos. Mensagem de sucesso. Botões com `type` e nome acessível. |
| `app/tipos-projeto/page.tsx` | Nome duplicado bloqueado. Não exclui tipo em uso (evita apagar projetos em cascata). |
| `app/admin/especialidades/page.tsx` | Nome duplicado bloqueado, `maxLength` 120, `trim`. Não exclui especialidade em uso (evita apagar perfis em cascata). Enter envia. |
| `app/admin/areas/page.tsx` | Nome duplicado bloqueado, `trim`, `maxLength`. Não exclui área com subáreas. Enter envia. |
| `app/admin/subareas/page.tsx` | `trim` e `maxLength`. Enter envia. Botões com nome acessível. |
| `app/admin/termos/page.tsx` | Título e descrição limitados a 255, com contador. `trim`. Enter envia. |
| `app/admin/page.tsx` | Sem rolagem horizontal em 360 px. Botões com `type`. Removidos `{}` soltos. |
| `app/admin/postagens/page.tsx`, `app/admin/interacoes/page.tsx` | Botões com `type="button"` e nome acessível. |
| `app/components/admin/BarChart.tsx` | Rótulos sem sobreposição (corte com `<title>`). `aria-label` com os valores. |
| `app/feed/page.tsx` | Atualizações não trocam a lista por esqueletos. Comentários abertos e rolagem são mantidos. |
| `app/comentarios/page.tsx` | O admin vai para `/admin/postagens`, não para o feed. |
| `app/propostas/page.tsx` | Mensagem de exclusão correta (contrapropostas são apagadas em cascata). |
| `app/services/perfilUsuario.service.ts` | Ignora perfis sem usuário vinculado, que antes quebravam cartões e seletores. |
| `tests/correcoes.test.ts` (novo) | 8 testes para as regras novas. |

## 3. Erros corrigidos (causa → solução)

1. **Completar cadastro travado.** No render em que a sessão ficava pronta, o hook ainda dizia "não carregando".
   A página concluía "sem perfil", marcava como verificado e depois ficava num spinner sem fim.
   → O hook passa a considerar o id que já foi carregado.
2. **Exclusão em cascata de tipos e especialidades.** `projeto.tipo_projeto_id` e `perfil_usuario.especialidade_id`
   têm `ON DELETE CASCADE` (migrations V7 e V3). → Antes de excluir, o front conta os registros ligados e bloqueia
   a exclusão com uma explicação.
3. **Exclusões recusadas pelo banco (500).** `contrato.id_projeto`, `termo.id_contrato` e a subárea→área não têm
   cascade. → A tela confere antes e explica o que fazer ("Exclua os contratos antes…").
4. **Estouro de tamanho de coluna (500).** → `maxLength` e validação com os limites reais (`lib/limites.ts`).
5. **Duplicidade em colunas `UNIQUE` (500).** → Checagem local sem diferenciar maiúsculas de minúsculas.
6. **Mensagem genérica em 5xx.** → A mensagem de contexto da tela tem prioridade.
7. **Login com e-mail em maiúsculas.** → Nova tentativa com o e-mail em minúsculas, só depois de um 400/404.
8. **Permissão liberada por falha de rede.** → Sem a equipe carregada, Editar/Excluir não aparecem.
9. **Datas de projeto e fuso do servidor.** → O "hoje" é a maior data entre a local e a UTC, a mesma regra já usada
   nas publicações.
10. **Sessão vencida ao abrir o app.** → O login mostra "Sua sessão expirou".
11. **Enter não enviava** os formulários de área, subárea, especialidade e termo. → Viraram `<form>`.
12. **Layout:** rolagem horizontal no dashboard em 360 px e rótulos sobrepostos nos gráficos.
13. **Acessibilidade:** botões sem `type` (9) e ícones "Editar/Excluir" sem dizer de qual registro.
14. **Feed:** esqueletos a cada atualização.
15. **Perfis sem usuário** quebravam o Explorar e o seletor de membros.

## 4. Funcionalidades testadas

Os testes rodaram num navegador real (Playwright/Chromium) contra o build de produção (`next build` + `next start`).

- **Autenticação (22 verificações):** cadastro (validações, e-mail em minúsculas, telefone só com dígitos);
  completar cadastro em 3 etapas (foto real por multipart, arquivo corrompido, CPF inválido, link `javascript:`,
  CPF formatado, CEP); retorno ao completar cadastro com perfil existente; logout sem token e sem senha guardados;
  login (senha errada, e-mail em maiúsculas); rota protegida com `?redirect`; token vencido com aviso; recuperação
  de senha (e-mail inexistente, código errado, código certo) e login com a nova senha.
- **Social, projetos, propostas e perfil (46 verificações):** feed; limite do título; publicar, editar, buscar e
  excluir; curtir e descurtir com persistência após recarregar; comentário, curtida de comentário, resposta,
  edição e exclusão; compartilhar pela área de transferência; página da publicação e 404; projeto (data
  retroativa, URL longa, vínculo CRIADOR, curtida, membro, vínculo duplicado, contrato a partir do projeto,
  exclusão bloqueada); contrato (termos, exclusão bloqueada, edição); permissões de quem não é criador;
  propostas e contrapropostas; editar perfil (foto, CNPJ, persistência, foto na navegação); troca de senha.
- **Admin (27 verificações):** login e dashboard; bloqueio do feed; especialidades (duplicada, Enter, em uso, sem
  uso); tipos de projeto (duplicado, em uso); áreas e subáreas (duplicada, com subárea); termos (limite 255);
  projetos (com e sem contrato; sem "Editar" para o admin); moderação de postagens e comentários; desativar e
  reativar usuário, com a conta desativada barrada no login; limite do endereço.
- **Varredura de rotas e responsividade (240 verificações):** todas as rotas públicas, de usuário e de admin em
  360, 390, 768, 1024 e 1440 px, sem erros de console ou página e sem rolagem horizontal.

## 5. Resultados reais dos testes

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` (strict) | ✅ 0 erros |
| `npx eslint .` | ✅ 0 erros · 28 avisos `react-hooks/set-state-in-effect` (o mesmo padrão já documentado em `eslint.config.mjs`: carregar dados ao montar a tela) |
| `npx vitest run` | ✅ 6 arquivos, **45/45** (8 novos) |
| `npx next build` | ✅ todas as rotas geradas |
| `npm audit` | ✅ 0 vulnerabilidades |
| E2E autenticação | ✅ 22/22 |
| E2E social, projetos, propostas e perfil | ✅ 46/46 |
| E2E admin | ✅ 27/27 |
| Varredura de rotas × 5 larguras | ✅ 240/240 |

**Como o backend foi testado.** O backend real **não pôde ser executado** neste ambiente. O Java 25 foi
instalado, mas o Maven Central está bloqueado pelo proxy (HTTP 403), então as dependências do Spring Boot 4 não
baixam. Para não declarar integrações sem teste, os E2E rodaram contra um *stub de contrato* escrito a partir do
código Java. Ele reproduz rotas, métodos, `@PreAuthorize`, 403 sem token, validações dos DTOs, formato do
`GlobalExceptionHandler`, JWT HS256 igual ao `TokenConfig`, limites de coluna, `UNIQUE`, FKs com e sem cascade,
servidor em UTC e os comportamentos conhecidos (500 do `GET /usuario/{id}` sem `?id`, `validar-token` sempre 204,
500 no `esqueci-senha` com e-mail inexistente). O stub é uma ferramenta de teste e **não faz parte da entrega**.
Também ficaram fora: envio real de e-mail, Safari/Firefox e leitores de tela.

**Recomendação:** antes de publicar, rode os fluxos principais contra o backend real, com `FRONTEND_URL_1`,
`UPLOAD_*` e `MAIL_*` configurados.

## 6. Problemas restantes (não resolvíveis só no front)

1. Nome, e-mail e telefone continuam somente leitura. `PUT /usuario/{id}` grava a senha em texto puro e o usuário
   perde o acesso.
2. Excluir um usuário que tem curtidas ou perfil profissional falha com 500 (FK sem cascade). A tela explica, mas
   o front não consegue remover esses vínculos antes por conta própria.
3. Curtir duas vezes (outra aba) e descurtir algo já descurtido geram 500. A interface se ressincroniza.
4. O e-mail de recuperação inexistente gera 500 (o front mostra uma mensagem clara).
5. Sem paginação no servidor: o front filtra e pagina no cliente.
6. Mensagens e notificações não existem no backend (as telas informam isso).

## 7. Dependências do backend (correções sugeridas, **não aplicadas**)

| Problema | Onde corrigir no servidor |
| --- | --- |
| Senha em texto puro no `PUT /usuario/{id}` | `UsuarioMapper.updateFromDTO` ignorar `senhaUsuario` ou usar o `UsuarioUpdateDTO` |
| `GET /usuario/{id}` sem `@PathVariable` | `UsuarioController.getUsuarioById` |
| Cascata perigosa em `tipo_projeto` e `especialidade` | Migration: trocar `ON DELETE CASCADE` por `RESTRICT` e tratar no service |
| FKs sem cascade viram 500 | Tratar `DataIntegrityViolationException` e `IllegalStateException` no `GlobalExceptionHandler` (409/400) |
| Colunas curtas sem `@Size` | Adicionar `@Size` nos DTOs (ex.: `tituloPostagem` ≤ 80), devolvendo 400 com o campo |
| E-mail sensível a maiúsculas | Normalizar o e-mail no cadastro e no login (`lower()`) |
| Segredo JWT fixo, IDOR, login de conta desativada, sem 401 | Já listados no `RELATORIO_TECNICO.md` (seção G) |

## 8. Confirmação de escopo

- Nenhum arquivo do backend foi criado, alterado ou excluído. O backend extraído ficou em somente leitura
  (`chmod -R a-w`) durante todo o trabalho.
- SHA-256 dos **403 arquivos** do backend, antes e depois: **idênticos** (`diff` vazio). Uma nova extração do ZIP
  original comparada com `diff -r`: **idêntica**.
- SHA-256 do ZIP do backend: `09fa11de92dd38e23882a3c88d9927576411b3afd96f40b4879f4327dc03df44`.
- Nenhum banco foi criado ou alterado, nenhuma migration foi executada e nenhum endpoint foi criado.
- A entrega contém **apenas o front-end**.
