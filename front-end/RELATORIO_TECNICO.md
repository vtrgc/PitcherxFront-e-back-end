# PitcherX — Relatório técnico da auditoria do front-end

Data: 21/09/2026 · Escopo: `front-pitcherx-auth-redesign-fotos-reais.zip` (front-end) com
`PitcherX-BackEnd-main (6).zip` usado **somente como referência** (nenhum arquivo do backend foi alterado — ver seção H).

---

## A. Resumo da auditoria

**O que foi analisado**

- Toda a estrutura do front-end: 35 rotas do App Router, 60+ componentes/hooks/serviços/tipos, `package.json`,
  `tsconfig.json`, `next.config.js`, Tailwind/PostCSS, `.env.example`, CSS de autenticação e da home.
- Todo o backend como referência de contrato: 19 controllers (≈100 endpoints), DTOs, mappers MapStruct, services,
  `SecurityConfig`/`SecurityFilter`/`TokenConfig`, `GlobalExceptionHandler`, `DataInitializer`, migrations Flyway V1–V21.

**Diagnóstico geral do front recebido**

O projeto compilava (TypeScript e `next build` sem erros), mas várias funcionalidades **pareciam** prontas e não
funcionavam contra o backend real. Os problemas mais graves eram de contrato e de segurança, não de compilação:

1. **Senha do usuário guardada no `sessionStorage`** e reenviada silenciosamente — e, por um bug do backend, a tela
   de perfil que a usava **gravaria a senha em texto puro no banco e bloquearia o login** do usuário.
2. Rotas/métodos errados: contagem de curtidas (`/curtida/count/...` não existe), troca de senha com `POST`
   (o backend usa `PUT` → 405), status de curtida tratado como booleano (a API devolve um objeto → todo conteúdo
   aparecia como "curtido").
3. `GET /usuario/{id}` sempre falhava (500) por um detalhe do controller; todos os autores de posts/comentários
   apareciam como "Usuário #id" e o perfil público nunca carregava corretamente.
4. Tipos de `Endereco` incompatíveis com o DTO atual (migration V20) — cadastro de endereço sempre recebia 400.
5. Administrador podia criar projetos, acessar o feed etc. (contrariando a regra do PitcherX e recebendo 403 do backend).
6. Qualquer usuário via botões de editar/excluir projetos de outras pessoas; projetos criados não registravam dono.
7. Erros de carregamento engolidos (telas mostravam "vazio" quando a API falhava), ausência de proteção de rotas
   centralizada, sem tratamento de sessão expirada, páginas "stub" (editar perfil) e botões sem ação.

**O que foi entregue**

Correção desses pontos, implementação das telas/fluxos que faltavam e que o backend suporta, padronização de
carregamento/erros/estados vazios, acessibilidade, responsividade, ESLint + testes unitários, e testes E2E completos
(contra um *stub de contrato* — o backend real não pôde ser compilado neste ambiente; ver seção F).

---

## B. Erros encontrados e correções

### B.1 Autenticação, sessão e segurança

