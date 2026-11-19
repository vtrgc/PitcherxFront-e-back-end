# Auditoria completa do frontend — PitcherX

Data: 19/11/2026 · Branch `ccr-a5f9293f-rk9vaf`

Esta auditoria alterou **somente o frontend**. A pasta `back-end/` está idêntica à do início da
auditoria: o hash da árvore é o mesmo (`9f9639cc…`) e não há nenhuma mudança local nela.

Cada funcionalidade recebeu um destes status:

| Status | Significado |
| --- | --- |
| **FUNCIONANDO** | Passou nos testes reais sem precisar de mudança. |
| **CORRIGIDO** | Tinha defeito, foi corrigido no front e passou nos testes depois da correção. |
| **COM ERRO** | Tem defeito que depende do backend para ser corrigido. |
| **NÃO IMPLEMENTADO** | Não existe no backend nem no front. |
| **BLOQUEADO POR DEPENDÊNCIA EXTERNA** | Depende de um serviço que este ambiente não alcança. |

## Como foi testado

Os testes usaram o sistema real, sem dados falsos:

- Backend Spring Boot real, com PostgreSQL 16 e um servidor SMTP local de teste que grava os e-mails para o teste ler os códigos.
- Front em build de produção (`next build` + `next start`), chamando o backend pelo proxy `/backend`.
- As pessoas de teste são criadas na hora, com e-mails aleatórios: criadora, investidora, empresa, terceiros e o admin. Nada que já existia no banco foi apagado.

Ferramentas:

| Roteiro / checagem | O que faz |
| --- | --- |
| `e2e/auditoria_funcional.js` (novo) | 86 verificações pela tela: autenticação, feed, perfil, administração, projetos e estados de erro |
| `e2e/navegador_auditoria.js` | Abre as 48 páginas com quatro tipos de pessoa e procura erros, respostas HTTP de erro, imagens quebradas, rolagem horizontal, texto/botão fora da tela e ícone espremido. Depois executa os fluxos principais pela tela |
| `e2e/negociacao_navegador.js` | Cadastro, aprovação, código no primeiro acesso, projeto, proposta, contrapropostas e contrato |
| `e2e/mensagens_navegador.js` | Mensagens entre duas pessoas em navegadores separados |
| `e2e/api_auditoria.py` | Os 187 endpoints, para confirmar que o front e o backend continuam integrados |
| vitest, `tsc --noEmit`, ESLint, `next build` | Checagens estáticas e testes unitários |
| Revisão visual | Capturas de todas as páginas a 360px, examinadas uma a uma |

## 1. Páginas testadas

Todas as **48 páginas** do app, mais a página 404. Cada uma foi aberta com o perfil de pessoa que
tem acesso a ela, nos 6 tamanhos de tela (396 aberturas no total).

| Grupo | Páginas |
| --- | --- |
| Públicas (7 + 404) | `/`, `/como-funciona`, `/auth/login`, `/auth/cadastro`, `/auth/esqueci-senha`, `/auth/verificar-conta`, `/auth/completar-cadastro`, rota inexistente (404) |
| Usuário (22) | `/feed`, `/explorar`, `/publicacao/[id]`, `/comentarios`, `/comentarios/[postagemId]`, `/perfil`, `/perfil/[id]`, `/perfil/editar`, `/conexoes`, `/mensagens`, `/notificacoes`, `/configuracoes`, `/projetos`, `/projetos/[id]`, `/propostas`, `/propostas/[id]`, `/contratos`, `/contratos/[id]`, `/solicitacoes`, `/denuncias`, `/termos`, `/tipos-projeto` |
| Administração (19) | `/admin`, `/admin/usuarios`, `/admin/identidades`, `/admin/perfis`, `/admin/enderecos`, `/admin/areas`, `/admin/subareas`, `/admin/especialidades`, `/admin/tipos-projeto`, `/admin/riscos`, `/admin/projetos`, `/admin/postagens`, `/admin/propostas`, `/admin/solicitacoes`, `/admin/interacoes`, `/admin/denuncias`, `/admin/termos`, `/admin/termos-postagem`, `/admin/termos-vinculo` |

Elas foram abertas por quatro tipos de pessoa: visitante, admin, criadora de projeto e investidora.

