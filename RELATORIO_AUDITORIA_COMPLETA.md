# Relatório da auditoria completa do PitcherX

Data: 15/11/2026 · Branch: `ccr-a5f9293f-rk9vaf`
Backend: `PitcherX-BackEnd-main_9.zip` (conferido arquivo a arquivo com a pasta `back-end/`: 495 arquivos idênticos antes das correções).

Status usados: **APROVADO** (funcionou no teste), **CORRIGIDO** (tinha defeito, foi corrigido e testado de novo),
**REPROVADO** (continua com problema), **NÃO TESTADO** (não foi possível testar neste ambiente).

## Como foi testado

Os dois servidores rodaram de verdade durante toda a auditoria, sem nenhuma resposta simulada:

| Peça | Como rodou |
| --- | --- |
| Banco | PostgreSQL 16 local, banco novo e vazio, criado só para a auditoria. Nenhum dado existente foi apagado. |
| Backend | `mvn package` → `java -jar target/pitcherx-0.0.1-SNAPSHOT.jar`, porta 8080, todas as migrações do Flyway aplicadas no início |
| Front | `npm run build` → `next start`, porta 3000, com o proxy `/backend` apontando para a porta 8080 |
| E-mail | SMTP de teste local que grava as mensagens num arquivo. Os códigos de verificação e de redefinição de senha foram lidos desse arquivo. |
| Navegador | Chromium com Playwright: computador (1366×900), tablet (768×1024) e celular (iPhone 13) |

Os roteiros estão em `e2e/` (veja `e2e/README.md`). Eles leem as credenciais do administrador de variáveis de ambiente, então nenhuma senha ou token ficou gravado no repositório.

---

## 1. Páginas analisadas

**49 rotas distintas**: as 48 páginas do app e mais a página 404. Somando quatro perfis de acesso e três tamanhos de tela, foram **198 aberturas de página**.

| Perfil | Páginas |
| --- | --- |
| Visitante | `/`, `/como-funciona`, `/auth/login`, `/auth/cadastro`, `/auth/esqueci-senha`, rota inexistente (404) |
| Administrador | `/admin` (painel) e as 18 telas de administração (usuários, identidades, denúncias, perfis, projetos, solicitações, postagens, propostas, interações, tipos de projeto, riscos, áreas, subáreas, especialidades, endereços, termos, termos de postagem, termos de vínculo), além de contratos, projeto, notificações, configurações, perfil, termos e tipos de projeto |
| Usuário (investidor) | feed, explorar, projetos, projeto, propostas, proposta, contratos, contrato, solicitações, conexões, notificações, mensagens, denúncias, perfil, editar perfil, perfil de outra pessoa, publicação, comentários (lista e por publicação), configurações, termos, tipos de projeto, completar cadastro, verificar conta |
| Usuário (dono do projeto) | feed, projeto, propostas, proposta, contratos, contrato, perfil, perfil de outra pessoa |

Cada abertura procurou erros de execução no console, respostas HTTP de erro inesperadas, imagens internas quebradas e rolagem horizontal.
Resultado: **198/198 sem nenhum desses problemas** — **APROVADO**.

## 2. Endpoints identificados e testados

- **176 endpoints** identificados nos controllers (método + caminho).
- **176/176 chamados** pelo roteiro de API, com **252 verificações** de resposta, regra de negócio, persistência no banco e permissão: **252 aprovadas, 0 reprovadas**.
- O log do backend no fim da bateria tem **0 "Erro interno não tratado"** e **0 linhas de nível ERROR**. Os avisos que aparecem são as recusas provocadas de propósito pelos testes (403, senha errada, conta não ativada, validação).

| Grupo | Verificações |
| --- | --- |
| Cadastro e autenticação | 30 |
| Usuário e perfil | 32 |
| Catálogos e administração | 30 |
| Projetos | 30 |
| Propostas e contrapropostas | 40 |
| Publicações, curtidas e comentários | 22 |
| Conexões e notificações | 11 |
| Denúncias e moderação | 9 |
| Demais endpoints (leitura, edição e exclusão) | 44 |
| Sessão e conta desativada | 4 |
| **Total** | **252** |