| Arquivo | Tipo | Causa | Impacto | Correção |
| --- | --- | --- | --- | --- |
| `context/AuthContext.tsx`, `perfil/page.tsx` | Segurança | Senha do login salva em `sessionStorage` (`pitcherx:senha-sessao`) e reutilizada no `PUT /usuario/{id}` | Senha em claro no navegador; com o bug do backend (C.1/G.1) o usuário perderia o acesso | Removido todo armazenamento de senha; chave antiga é apagada no boot. Edição de nome/telefone desativada com aviso (limitação do backend) |
| `lib/api.ts` | Sessão | Tratava só 401, mas o backend **nunca** responde 401 (sem entrypoint: token ausente/expirado → 403) | Sessão expirada deixava telas quebradas/vazias | 403 com token vencido (campo `exp` do JWT) dispara evento de sessão expirada → logout e `/auth/login?expirada=1`; verificação periódica do `exp`; sincronização entre abas (`storage`) |
| `lib/api.ts` | Robustez | Sem timeout, `credentials: "include"` desnecessário, respostas vazias quebravam `response.json()`, mensagens 5xx repassadas | Requisições presas, exceções, vazamento de detalhes | Timeout (20 s; 60 s em upload), `NetworkError`, parse seguro de corpo vazio, mensagens 5xx genéricas, erros de validação por campo (`errors`) exibidos |
| `auth/login/page.tsx` | Segurança/UX | Mostrava a mensagem crua do backend ("Sem usuário com o email informado!") | Enumeração de contas | Mensagem única "E-mail ou senha inválidos."; suporte a `?redirect=` validado contra open redirect; usuário logado é redirecionado; conta desativada é barrada na interface |
| `hook/useRequireAuth.ts` (novo), `components/PageShell.tsx` | Controle de acesso | Cada página fazia (ou não) sua própria checagem; `/auth/completar-cadastro`, `/perfil/editar`, `/mensagens`, `/notificacoes`, `/configuracoes` não tinham proteção | Páginas renderizavam sem sessão; admin acessava áreas de usuário | Guarda central no `PageShell` (`area="usuario"` redireciona admin ao dashboard); loader enquanto a sessão é verificada (sem "piscar" conteúdo) |
| `admin/layout.tsx`, `hook/useRequireAdmin.ts` | Controle de acesso | Retornava `null` (tela em branco) | UX | Loader acessível; `replace` em vez de `push` |
| `perfil/[id]/page.tsx` | XSS | `href={perfil.linkedin}` sem validação | Link `javascript:` cadastrado por um usuário executaria script no clique de outro | `linkExternoSeguro()` (somente http/https) + validação no cadastro |
| `next.config.js` | Segurança | `remotePatterns: hostname "**"` para http e https | Otimizador de imagens do Next como proxy para qualquer host (SSRF/abuso) | Restrito a `images.unsplash.com` (home); imagens de usuários via `<img>`; cabeçalhos `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `poweredByHeader: false` |
| `package.json` | Dependências | `"next": "latest"`, `"react": "latest"`; Next 16.2.10 com avisos críticos do `npm audit` | Builds não reprodutíveis; vulnerabilidades conhecidas | Versões fixadas; Next **16.3.5**; `npm audit` → **0 vulnerabilidades**; removido `framer-motion` (não usado) |

### B.2 Contratos de API

| Arquivo | Problema | Correção |
| --- | --- | --- |
| `services/curtida.service.ts` | `GET /curtida/count/{tipo}/{id}` não existe | `GET /curtida/contar-curtidas/{tipo}/{id}` |
| `services/curtida.service.ts`, `hook/useCurtida.ts`, `PostCard` | `/curtida/status/...` devolve `{ jaCurtiu, quantidadeCurtidas }`; o front tratava como `boolean` (objeto ⇒ sempre "curtido") | `buscarStatusCurtida()` tipado; uma chamada traz status + total; concorrência limitada (`mapComLimite`) |
| `services/usuario.service.ts` | `redefinirSenha` usava `POST` (backend: `PUT`) → 405 | `PUT /usuario/redefinir-senha/{id}` |
| `services/usuario.service.ts` | `GET /usuario/{id}` → 500 (o parâmetro do controller não tem `@PathVariable`) | Envio de `?id={id}` junto do caminho (contorno 100% no front) + cache por página |
| `types/Endereco.ts`, `admin/enderecos` | Campos antigos (`ruaEndereco`, `bairroEndereco`, `numeroEndereco`); DTO atual: `cep`, `uf`, `bairro`, `logradouro`, `complemento` (obrigatório), `numeroCasa` | Tipos e formulários refeitos, CEP só com dígitos (máx. 8), UF por lista |
| `types/Login.ts`, `AuthContext` | Papéis do login (`Set<Role>` → `{idRole,nomeRole}`) e `isActive` | Mapeamento robusto; roles efetivas lidas do token |
| `services/postagem.service.ts` | Feed disparava 2 requisições por post e recarregava o feed inteiro a cada curtida | Uma requisição de status por post, limite de 6 simultâneas, sem recarga após curtir |
| `admin/useDashboardData.ts`, `admin/postagens`, `admin/interacoes` | Curtidas somadas por `likeComentario`/`dislikeComentario`, colunas removidas na migration V17 (sempre nulas ⇒ "0 curtidas" como "dado real") | Curtidas reais via `/curtida/contar-curtidas`; card de "descurtidas" removido (não existe mais no modelo) |
| `admin/dashboardUtils.ts` | `agruparPorMes` só entendia `dd/MM/yyyy`; `dataVinculo` é ISO | `parseDataFlexivel` (ISO e dd/MM/yyyy) — gráfico de conexões passou a funcionar |
| `components/CriarPost.tsx`, `PostCard` | `dataPostagem` com `toLocaleDateString` local; o backend valida `@FutureOrPresent` no fuso do servidor | `dataPostagemHoje()` usa a maior data entre local e UTC (aceita por servidor em UTC ou em Brasília) |
| Contratos | Datas `LocalDateTime` exibidas cruas (`2026-09-22T09:00:00`) | `formatarDataHora`; envio em ISO com segundos |
| `admin/usuarios` | "Alterar role" substituindo a role — o backend **adiciona** a role ao conjunto | Tela passou a "Adicionar perfil", com aviso de irreversibilidade e confirmação reforçada para ADMIN |
| `admin/termos-postagem`, `admin/termos-vinculo` | Formulário de criação/edição para admin; o backend exige `USUARIO`/`EMPRESA` (admin recebe 403) | Tela do admin passou a ser de consulta + exclusão (DELETE permite ADMIN), com explicação |

### B.3 Páginas, fluxos e interface

| Arquivo | Problema | Correção |
| --- | --- | --- |
| `auth/cadastro` | Sem validação de e-mail/senha/confirmação; após cadastro ia ao feed, pulando o perfil | Validação por campo (`aria-invalid` + mensagem), telefone opcional, confirmação de senha; segue para `/auth/completar-cadastro` |
| `auth/completar-cadastro` | Sem proteção de rota; sem validação de CPF/CNPJ e LinkedIn | Protegida; validação de dígitos verificadores; redireciona quem já tem perfil |
| `auth/esqueci-senha` | Etapa "validar código" enganosa: `/usuario/validar-token` responde 204 **mesmo com código errado** | Código + nova senha na mesma etapa; a validação real ocorre em `/resetar-senha` (400 se inválido); botão "Reenviar código" |
| `perfil/editar` | Página vazia (só um botão "voltar") | Edição do perfil profissional (POST/PUT `/perfil-usuario`) e do endereço (POST/PUT/DELETE `/endereco`) |
| `perfil/[id]` | Estatísticas falsas ("1 especialidade", "1 link externo") | Contagens reais (publicações, projetos vinculados), lista de projetos e publicações do usuário |
| `projetos` | Admin podia criar; projeto criado sem dono | Área exclusiva de usuário; ao criar, registra vínculo **CRIADOR**; filtro "Meus projetos"; busca |
| `projetos/[id]` | Editar/excluir/gerenciar equipe visível para qualquer usuário; membro só por ID numérico; duplicidade gerava 500 | Permissões por vínculo CRIADOR (admin: só excluir); seleção de pessoas pelos perfis; checagem local de duplicidade; curtir projeto; aviso da regra de data do backend |
| `contratos`, `contratos/[id]` | Só admin criava contratos, embora o backend permita USUARIO; datas cruas; `?projetoId` reabria o formulário a cada recarga | Dono do projeto também cria/edita; termos do contrato exibidos; formulário único (`FormContrato`) |
| `propostas` | Erros de carregamento engolidos; valor aceitava "1.2.3"; texto sugeria vínculo com projeto inexistente | Estados de erro, validação monetária (pt-BR), aviso honesto de que a API não guarda autor/projeto |
| `PostCard` | Botão "⋯" sem ação; "Salvar" apenas local (sumia ao recarregar); editar/excluir inexistentes | Menu com editar (autor) e excluir (autor/admin); "Salvar" fictício removido; compartilhar via Web Share/clipboard |
| `ComentarioCard` | Sem edição; admin via campo de resposta (backend recusa com 403) | Edição do próprio comentário (PUT); admin só modera |
| `comentarios/[postagemId]` | Só listava comentários (sem a publicação); sem 404 | Mostra a publicação completa, comentários, estado "não encontrada" |
| `Sidebar`, `MobileNav` | Item "Criar" duplicava "Início"; avatar fixo; no celular não havia acesso a Propostas/Contratos/Configurações/Sair; admin sem acesso às seções no celular | Navegação unificada (`navegacao.ts`), foto real, menu "Mais" no celular (com Esc, foco e `aria-*`), itens sem backend marcados "Em breve" |
| `mensagens`, `notificacoes` | Texto "ainda nao existe"; admin via essas telas | Estados vazios claros sobre a limitação do servidor; área de usuário |
| `tipos-projeto` | Erro engolido; "voltar" levava admin para `/projetos` | Estados de erro, rótulos acessíveis, retorno correto |
| Admin (áreas, subáreas, especialidades, termos, endereços, projetos, postagens) | `console.error` + lista vazia em caso de erro; `alert`/`confirm` nativos; `Área #[object Object]` em subáreas | Alertas de erro com "Tentar novamente", toasts e diálogo de confirmação acessível, textos corrigidos |
| `layout.tsx` | `lang="en"` | `lang="pt-BR"`; `FeedbackProvider` global; `not-found.tsx` e `error.tsx` em português |
| Home | Visitante logado via "Entrar/Criar conta" | Botão "Ir para a plataforma" quando há sessão |
| `tsconfig.json` | `strict: false` | `strict: true` (0 erros) |