## 2. Funcionalidades testadas

### Autenticação

| Funcionalidade | Status |
| --- | --- |
| Cadastro: campos vazios, dados inválidos, e-mail duplicado e cadastro válido | FUNCIONANDO |
| Foto de verificação e aprovação da identidade pelo admin | FUNCIONANDO |
| Código de verificação do e-mail no primeiro acesso, com reenvio | FUNCIONANDO |
| Login, senha errada, conta inativa e logout | FUNCIONANDO |
| Página privada sem login leva ao login (8 rotas testadas) e, depois do login, volta para a página pedida | FUNCIONANDO |
| Sessão expirada leva ao login com o aviso "sessão expirou" | FUNCIONANDO |
| O navegador guarda só o token e dados públicos, nunca a senha | FUNCIONANDO |
| Recuperação de senha: um código errado é recusado já na etapa do código | CORRIGIDO |
| Troca de senha nas configurações | FUNCIONANDO |

### Feed e publicações

| Funcionalidade | Status |
| --- | --- |
| Publicar texto e imagem; a imagem aparece | FUNCIONANDO |
| Editar publicação; a edição continua depois de recarregar | FUNCIONANDO |
| Excluir publicação que tem comentário de outra pessoa | CORRIGIDO |
| Excluir comentário que tem resposta de outra pessoa | CORRIGIDO |
| Curtir, comentar (conferido no servidor), responder e contar os comentários | FUNCIONANDO |
| Compartilhar (copia o link) e abrir a publicação pelo link | FUNCIONANDO |
| Denunciar publicação | FUNCIONANDO |
| Pesquisa e "Carregar mais" | FUNCIONANDO |
| Envio de vídeo em publicação, projeto e perfil (testado pela API) | FUNCIONANDO |

### Perfil e usuários

| Funcionalidade | Status |
| --- | --- |
| Editar nome, e-mail e telefone; foto, capa, biografia e especialidade | FUNCIONANDO |
| Barra de progresso do perfil, que sobe depois de salvar a foto | FUNCIONANDO |
| Seguir, aceitar, contadores e listas de seguidores e seguindo | FUNCIONANDO |
| Perfil de outra pessoa não mostra telefone nem comprovante | FUNCIONANDO |
| Botões do perfil no celular ("Compartilhar", "Enviar mensagem") | CORRIGIDO |
| Barra "Salvar alterações" do Editar perfil no celular | CORRIGIDO |
| Aviso de progresso do perfil no celular | CORRIGIDO |
| Mensagens privadas, só entre conexões aceitas | FUNCIONANDO |
| Explorar: pessoas, empresas e projetos | FUNCIONANDO |
| Notificações: marcar como lida e marcar todas | FUNCIONANDO |

### Administração

| Funcionalidade | Status |
| --- | --- |
| Usuário comum bloqueado em todas as telas de admin | FUNCIONANDO |
| Áreas, subáreas, especialidades, tipos de projeto, riscos e termos: cadastrar, recusar cadastro vazio, buscar, editar, excluir e paginar | FUNCIONANDO |
| Item recém-salvo aparece na lista (vai até a página dele e o destaca) | CORRIGIDO |
| Usuários: busca, ativar e desativar conta, conceder perfil (EMPRESA) | FUNCIONANDO |
| Usuários: remover um perfil já concedido | NÃO IMPLEMENTADO (o backend não tem endpoint para isso) |
| Endereços: cadastrar, editar e excluir; o complemento é obrigatório | FUNCIONANDO |
| Endereços: preencher o endereço pelo CEP | BLOQUEADO POR DEPENDÊNCIA EXTERNA (o preenchimento manual funciona) |
| Análise de identidade (aprovar e reprovar) e nível da conta | FUNCIONANDO |
| Denúncias e moderação, com apelação | FUNCIONANDO |
| Painel com números e telas de consulta (postagens, projetos, propostas, solicitações, interações) | FUNCIONANDO |

### Empresas e projetos