## 3. Funcionalidades testadas

Todas foram testadas com operação real: requisição → resposta → banco → recarregar e conferir.

| Funcionalidade | O que foi testado | Status |
| --- | --- | --- |
| Cadastro | Campos vazios, inválidos, e-mail duplicado, cadastro válido, código de verificação por e-mail | APROVADO |
| Aprovação de identidade | Admin aprova e reprova, e-mail enviado ao usuário | CORRIGIDO |
| Login / logout | Senha errada, login, sessão persiste ao recarregar, logout remove o token | APROVADO |
| Recuperação e redefinição de senha | E-mail com código, código inválido, redefinir pela tela e entrar com a nova senha | CORRIGIDO |
| Trocar senha | Pela tela de configurações, login com a senha nova | APROVADO |
| Dados da conta | Nome, e-mail e telefone com confirmação da senha atual; senha errada é recusada | CORRIGIDO |
| Perfil | Foto, capa (banner), biografia e especialidade; perfil de outra pessoa sem botão de editar | CORRIGIDO |
| Projetos | Criar, editar, excluir, ver, validação de meta e valor, acesso sem permissão | CORRIGIDO |
| Termos de vínculo e solicitações | Aceitar termos, pedir participação, aprovar e rejeitar | CORRIGIDO |
| Propostas | Enviar, editar, excluir, aceitar, recusar, regras de duplicidade e de valor | CORRIGIDO |
| Contrapropostas | Criar, rejeitar com justificativa, nova contraproposta, aceitar (valor atualizado) | CORRIGIDO |
| Contratos | Criar, editar, aceitar (só a parte certa), bloqueio de edição após aceite | CORRIGIDO |
| Feed e publicações | Publicar, editar, excluir, curtir, descurtir, comentar, responder comentário | CORRIGIDO |
| Exploração e busca | Buscar pessoas e projetos, recomendações | CORRIGIDO |
| Conexões | Pedir para seguir, aceitar pela notificação, seguidores e seguindo | APROVADO |
| Notificações | Listagem, marcar como lida, ação a partir da notificação | APROVADO |
| Denúncias | Denunciar com e sem motivo, moderação pelo admin | CORRIGIDO |
| Configurações | Trocar senha, link para os dados da conta | APROVADO |
| Painel admin | Painel e as 18 telas de cadastro/moderação, cadastro de área e de termo de postagem pela tela | CORRIGIDO |
| Excluir / desativar conta | Exclusão da própria conta, conta com conteúdo, desativação e reativação pelo admin | CORRIGIDO |
| Mensagens | A página existe, mas o backend não tem esse recurso (ver item 7) | REPROVADO |
| Layout em computador, tablet e celular | Rolagem horizontal, elementos visíveis, fluxo de negociação no celular | APROVADO |

## 4. Erros encontrados

Foram **40 defeitos** no total: 32 no backend e 8 no front.

### Backend: execução e banco

1. O JAR não iniciava porque o método `main` não era `public`.
2. A migração V7 usava o tipo `DOUBLE`, que não existe no PostgreSQL, e o Flyway falhava num banco vazio.
3. A coluna `denuncia.motivo` era `NOT NULL` no banco, mas opcional na API. Denunciar sem motivo dava erro.
4. `GET /projeto/{id}` usava a expressão `authenticated()`, que é inválida. Abrir qualquer projeto respondia 400, até para o criador.
5. Em `GET /usuario/{id}` faltava `@PathVariable`, então a busca de usuário por id não funcionava.
6. A biografia existia na tabela, mas a API não aceitava nem devolvia o campo. Além disso, o mapeamento `@Lob` gravava um OID e quebrava a leitura de perfis.
7. Os e-mails de aprovação e reprovação de identidade usavam templates que não existiam.