---

## C. Funcionalidades corrigidas

1. **Curtidas** (posts, comentários, projetos): rota de contagem, leitura do status, atualização otimista com reversão.
2. **Autores e perfis públicos**: `GET /usuario/{id}` passou a funcionar (contorno `?id=`); fotos reais nos cards.
3. **Troca de senha** (`PUT`), **recuperação de senha** (fluxo coerente com o backend).
4. **Endereços** (usuário e admin) compatíveis com o DTO da migration V20.
5. **Dashboard/Interações admin**: curtidas reais, gráfico de conexões, datas formatadas.
6. **Sessão**: expiração, logout completo (token + cache), sincronização entre abas, redirecionamento pós-login.
7. **Permissões na interface**: admin sem feed/criação de posts/projetos; donos de projeto identificados.
8. **Estados de carregamento/erro/vazio** em todas as listas e detalhes.

## D. Funcionalidades implementadas (suportadas pelo backend)

| Funcionalidade | Endpoints usados |
| --- | --- |
| Editar e excluir publicação (autor) / excluir (admin) | `PUT`/`DELETE /postagem/{id}` |
| Editar comentário próprio | `PUT /comentario/{id}` |
| Página da publicação (link compartilhado) | `GET /postagem/{id}` + comentários |
| Perfil profissional (criar/editar) | `POST`/`PUT /perfil-usuario` |
| Endereço do usuário | `POST`/`PUT`/`DELETE /endereco` |
| Remover foto de perfil | `DELETE /usuario/{id}/foto` |
| Dono do projeto (vínculo CRIADOR automático) e "Meus projetos" | `POST /projeto-usuario`, `GET /projeto-usuario/usuario/{id}` |
| Curtir projeto | `/curtida/...` com tipo PROJETO |
| Contratos pelo dono do projeto + termos no detalhe | `/contrato`, `GET /termo` |
| Admin: filtros de usuários, "adicionar perfil" com confirmação | `GET /usuario`, `POST /usuario/alterar-role/...` |
| Busca/filtros (feed, projetos, contratos, propostas, explorar por especialidade/tipo) e "Carregar mais" | listagens existentes (a API não pagina) |
| Validações de CPF/CNPJ, e-mail, telefone, datas (regras dos DTOs), valores monetários | — (cliente) |
| Diálogo de confirmação e notificações acessíveis (substituem `alert`/`confirm`) | — |