| Funcionalidade | Status |
| --- | --- |
| Criar, editar e excluir projeto; acesso sem permissão é recusado | FUNCIONANDO |
| Meta, participação oferecida, investimento mínimo e valor arrecadado aparecem na página | FUNCIONANDO |
| Atualizar a meta financeira pela tela ("Atualizar captação") | FUNCIONANDO |
| Galeria de imagens do projeto | FUNCIONANDO |
| Termos de vínculo: quem não tem vínculo aceita os termos antes de ver os detalhes | FUNCIONANDO |
| Empresa vota no projeto, e o criador vê o voto | FUNCIONANDO |
| Solicitações de participação (sócio ou investidor) | FUNCIONANDO |
| Lista de solicitações no celular | CORRIGIDO |
| Propostas e contrapropostas: enviar, editar, aceitar, recusar e contrapropor | FUNCIONANDO |
| Lista de propostas no celular | CORRIGIDO |
| Aviso de confirmação ao aceitar uma proposta | CORRIGIDO |
| O dono vê quem investiu, com nome e valor | FUNCIONANDO |
| Quem teve a proposta aceita entra na equipe como sócio | COM ERRO (backend) |
| Contratos: criar e a outra parte aceitar | FUNCIONANDO |
| Lista e detalhe do contrato para quem enviou a proposta | CORRIGIDO |

### Erros e estados da tela

| Funcionalidade | Status |
| --- | --- |
| Página 404 amigável | FUNCIONANDO |
| Erro 500 mostra a mensagem com "Tentar novamente", e o botão recarrega quando o servidor volta | FUNCIONANDO |
| Queda de rede mostra um aviso, sem tela branca | FUNCIONANDO |
| Estado de carregamento enquanto o servidor não responde | FUNCIONANDO |
| Nenhum erro de execução nem de console inesperado | FUNCIONANDO |

## 3. Problemas encontrados

| # | Problema | Onde | Impacto |
| --- | --- | --- | --- |
| 1 | Na recuperação de senha, o código só era conferido no fim. A pessoa digitava um código errado, criava a senha nova e só então recebia o erro. | `/auth/esqueci-senha` | A pessoa perdia a senha digitada e não sabia em que etapa tinha errado |
| 2 | Uma publicação com comentário de outra pessoa não podia ser excluída. O front tentava apagar os comentários alheios antes, recebia 403 e parava. | Feed, publicação, admin | A exclusão falhava |
| 3 | O mesmo defeito ao excluir um comentário que tinha resposta de outra pessoa. | Comentários | A exclusão falhava |
| 4 | A lista e o detalhe de contratos usavam um filtro com dados guardados no navegador. Quem tinha enviado a proposta por outro aparelho via "Nenhum contrato" e não conseguia aceitar, mesmo com o backend liberando o contrato. | `/contratos`, `/contratos/[id]` | O contrato não podia ser aceito |
| 5 | Nos cadastros do admin, o item recém-salvo podia cair em outra página da lista. | `CrudAdmin` (áreas, subáreas e outros) | Parecia que o cadastro não tinha sido salvo |
| 6 | O aviso ao aceitar uma proposta dizia que o autor "passa a ser sócio", o que nem sempre acontece (veja o item 6.1). | Projeto, aba de propostas | Informação errada para o dono do projeto |
| 7 | A página "Como funciona" não citava Mensagens entre os recursos. | `/como-funciona` | Conteúdo desatualizado |
| 8 | No celular, a lista de propostas espremia o texto numa coluna estreita, ao lado dos botões Aceitar e Recusar. O mesmo acontecia com as propostas e as solicitações na página do projeto. | `/propostas`, `/projetos/[id]` | Card difícil de ler, uma ou duas palavras por linha |
| 9 | No celular, os botões do perfil ficavam numa grade estreita demais. O ícone do "Compartilhar" encolhia para 4px, e "Enviar mensagem" não cabia. | `/perfil`, `/perfil/[id]` | Ícone quase invisível e botão apertado |
| 10 | Um efeito da página de contratos tinha uma dependência desnecessária, apontada pelo ESLint. | `/contratos` | Recarregamento sem necessidade |
| 11 | No celular, a barra fixa do Editar perfil dividia o espaço em duas colunas iguais. "Salvar alterações" não cabia, e o ícone do botão sumia (0px a 360px). | `/perfil/editar` | Botão principal da tela deformado |
| 12 | No celular, quando o aviso "Seu perfil está X% completo" quebrava de linha, o ícone dele encolhia. | `/perfil` | Detalhe visual |
| 13 | No roteiro de varredura, a checagem de "elemento fora da tela" não acusava nada, nem um elemento de 520px colocado de propósito numa tela de 360px. | `e2e/navegador_auditoria.js` | A responsividade parecia aprovada sem ter sido testada de verdade |

