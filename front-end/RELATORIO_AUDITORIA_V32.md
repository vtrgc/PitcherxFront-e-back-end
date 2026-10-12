# PitcherX — Auditoria front × back (backend com migrations até a V32)

Escopo: **somente o front-end** foi alterado. Referência: `PitcherX-BackEnd-main_7.zip` enviado, mais novo
que a pasta `back-end/` do repositório (riscos de projeto, termos de vínculo por projeto, aceite de termos,
solicitações de vínculo, criador do projeto). Nenhum arquivo de `back-end/` foi criado, editado ou removido.

O backend do zip foi executado localmente (Java 21, PostgreSQL 16, SMTP de teste, catálogos da migration
V30) e os fluxos foram testados no Chromium contra ele.

## 1. Erros corrigidos

| Problema | Causa | Solução |
|---|---|---|
| Nenhuma chamada autenticada funcionava no navegador | O `SecurityConfig` novo não aplica o CORS: o preflight `OPTIONS` das rotas autenticadas recebe 403 | Proxy de mesma origem: o front chama `/backend/...` e o Next repassa a `BACKEND_URL` (rewrites em `next.config.js`). `NEXT_PUBLIC_API_URL` continua opcional |
| Criar projeto falhava | `POST /projeto` virou `POST /projeto/{idUsuario}` | `criarProjeto(idUsuario, dados)`; o backend já registra o CRIADOR (a chamada extra a `/projeto-usuario` foi removida) |
| Salvar projeto respondia 400 | `riscoProjeto` (texto) virou `riscoProjetoIds` (lista obrigatória) e a resposta traz `riscos` | Seletor de riscos do catálogo `GET /risco-projeto` no formulário; riscos exibidos no painel do projeto |
| Página do projeto não abria | `GET /projeto/{id}` usa `@PreAuthorize("authenticated()")` (SpEL inválido) → 400 para todos | O projeto é localizado na listagem `GET /projeto`; a regra de acesso é aplicada pela página |
| Adicionar/remover membro da equipe | `POST/PUT/DELETE /projeto-usuario` foram removidos | Equipe passa a ser só leitura; entrada por aceite de termos e por solicitações aprovadas |
| Admin "Termos de vínculo" cadastrava em rota inexistente | `POST /termo-vinculo` virou `POST /termo-vinculo/projeto/{id}` (USUARIO/EMPRESA) | Termos são criados pelo criador na página do projeto; o admin consulta (com projeto e obrigatoriedade) e exclui |

## 2. Telas implementadas ou alteradas

| Tela | Rota | Alteração |
|---|---|---|
| Página do projeto | `/projetos/[id]` | Portão de termos (aceite obrigatório/opcional), "Sua participação" (pedir para ser sócio/investidor), gestão dos termos pelo criador, solicitações recebidas com aprovar/recusar, atualização rápida de meta/valor arrecadado (`PATCH`), riscos no painel, equipe só leitura |
| Projetos | `/projetos` | Criação via `/projeto/{idUsuario}`, filtro "Participando", selo "Termos pendentes" |
| Solicitações (nova) | `/solicitacoes` | Recebidas (aprovar/recusar) e enviadas, filtro por situação, paginação; item no menu |
| Riscos de projeto (nova) | `/admin/riscos` | CRUD do catálogo com busca, modal, paginação; bloqueia exclusão de risco em uso |
| Solicitações de vínculo (nova) | `/admin/solicitacoes` | Acompanhamento de todos os pedidos (busca, filtro por situação) |
| Termos de vínculo (admin) | `/admin/termos-vinculo` | Lista com projeto, filtros por projeto e obrigatoriedade, exclusão |
| Termos | `/termos?aba=vinculo` | Mostra o projeto e a obrigatoriedade de cada termo |
| Perfil | `/perfil/[id]` | Vínculos de visualizador não entram no portfólio de projetos |

## 3. Testes executados

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | 0 erros |
| `npm run lint` | 0 erros (39 avisos `set-state-in-effect`, mesmo padrão já existente no projeto) |
| `npm run test` | 11 arquivos, 102 testes OK (novo: `tests/vinculos.test.ts`) |
| `next build` | OK — 46 rotas, incluindo `/solicitacoes`, `/admin/riscos`, `/admin/solicitacoes` |
| E2E no Chromium contra o backend real | 35/35: cadastro → código inválido/válido; criação de projeto com 2 riscos; termos obrigatório/opcional; `PATCH` da captação; edição preserva riscos; portão bloqueia até o termo obrigatório; aceite libera; pedido de participação; aprovação pelo criador; admin cria/busca/exclui risco, vê termos e solicitações, abre projeto; sem rolagem horizontal em 390 px |
| Console do navegador | Nenhum erro, exceto o 400 do código de verificação inválido digitado de propósito no teste |

## 4. Problemas que dependem do backend

1. **CORS**: o `SecurityConfig` não chama `.cors(...)` (a versão da pasta `back-end/` chamava). Contornado pelo proxy `/backend`; chamar a API direto de outra origem continua impossível.
2. **`GET /projeto/{id}`**: `@PreAuthorize("authenticated()")` é inválido (deveria ser `isAuthenticated()`); responde 400 sempre.
3. **Tipo pedido na solicitação é ignorado**: `solicitarVinculo` grava o tipo do *primeiro vínculo do usuário em qualquer projeto* (ex.: CRIADOR de outro projeto ou VISUALIZADOR), não o `tipoVinculoDesejadoId` enviado. Aprovar concede esse tipo registrado — pode tornar alguém CRIADOR. A interface mostra o tipo registrado, avisa o solicitante e o criador e pede confirmação explícita.
4. **Aprovar/recusar confia no parâmetro `usuarioIdCriador`**: qualquer usuário pode responder informando o id do criador. A interface só oferece as ações ao criador.
5. **`POST /termo-vinculo/projeto/{id}` não verifica o criador** (TODO no service) e `PUT` verifica título único entre *todos* os projetos.
6. **Excluir projeto com solicitações** falha (500) quando o schema é gerado pelo Hibernate (`ddl-auto: update`, Flyway desligado): a FK de `solicitacao_vinculo` não tem cascade. A mensagem de erro orienta o usuário. Com Flyway ligado a migration V7 falha em PostgreSQL (`type "double"`).
7. **`POST /termo-vinculo/projeto/{id}/aceitar` sem `termoIds`** responde 500; o front envia `termoIds=` quando o projeto não tem termos (testado: funciona).
8. `/solicitacao-vinculo/projeto/{id}/pendentes` responde a qualquer usuário; não há listagem geral de solicitações nem endpoint de tipos de vínculo (IDs seguem o `DataInitializer`).
9. Itens já documentados nos relatórios anteriores continuam valendo (reenvio de código de verificação, `biografia` fora dos DTOs, `PUT /usuario` sobrescrevendo a senha, propostas sem autor, sem mensagens/salvos/denúncias).

## 5. Regras de interface adotadas

- Acesso ao projeto segue `validarAcessoProjeto`: quem tem vínculo (ou aceitou os termos) vê os detalhes; o admin sempre vê.
- Visualizadores não gerenciam a galeria (o backend aceitaria qualquer vinculado); criador, sócios, investidores e admin sim.
- Termos de vínculo: o criador cadastra/edita; criador e admin excluem.