---

## E. Compatibilidade com o backend

**Verificados endpoint a endpoint** (método, caminho, corpo, resposta, `@PreAuthorize`): `usuario` (login, cadastro,
busca, listagem, foto, senha, recuperação, ativação, roles, exclusão), `postagem`, `comentario`, `sub-comentario`,
`curtida`, `projeto`, `projeto-usuario`, `tipo-projeto`, `perfil-usuario`, `especialidade`, `area`, `subarea`,
`endereco`, `contrato`, `termo`, `termo-postagem`, `termo-vinculo`, `proposta`, `contra-proposta`.

Regras do servidor que a interface agora respeita:

- Toda rota exige token, exceto login, cadastro e recuperação de senha; sem token/expirado ⇒ 403.
- `POST/PUT` de postagem, comentário, subcomentário, projeto e contraproposta: somente USUARIO/EMPRESA.
- Área, subárea, especialidade, tipo de projeto, termo de contrato: somente ADMIN.
- Datas: `dd/MM/yyyy` em postagem/projeto (com `@FutureOrPresent`/`@Future`), ISO em contrato.
- IDs fixos criados pelo `DataInitializer` (roles, tipos de vínculo, tipos de conteúdo) centralizados em constantes.

Incompatibilidades corrigidas **somente no front**: todas as listadas em B.2.