Também verifiquei, sem encontrar problemas:

- Nenhum botão sem ação.
- Nenhum link vazio ou para página inexistente.
- Nenhuma chamada para endpoint que não existe no backend (cruzamento das chamadas do front com os 187 endpoints).
- Nenhum texto provisório ("Em breve", "TODO", "lorem") nas telas. A navegação ainda tem suporte a um marcador "Em breve", mas nenhum item o usa.
- Nenhum `console.log` no código do front, e nenhuma senha no armazenamento do navegador.

## 4. Problemas corrigidos

Todos no front.

| # | Correção | Arquivos |
| --- | --- | --- |
| 1 | A etapa do código chama `POST /usuario/validar-token`, que já existia no backend. Um código errado ou expirado mostra "Código inválido ou expirado" e não avança. | `app/auth/esqueci-senha/page.tsx`, `app/services/usuario.service.ts` |
| 2, 3 | Excluir publicação ou comentário virou um único `DELETE`. O banco já apaga em cascata os comentários e as respostas (confirmado pela API: 204 com comentário e resposta de terceiros). | `app/services/postagem.service.ts`, `app/services/comentario.service.ts` |
| 4 | A lista e o detalhe mostram o que o backend libera. O backend já filtra por admin, autor da proposta e membros do projeto, e o detalhe trata o 403 com a tela "sem acesso". | `app/contratos/page.tsx`, `app/contratos/[id]/page.tsx` |
| 5 | Depois de salvar, a lista vai até a página do item, rola até ele e o destaca por 4 segundos. | `app/components/admin/CrudAdmin.tsx` |
| 6 | O aviso agora diz: "o autor entra na equipe como sócio, se ainda não fizer parte dela". | `app/components/projeto/PropostasDoProjeto.tsx` |
| 7 | "Mensagens" foi incluída na lista de recursos, com ícone. | `app/components/como-funciona/textos.ts`, `Secoes.tsx` |
| 8 | O texto do card ocupa no mínimo 18rem. Quando não cabe ao lado dos botões, os botões descem para a linha de baixo; no computador continua tudo na mesma linha. | `app/propostas/page.tsx`, `app/components/projeto/PropostasDoProjeto.tsx`, `app/components/projeto/SolicitacoesVinculo.tsx` |
| 9 | Na grade do celular, o texto dos botões pode quebrar de linha, o espaçamento lateral diminuiu e os ícones não encolhem mais. | `app/components/perfil/PerfilView.tsx` |
| 10 | A dependência desnecessária foi removida. | `app/contratos/page.tsx` |
| 11 | Na barra, "Cancelar" ocupa só o próprio tamanho e "Salvar alterações" fica com o resto. O espaçamento lateral diminuiu no celular, e os ícones não encolhem. | `app/perfil/editar/page.tsx` |
| 12 | O ícone dos rótulos de seção (estilo `eyebrow`) mantém o tamanho quando o texto quebra de linha. | `app/components/ui/estilos.ts` |
| 13 | A checagem foi reescrita para procurar texto ou controle que sai da tela sem ter como ser alcançado. Ela foi validada: o elemento de 520px é acusado em todas as páginas, sem falso alarme. Também foi criada a checagem de "ícone espremido", que acusou os problemas 9, 11 e 12. | `e2e/navegador_auditoria.js` |

Testes unitários novos cobrem as correções 1 a 3 (`tests/api.test.ts`).

## 5. Funcionalidades implementadas

Nesta auditoria não criei nenhuma regra de negócio nem chamei endpoint novo. O que foi acrescentado:

- Validação do código de recuperação na etapa do código, usando o endpoint que já existia.
- Destaque do item salvo nos cadastros do admin.
- O item "Mensagens" na página "Como funciona".
- O roteiro `e2e/auditoria_funcional.js`, com 86 verificações pela tela.
- Varredura em 6 tamanhos de tela (`TELAS=completo`), só das páginas (`SOMENTE_PAGINAS=1`) e com capturas do celular pequeno.
- As checagens automáticas de "texto ou botão fora da tela" e de "ícone espremido".