### Backend: segurança e permissões

8. Qualquer usuário logado podia editar ou excluir publicações, comentários, respostas, curtidas, endereços, perfis, projetos, termos de vínculo e contratos de outras pessoas.
9. O endereço completo de todos os usuários era público.
10. O telefone e o link do **comprovante de identidade** de qualquer usuário eram devolvidos para qualquer pessoa logada.
11. Segredo JWT fixo no código, validade de 365 dias, e um token de conta desativada continuava valendo.
12. Termos de postagem estavam com a permissão invertida: o admin recebia 403 e usuários comuns criavam e alteravam.
13. `PUT /usuario/{id}` alterava e-mail sem confirmar a senha atual e podia sobrescrever a senha e a foto com valores vazios.
14. Era possível transferir o dono de um perfil para outra pessoa.
15. A solicitação de vínculo usava o id do criador enviado pelo cliente, o que permitia agir como outra pessoa.
16. Contratos exigiam o papel `EMPRESARIO`, que não existe (o certo é `EMPRESA`), e contas de empresa ficavam bloqueadas.

### Backend: regras de negócio

17. As respostas de proposta vinham sem `idProposta` e sem `projetoId`, porque o mapper ignorava esses campos.
18. Era possível fazer proposta no próprio projeto, com valor negativo, ou repetir propostas abertas no mesmo projeto.
19. Era possível aceitar uma proposta com contraproposta pendente, editar proposta já decidida, mudá-la de projeto e excluir proposta aceita.
20. Era possível fazer contraproposta em proposta já decidida ou abrir duas pendentes ao mesmo tempo.
21. A justificativa da decisão da contraproposta não era salva.
22. Aceitar uma contraproposta não atualizava o valor da proposta.
23. Qualquer pessoa podia aceitar um contrato. Também era possível editar contrato já aceito, usar datas inválidas e criar contrato pendente duplicado.
24. Era possível criar projeto com meta zero ou negativa e com valor negativo.
25. Cada visualização de projeto criava uma interação nova em vez de atualizar a existente.
26. O título do termo de vínculo era único no sistema inteiro: dois projetos não podiam ter um termo com o mesmo nome.
27. Era possível rejeitar uma solicitação já aprovada, e a rejeição enviava o e-mail de aprovação.
28. Uma falha no envio de e-mail derrubava o cadastro e a decisão de solicitação com erro 500.
29. A validação do código de redefinição de senha respondia "válido" para código inválido e só conferia o primeiro token. Um e-mail inexistente era revelado.
30. Recomendações de projetos davam erro para quem ainda não tinha perfil.
31. Excluir a conta dava erro 500 por causa das chaves estrangeiras de notificações, curtidas, conexões e outras.
32. Atualizar o perfil sem enviar capa, vídeo ou biografia apagava esses campos.

### Front-end

33. O cadastro de termos simples (CRUD do admin) bloqueava o próprio administrador.
34. A busca de usuário por id chamava a rota errada.
35. Não havia tela para editar nome, e-mail e telefone da conta.
36. Não havia campo de biografia no perfil.
37. O botão "Aceitar contrato" aparecia para quem não podia aceitar. Contrato aceito ainda mostrava "Editar". Contas EMPRESA não podiam gerenciar contratos.
38. Depois de aceitar uma contraproposta, o valor da proposta não mudava na tela, e a justificativa da decisão não aparecia.
39. A autoria das propostas dependia do navegador (localStorage) e de um bloco de texto na descrição, em vez de vir do servidor.
40. As recomendações faziam uma checagem prévia de perfil que escondia o resultado.

## 5. Erros corrigidos

**Todos os 40 itens acima foram CORRIGIDOS e testados de novo** com os três roteiros, que passaram por completo depois das correções.