---

## F. Testes executados

| Comando | Resultado |
| --- | --- |
| `npx tsc --noEmit` (modo strict) | ✅ 0 erros |
| `npx eslint .` (config nova: `eslint-config-next` core-web-vitals + typescript) | ✅ 0 erros, 27 avisos (todos `react-hooks/set-state-in-effect`, ver abaixo) |
| `npx vitest run` | ✅ 4 arquivos, **27 testes** aprovados (lib/api, datas, validações, URLs, contratos dos serviços) |
| `npx next build` (Next 16.3.5) | ✅ 35 rotas + 404 geradas |
| `npm audit` | ✅ 0 vulnerabilidades |
| E2E Playwright (Chromium) contra **stub de contrato** | ✅ **77/77 verificações**, 0 erros de console/página |

**Sobre o teste E2E:** o backend real **não pôde ser executado** aqui: exige Java 25 (o ambiente tem JDK 21),
o Maven Central e o site da Adoptium estão bloqueados pelo proxy (HTTP 403) e não há daemon Docker. Para não
declarar integrações não testadas, foi escrito um *stub* HTTP que reproduz o contrato lido no código Java
(rotas, validações dos DTOs, `@PreAuthorize`, 403 sem token, 500 do `GET /usuario/{id}` sem `?id`, formato de erros,
restrição única de vínculos, bug do `PUT /usuario`). O stub é ferramenta de teste e **não faz parte da entrega**.

Cenários cobertos no E2E: redirecionamentos de rotas protegidas; login válido/inválido; cadastro inválido/válido;
completar cadastro (CPF inválido, link perigoso); publicação (vazia/válida), curtida persistida após recarregar,
comentário, resposta, edição; página compartilhada e 404; projeto (data retroativa bloqueada, criação, vínculo
CRIADOR, permissões); contrato criado a partir do projeto; proposta (valor inválido/válido) e contraproposta;
upload de foto; perfil profissional e endereço; explorar; troca de senha (errada/certa) e login com a nova; logout
(token removido e **nenhuma senha no storage**); recuperação de senha (código inválido/válido); sessão expirada;
admin (dashboard, bloqueio de feed/projetos/propostas/mensagens, criação de especialidade e tipo, desativação de
usuário com confirmação, conta desativada barrada, moderação, projeto sem botão Editar); varredura de **todas as
rotas** para público, usuário e admin em **390 px, 768 px e 1440 px** sem rolagem horizontal.