## 6. Funcionalidades com problemas

| # | Funcionalidade | Situação | Status |
| --- | --- | --- | --- |
| 6.1 | Autor da proposta aceita entra como sócio | O backend só cria o vínculo SÓCIO se a pessoa ainda não tiver vínculo com o projeto. Quem aceitou os termos antes, e por isso já é VISUALIZADOR, continua visualizador, e a equipe mostra "0 sócios". O valor arrecadado e a proposta aceita aparecem certos. | COM ERRO (backend) |
| 6.2 | Remover um perfil (role) de um usuário | O backend só adiciona roles. A tela avisa isso. | NÃO IMPLEMENTADO |
| 6.3 | Verificação automática de originalidade dos projetos | Existe o registro de autoria pelos contratos, mas nenhuma checagem de similaridade. | NÃO IMPLEMENTADO |
| 6.4 | Consulta de CEP | ViaCEP e BrasilAPI não são acessíveis deste ambiente. O formulário avisa e libera o preenchimento manual (testado). | BLOQUEADO POR DEPENDÊNCIA EXTERNA |

## 7. Problemas que dependem de ajustes no backend

Não alterei o backend, como foi pedido. Ficam como recomendação:

| # | Ajuste no backend | Motivo |
| --- | --- | --- |
| 1 | Em `PropostaService.aceitar`, promover o vínculo VISUALIZADOR a SÓCIO (hoje ele só cria o vínculo quando não existe nenhum) | Item 6.1 |
| 2 | Endpoint para remover uma role de um usuário | Item 6.2 |
| 3 | Paginação e contagem no servidor para o feed e os comentários | Hoje o backend devolve tudo de uma vez e o front pagina e conta no navegador. Funciona, mas pesa com muito conteúdo |
| 4 | Decidir quem pode ver o e-mail e o CPF/CNPJ de outra pessoa (`GET /usuario/{id}`, `GET /perfil-usuario`) | O backend devolve esses dados a qualquer usuário logado, e o front os exibe. É uma decisão de produto e de privacidade |
| 5 | O login revela se o e-mail existe (404 para e-mail desconhecido e 400 para senha errada) | Segurança: permite descobrir quem tem conta |
| 6 | Limite de tentativas para o código de redefinição e para os pedidos de código | Segurança: o código tem 6 dígitos e pode ser testado por força bruta |
| 7 | Verificação de originalidade, se fizer parte do produto | Item 6.3 |

## 8. Testes não realizados e motivos

| Teste | Motivo |
| --- | --- |
| Consulta de CEP real | A rede deste ambiente bloqueia ViaCEP e BrasilAPI. O aviso e o preenchimento manual foram testados. |
| Imagens do Unsplash (página inicial e "Como funciona") | O host não é acessível daqui. O restante dessas páginas foi testado. |
| Entrega de e-mail por um provedor real | Usei um SMTP local de teste. Os códigos de verificação e de redefinição foram lidos dele. |
| Compartilhamento nativo do celular (`navigator.share`) | O navegador de teste não tem essa função. Foi testado o caminho alternativo, que copia o link. |
| Safari, Firefox e aparelhos físicos | Só o Chromium (Playwright) está disponível. Os tamanhos de celular e tablet foram emulados, com toque e densidade de pixels. |
| Carga e desempenho com muitos usuários | Fora do escopo de um teste funcional, e precisaria de massa de dados e infraestrutura própria. |
| Leitores de tela | Os roteiros encontram botões e campos pelos nomes acessíveis (papéis e rótulos ARIA), mas não houve um teste com leitor de tela. |

## 9. Resultado de responsividade

Todas as páginas foram abertas nos seis tamanhos:

| Tamanho | Resolução |
| --- | --- |
| Computador | 1920 × 1080 |
| Notebook | 1366 × 768 |
| Tablet paisagem | 1024 × 768 |
| Tablet retrato | 768 × 1024 |
| Celular | 390 × 844 (iPhone 13) |
| Celular pequeno | 360 × 740 |