| Área | Principais mudanças |
| --- | --- |
| Backend: execução | `PitcherxApplication` (`public static void main`), `V7` com `DOUBLE PRECISION`, `ProjetoController` com `isAuthenticated()`, `UsuarioController` com `@PathVariable` |
| Backend: banco | Migrações novas: `V43` (motivo da denúncia opcional), `V44` (justificativa da decisão da contraproposta), `V45` (título do termo de vínculo único por projeto). A biografia passou a ser `TEXT`, sem `@Lob`. |
| Backend: permissões | Novo componente `security/Permissoes` (usuário do token, admin, dono), aplicado nos serviços de postagem, comentário, subcomentário, curtida, endereço, perfil, projeto, termo de vínculo, contrato, contraproposta, proposta e usuário. Recusas respondem 403. |
| Backend: dados pessoais | Para quem não é o dono nem admin: endereço mostra só a UF, e telefone, comprovante e tentativas de identidade vêm ocultos |
| Backend: sessão | `JWT_SECRET` lido do ambiente, validade de 7 dias, `SecurityFilter` ignora token de conta inexistente ou desativada |
| Backend: regras | Validações de proposta, contraproposta, contrato, projeto e solicitação. Exclusão de conta limpa os vínculos ou responde 400 com explicação. E-mails não derrubam a operação (a falha fica registrada no log). |
| Backend: DTOs e mappers | `PropostaMapper`/`PropostaResponseDTO` (id, projeto, autor), `ContratoMapper` (id da proposta), `UsuarioMapper` (não sobrescreve senha nem foto), DTOs de perfil com biografia, contraproposta com justificativa |
| Backend: templates | `identidade-aprovada.html` e `identidade-reprovada.html` |
| Front | `DadosConta` (nome, e-mail e telefone com confirmação da senha), biografia no perfil, contratos (quem pode aceitar e editar), propostas (autor vindo do servidor, valor atualizado após contraproposta, justificativa), CRUD do admin, `usuario.service`, recomendações |

A arquitetura existente foi mantida: nenhum recurso foi removido e nenhum endpoint mudou de caminho.

## 6. Funcionalidades funcionando

Estas funcionalidades passaram nos testes reais (status APROVADO ou CORRIGIDO no item 3):

cadastro com verificação por e-mail, aprovação de identidade, login, logout, sessão, recuperação e redefinição de senha, troca de senha, dados da conta, perfil (foto, capa, biografia, especialidade), projetos (CRUD e permissões), termos de vínculo, solicitações de participação, propostas, contrapropostas, contratos, feed, publicações, curtidas, comentários e respostas, exploração e busca, recomendações, conexões, notificações, denúncias e moderação, configurações, painel admin e as 18 telas de administração, exclusão e desativação de conta, e layout em computador, tablet e celular.

## 7. Funcionalidades com problemas

| Item | Situação | Status |
| --- | --- | --- |
| Mensagens | O backend não tem entidade nem endpoints de mensagens. A página informa isso de forma honesta e não simula conversas. Para funcionar, é preciso criar o recurso no backend. | REPROVADO |
| CPF/CNPJ no perfil | O identificador do perfil continua visível em `GET /perfil-usuario` para usuários logados. Não foi ocultado nesta auditoria porque é preciso decidir quem pode ver esse dado (dono, admin, parceiros do projeto). | REPROVADO |
| Login revela se o e-mail existe | Responde 404 para e-mail desconhecido e 400 para senha errada | REPROVADO |
| Código de redefinição sem limite de tentativas | O código tem 6 dígitos e não há limite de tentativas nem de requisições | REPROVADO |
| Comprovante de conta nova | Uma conta ainda inativa não consegue enviar o próprio comprovante de identidade, e o envio precisa ser feito pelo admin | REPROVADO |
| Imagens externas (Unsplash) | O host não é acessível pela rede deste ambiente | NÃO TESTADO |

## 8. Problemas de integração