**Não executado / pendente:** integração com o backend real (motivo acima); envio real de e-mail (SMTP); upload
real para o disco do servidor; testes em Safari/Firefox e leitores de tela reais.

**Avisos do ESLint mantidos como aviso:** a regra `react-hooks/set-state-in-effect` (React Compiler) sinaliza o padrão
"buscar dados ao montar" (`useEffect(() => carregar())`). Não é erro de funcionamento; foi configurada como *warn*
(e não desligada) e documentada em `eslint.config.mjs`. Migrar para uma biblioteca de dados (ex.: TanStack Query)
eliminaria os avisos, mas seria uma mudança de arquitetura fora do escopo.

---

## G. Problemas pendentes (dependem do backend ou de condições externas)

Nenhum destes foi "resolvido" com simulação no front. Onde possível, a interface contorna ou avisa.

### G.1 Críticos

1. **`PUT /usuario/{id}` grava a senha em texto puro.** `UsuarioService.atualizarUsuario` gera o hash e depois
   `usuarioMapper.updateFromDTO` copia `senhaUsuario` (texto) por cima. Resultado: o usuário não consegue mais
   entrar. *Front:* a edição de nome/telefone foi desativada com aviso. *Correção no servidor:* ignorar `senhaUsuario`
   no `updateFromDTO` (ou usar o `UsuarioUpdateDTO` já existente, hoje sem uso).
2. **Segredo do JWT fixo no código** (`TokenConfig.secretKey = "secretKey"`): qualquer pessoa pode forjar tokens,
   inclusive de ADMIN. *Servidor:* segredo por variável de ambiente e rotação.
3. **Falta de verificação de dono (IDOR)** em praticamente todos os recursos: o `usuarioId` vem do corpo/caminho e
   não é comparado ao usuário do token (postar/comentar/curtir em nome de outro; editar/excluir projetos, postagens,
   comentários, propostas, endereços e fotos de terceiros). *Front:* esconde ações de quem não é dono, mas isso **não
   é proteção**. *Servidor:* usar o principal autenticado e checar propriedade.

### G.2 Importantes

4. `GET /usuario/{id}` sem `@PathVariable` (contornado com `?id=`).
5. Login não verifica `active`; o `SecurityFilter` também não. Contas desativadas continuam com acesso à API
   (a interface bloqueia apenas a entrada pela tela).
6. `POST /usuario/validar-token` sempre responde 204 (resultado descartado).
7. `POST /usuario/esqueci-senha` com e-mail inexistente ⇒ 500 (RuntimeException).
8. Exposição de dados a qualquer usuário autenticado: `GET /perfil-usuario` (inclui CPF/CNPJ), `GET /endereco`
   (todos os endereços), contratos e propostas de todos. A interface não exibe CPF/CNPJ e avisa sobre endereços.
9. `alterar-role` apenas **adiciona** roles; não há como remover (nem rebaixar um ADMIN).
10. Contrato: `@PreAuthorize` cita a role inexistente `EMPRESARIO` — contas apenas EMPRESA recebem 403.
11. `POST /perfil-usuario` permite só ADMIN/USUARIO — contas apenas EMPRESA não criam perfil profissional.
12. Termos de postagem/vínculo: criação/edição só para USUARIO/EMPRESA (o admin não consegue cadastrá-los).
13. Checagem de vínculo duplicado em `ProjetoUsuarioService` com parâmetros invertidos ⇒ 500 na restrição única
    (o front confere antes de enviar).
14. `IllegalStateException` não tratada no `GlobalExceptionHandler` ⇒ 500 genérico (curtida duplicada, exclusões
    com registros vinculados, usuário com curtidas não pode ser excluído).
15. Edição de projeto/postagem exige data de início ≥ hoje (`@FutureOrPresent` também no PUT): projetos já iniciados
    não podem ser editados sem mudar a data; posts editados passam a ter a data do dia.