Em cada abertura foram verificados:

- erros de execução e de console;
- respostas HTTP de erro;
- imagens quebradas;
- rolagem horizontal;
- texto ou botão saindo da tela;
- ícone espremido.

| Resultado | |
| --- | --- |
| Aberturas de página | 396 |
| Com erro, rolagem horizontal, imagem quebrada, elemento fora da tela ou ícone espremido | 0 na varredura final (6 na anterior, todas corrigidas) |
| Capturas a 360px revisadas uma a uma | 66 (cada página com cada tipo de pessoa) |

A revisão visual das capturas achou os problemas 8 e 9 da seção 3. A checagem nova de ícone espremido acusou o 9 e também o 11 e o 12, em 6 aberturas a 390px e 360px. Os quatro foram corrigidos, e a varredura final nos seis tamanhos passou sem nenhum problema.

Também conferi e mantive como estão, porque são de propósito:

- As abas que não cabem (Conexões, Explorar, Propostas) rolam para o lado dentro da própria faixa.
- Os cartões decorativos de "Como funciona" saem pela borda de propósito.
- No celular, a barra de navegação inferior e a barra "Salvar alterações" ficam fixas.

## 10. Situação geral do projeto

O front está **estável e integrado ao backend**:

- Todas as 48 páginas abrem sem erro nos seis tamanhos de tela.
- Os cinco roteiros ponta a ponta passam sem nenhuma reprovação.
- Durante toda a regressão, o backend não registrou nenhum erro.

A auditoria encontrou 13 problemas no front: 8 de funcionamento, conteúdo ou código, 4 de layout no celular e 1 no próprio roteiro de testes. Todos foram corrigidos e testados de novo.

Os três defeitos de funcionamento mais sérios impediam a pessoa de concluir uma ação:

- excluir uma publicação que tem comentário de outra pessoa;
- excluir um comentário que tem resposta de outra pessoa;
- aceitar um contrato depois de enviar a proposta por outro aparelho.

O que ainda não está como deveria depende do backend ou de serviços externos, conforme as seções 6 a 8:

- **COM ERRO:** quem tem a proposta aceita não vira sócio se já era visualizador do projeto.
- **NÃO IMPLEMENTADO:** remover o perfil (role) de um usuário e a verificação automática de originalidade.
- **BLOQUEADO POR DEPENDÊNCIA EXTERNA:** consulta de CEP, imagens do Unsplash e e-mail real.
- **Recomendações de segurança e privacidade para o backend:** e-mail e CPF/CNPJ visíveis a terceiros, login que revela se o e-mail existe e código de redefinição sem limite de tentativas.

### Resultado dos testes

| Teste | Resultado |
| --- | --- |
| Auditoria funcional pela tela (`e2e/auditoria_funcional.js`) | 85 de 86 aprovadas, 0 reprovadas, 1 pendência de backend (sócio) |
| Responsividade em 6 tamanhos (`TELAS=completo SOMENTE_PAGINAS=1`) | 396 de 396 aberturas sem problema |
| Páginas e fluxos (`e2e/navegador_auditoria.js`) | 198 aberturas sem problema, 40 de 40 fluxos aprovados, 1 não testado (Unsplash) |
| Negociação (`e2e/negociacao_navegador.js`) | 51 de 51. Os únicos HTTP 400 são os provocados de propósito: e-mail duplicado e login de conta inativa |
| Mensagens (`e2e/mensagens_navegador.js`) | 46 de 46 |
| API (`e2e/api_auditoria.py`) | 329 de 329 verificações, 187 de 187 endpoints chamados |
| Log do backend durante a regressão | 0 linhas ERROR e 0 erros internos não tratados |
| Testes unitários do front (vitest) | 124 de 124 |
| TypeScript (`tsc --noEmit`) | 0 erros |
| ESLint | 0 erros. Ficam 43 avisos de estilo do React (`set-state-in-effect`), todos anteriores à auditoria; refatorar telas que funcionam traria risco sem ganho para quem usa |
| Build de produção (`next build`) | Compilado sem erros, 45 páginas estáticas geradas |
| Backend | Não alterado: hash da árvore igual ao do início, sem mudanças locais |