| Integração | Situação | Status |
| --- | --- | --- |
| Proposta sem id e sem projeto na resposta | O front precisava descobrir os ids por tentativa. O mapper foi corrigido e o front usa os ids direto (a reconstrução continua só como reserva para respostas antigas). | CORRIGIDO |
| Autor da proposta | Agora vem do servidor (`usuarioId`, `usuarioNome`) | CORRIGIDO |
| Papel `EMPRESARIO` × `EMPRESA` | O backend e o front agora usam `EMPRESA` | CORRIGIDO |
| Termos de postagem (permissão invertida) | O backend e o CRUD do admin foram corrigidos juntos | CORRIGIDO |
| Edição da conta × token | O token identifica o usuário pelo e-mail. Quando o e-mail muda, o front entra de novo automaticamente com o novo e-mail. | CORRIGIDO |
| Proxy `/backend` do Next | Todas as chamadas do navegador passaram pelo proxy sem erro | APROVADO |
| Upload de foto, capa e comprovante | Arquivo enviado, URL salva no banco e imagem exibida após recarregar | APROVADO |

## 9. Resultado dos testes automatizados

| Teste | Resultado | Status |
| --- | --- | --- |
| API ponta a ponta (`e2e/api_auditoria.py`) | 252/252 verificações, 176/176 endpoints | APROVADO |
| Navegador: páginas (`e2e/navegador_auditoria.js`) | 198/198 aberturas sem erros (49 rotas × perfis × 3 tamanhos) | APROVADO |
| Navegador: fluxos (`e2e/navegador_auditoria.js`) | 33/33 aprovados, 1 não testado (imagens do Unsplash) | APROVADO |
| Negociação no navegador (`e2e/negociacao_navegador.js`) | 47/47. Os únicos HTTP 400 foram os provocados de propósito: e-mail duplicado e login de conta inativa. | APROVADO |
| Front: testes unitários (vitest) | 113/113 | APROVADO |
| Front: TypeScript (`tsc --noEmit`) | 0 erros | APROVADO |
| Front: ESLint | 0 erros. Os 44 avisos já existiam antes da auditoria; nenhum aviso novo. | APROVADO |
| Backend: `mvn test` | 24 testes, 0 falhas e 0 erros (19 que já existiam e 5 novos em `PermissoesTest`) | APROVADO |
| Flyway | 45 migrações aplicadas num banco vazio | APROVADO |

## 10. Build do front e do backend

| Build | Resultado | Status |
| --- | --- | --- |
| Front: `npm run build` (Next.js 16.3.5) | Compilado, 45 páginas estáticas geradas, sem erros | APROVADO |
| Backend: `mvn package` | JAR gerado e iniciado com `java -jar` | CORRIGIDO (antes não iniciava) |
| Servidores durante os testes | O backend (8080) e o front (3000) ficaram no ar o tempo todo. No fim, o terminal do front não tem erros e o log do backend não tem nenhuma linha ERROR. | APROVADO |

## 11. Problemas que dependem de configurações externas

| Item | O que fazer | Status |
| --- | --- | --- |
| `JWT_SECRET` | Definir como variável de ambiente do sistema em produção. Sem ela, o backend usa um segredo de desenvolvimento e mostra um aviso no log (veja `.env-exemple`). | NÃO TESTADO em produção |
| SMTP real | Os e-mails foram testados com um SMTP local de teste. A entrega por um provedor real depende das credenciais de e-mail do servidor. | NÃO TESTADO |
| Remetente dos e-mails | O endereço do remetente está fixo no `EmailService`. Ele precisa ser o mesmo da conta SMTP usada em produção. | NÃO TESTADO |
| Migrações num banco com dados | Testadas apenas num banco vazio. Antes de aplicar em produção, faça backup e rode `V43`, `V44` e `V45` numa cópia (a `V45` troca a restrição única do título do termo de vínculo). | NÃO TESTADO |
| Imagens do Unsplash | Dependem do acesso à internet do servidor e do navegador | NÃO TESTADO |
| `BACKEND_URL` do front | Precisa apontar para o backend no ambiente de publicação | APROVADO (testado localmente) |