16. Sem 401 (tudo é 403), o que impede distinguir "sessão expirada" de "sem permissão" sem ler o token.

### G.3 Funcionalidades inexistentes no servidor

17. Mensagens e notificações (telas informam a ausência).
18. Imagem de postagem: aceita no POST, mas não devolvida em `PostagemResponseDTO`.
19. Proposta sem autor e sem projeto; contrato sem campo para ativar/encerrar (`active` não está no request).
20. Projeto sem dono no modelo (o front usa o vínculo CRIADOR); `StatusProjeto` sem endpoints.
21. Sem paginação no servidor: todas as listagens devolvem a tabela inteira (o front filtra e pagina no cliente com
    "Carregar mais"; `/projeto/buscar` filtra só projetos e não pagina). Em bases grandes isso pesará na rede.
22. Sem endpoints para listar roles, tipos de vínculo e tipos de conteúdo (IDs fixos conforme o `DataInitializer`).
23. Sem "salvar publicação" (o botão fictício foi removido).

---

## H. Integridade do back-end

Verificação feita por hash, não por declaração:

- Antes de qualquer alteração, o backend extraído foi colocado em somente leitura (`chmod -R a-w`) e foram
  calculados os SHA-256 dos **403 arquivos** extraídos.
- Ao final, os hashes foram recalculados e comparados (`diff`): **idênticos**. Também foram comparados com uma
  nova extração do ZIP original: **idênticos**.
- SHA-256 do ZIP do backend recebido: `09fa11de92dd38e23882a3c88d9927576411b3afd96f40b4879f4327dc03df44`.
- O ZIP entregue contém **apenas o front-end**.

---

## I. Instruções de execução

```bash
# 1. dependências
npm ci
# 2. ambiente
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8080
# 3. desenvolvimento
npm run dev                        # http://localhost:3000
#    produção
npm run build && npm run start
# 5. verificações
npm run typecheck && npm run lint && npm run test
npm run check                      # tudo + build
```

**Conectar ao backend original:** no `.env` do backend, defina `FRONTEND_URL_1=http://localhost:3000` (CORS),
além de banco, `UPLOAD_*` e `MAIL_*`. Em um banco novo, o `DataInitializer` cria roles, tipos de vínculo, tipos de
conteúdo e o admin `adm@gmail.com` / `adm1234567`. Antes do primeiro projeto, o admin deve cadastrar ao menos um
**tipo de projeto** e, para o perfil profissional, ao menos uma **especialidade**.

---

## Inventário de rotas

| Rota | Acesso | Situação |
| --- | --- | --- |
| `/` | público | ✅ (CTA muda para "Ir para a plataforma" com sessão) |
| `/auth/login`, `/auth/cadastro`, `/auth/esqueci-senha` | público | ✅ corrigidas |
| `/auth/completar-cadastro` | usuário | ✅ protegida + validação |
| `/feed` | usuário (admin → `/admin`) | ✅ |
| `/explorar` | autenticado | ✅ filtros |
| `/projetos`, `/projetos/[id]` | usuário / autenticado | ✅ permissões por CRIADOR |
| `/propostas`, `/propostas/[id]` | usuário | ✅ |
| `/contratos`, `/contratos/[id]` | autenticado | ✅ dono do projeto ou admin gerencia |
| `/comentarios`, `/comentarios/[postagemId]` | autenticado | ✅ (índice redireciona ao feed) |
| `/perfil`, `/perfil/editar`, `/perfil/[id]` | autenticado | ✅ (`/perfil/editar` implementada) |
| `/configuracoes` | autenticado | ✅ |
| `/mensagens`, `/notificacoes` | usuário | ⚠️ sem backend — informativo |
| `/tipos-projeto` | autenticado (edição admin) | ✅ |
| `/admin` (+ 12 seções) | admin | ✅ |
| 404 | — | ✅ página em português |
