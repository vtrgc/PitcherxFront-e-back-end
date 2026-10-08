# PitcherX — Auditoria completa Front-end × Back-end

> Escopo: somente o **front-end** foi alterado. O back-end foi usado exclusivamente como referência
> (controllers, DTOs, services, `@PreAuthorize`, `SecurityConfig`). Nenhum arquivo do back-end foi criado,
> editado ou removido.

## 1. Como a auditoria foi feita

1. Levantamento de **todos os 129 endpoints** do back-end (método, rota, permissão e método do controller).
2. Levantamento de **todas as funções de serviço** do front (`app/services/*.ts`), da rota chamada e de
   quais telas as usam.
3. Cruzamento endpoint × serviço × tela, comparação de cada formulário com o DTO correspondente e
   revisão das regras de permissão (ADMIN / USUARIO / EMPRESA) refletidas no front.
4. Varredura de todas as rotas do App Router e de todos os `href`/`router.push` para achar links quebrados.
5. Verificação dos estados de interface (carregando, erro, vazio, sucesso, sem permissão) nas telas
   tocadas e nas novas.

## 2. Resultado da cobertura de endpoints

| Grupo | Endpoints | Situação após a auditoria |
| --- | --- | --- |
| Área, Subárea, Especialidade, Tipo de projeto, Termo, Termo de postagem, Termo de vínculo, Endereço | CRUD | Telas admin completas (listar, pesquisar, paginar, cadastrar, editar, excluir) |
| Usuário | cadastro, login, foto, senha, esqueci/resetar senha, alterar role, ativar/desativar, excluir | Coberto (usuário e admin). **Novo:** desativar a própria conta |
| Perfil profissional (`/perfil-usuario`) | CRUD + capa | **Novo:** tela admin completa; **novo:** usuário pode remover as próprias informações profissionais |
| Postagem, Comentário, Resposta, Curtida | CRUD + imagens | Coberto (feed, publicação, moderação admin) |
| Projeto (`/projeto`) | CRUD + imagens + busca | Coberto. **Novo:** paginação na lista do usuário |
| Vínculos (`/projeto-usuario`) | listar, criar, **alterar**, remover | **Novo:** admin gerencia vínculos; **novo:** criador altera o tipo de vínculo de um membro |
| Contrato | CRUD | Coberto. **Novo:** paginação na lista |
| Proposta / Contraproposta | CRUD | **Novo:** tela admin; **novo:** paginação na lista do usuário |
| Conexões e notificações | seguir, aceitar, recusar, remover, contadores, notificações paginadas | Coberto (paginação do servidor usada onde existe) |

Funções de serviço que continuam sem uso em telas são apenas `GET /{id}` de cadastros cujas listas já trazem
os mesmos dados, e `PUT /usuario/{id}` (ver limitações).

## 3. Problemas encontrados e o que foi feito

| # | Problema | Correção no front |
| --- | --- | --- |
| 1 | `/perfil-usuario` (POST/PUT/DELETE, banner) permitido ao ADMIN, mas sem tela administrativa | Página **Admin → Perfis profissionais** |
| 2 | `/proposta` e `/contra-proposta` sem tela administrativa (ADMIN pode excluir contrapropostas) | Página **Admin → Propostas** |
| 3 | `/projeto-usuario` POST/PUT/DELETE permitidos ao ADMIN, mas a tela de projetos do admin só listava vínculos | Gestão de vínculos na linha expandida de **Admin → Projetos** |
| 4 | `PUT /projeto-usuario/{id}` (`atualizarVinculo`) existia no serviço e não era usado | Seletor de tipo de vínculo na equipe do projeto (criador) e no admin |
| 5 | `DELETE /perfil-usuario/{id}` não era oferecido ao usuário | Botão **Remover** em Editar perfil → Informações profissionais |
| 6 | `PUT /usuario/ativar-desativar/{id}` liberado para o próprio usuário, sem tela | **Desativar conta** em Configurações |
| 7 | Listas do usuário (Projetos, Propostas, Contratos) sem paginação | Paginação no cliente (os endpoints não têm `Pageable`) |
| 8 | Checagem de vínculo duplicado do back compara parâmetros na ordem errada (erro 500) | O front confere duplicidade antes de criar ou alterar um vínculo |
| 9 | Aviso de sucesso podia aparecer antes da lista recarregar nas exclusões | Recarrega primeiro e depois mostra o aviso |
| 10 | Linhas expansíveis do admin podiam gerar HTML inválido (`div` dentro de `ul`) | `LinhaAdmin` ganhou o espaço `detalhe`, que fica dentro do próprio `<li>` |

Rotas: todas as rotas do App Router existem e nenhum link aponta para uma página inexistente. As páginas
administrativas usam `useRequireAdmin`; as do usuário usam `PageShell` com proteção de autenticação.

## 4. Telas e funcionalidades criadas

### Administração

- **Perfis profissionais** (`/admin/perfis`): lista com área de atuação, documento mascarado (CPF/CNPJ),
  LinkedIn e capa; pesquisa por nome/e-mail/área/LinkedIn; filtros por área e por tipo de documento;
  paginação; **+ Cadastrar** em modal (o select mostra só usuários sem perfil e sem conta de admin);
  **Editar** em modal preenchida (o dono não muda); **Excluir** com confirmação; **Remover capa**;
  link para o perfil público. Validação igual à do usuário (área obrigatória, CPF/CNPJ válido, LinkedIn opcional).
- **Propostas** (`/admin/propostas`): lista com valor (ou "a combinar") e número de contrapropostas;
  pesquisa; filtro com/sem contrapropostas; paginação; **+ Cadastrar** e **Editar** em modal (descrição
  obrigatória até 2000 caracteres, valor opcional, aceita `1500` ou `1.500,00`, limite do back respeitado);
  **Excluir** avisando que as contrapropostas também saem; linha expansível com as contrapropostas e
  exclusão de cada uma (o admin só pode excluí-las, conforme o `@PreAuthorize`).
- **Projetos → vínculos** (`/admin/projetos`): na linha expandida, além de listar, agora é possível
  **adicionar** vínculo (usuário + tipo), **alterar o tipo** (Criador, Sócio, Investidor, Visualizador) e
  **remover**, com confirmação e aviso quando o projeto ficaria sem criador.
- Menu do admin com os novos itens **Propostas** e **Perfis profissionais**.

### Usuário

- **Equipe do projeto**: o criador troca o tipo de vínculo de um membro direto na lista; aviso ao deixar
  de ser criador ou ao tirar o único criador.
- **Editar perfil → Informações profissionais → Remover**: apaga o perfil profissional (e a capa) com
  confirmação; o formulário volta vazio para um novo cadastro.
- **Configurações → Desativar conta**: confirmação explicando que só o administrador reativa; após
  desativar, a sessão é encerrada (o login do front recusa contas inativas). Não aparece para o administrador.
- **Paginação** em Projetos (12 por página), Propostas (10) e Contratos (12), com "Mostrando X–Y de Z",
  anterior/próxima, números de página e itens por página; trocar filtro/aba/busca volta para a página 1.

## 5. O que NÃO foi criado (o back-end não oferece)

| Pedido / ideia | Motivo |
| --- | --- |
| Publicações salvas | Não há entidade nem endpoint de salvamento |
| Compartilhamento como registro | Não há entidade; o front só copia o link da publicação/projeto |
| Mensagens / chat | Não há entidade nem endpoint (a página `/mensagens` apenas informa isso) |
| Histórico de status do projeto | A entidade `StatusProjeto` existe, mas não há controller |
| Editar nome, e-mail e telefone | `PUT /usuario/{id}` copia a senha em texto puro por cima do hash (`UsuarioMapper.updateFromDTO`) e quebraria o login |
| Dono da proposta / "minhas propostas" | `Proposta` não tem relação com usuário no back-end |
| `DELETE /curtida/remover-curtida/{id}` | Nenhuma resposta da API devolve o ID da curtida; o front usa a rota por usuário/tipo/conteúdo |
| Validação separada do código de recuperação | `/usuario/validar-token` responde 204 mesmo com código inválido; a conferência real fica no `/resetar-senha` |
| Bloqueio de conta inativa no servidor | O back não bloqueia; o front bloqueia no login e explica ao usuário |

## 6. Testes

- `npx tsc --noEmit`: sem erros.
- `npx eslint app`: sem erros (apenas os avisos `react-hooks/set-state-in-effect` que já existiam).
- `npx vitest run`: 101 testes passando.
- `npx next build`: build de produção concluído, com as rotas novas `/admin/perfis` e `/admin/propostas`.
- E2E (Chromium + API simulada): 79 verificações novas (cadastro/edição/exclusão de perfis e propostas,
  vínculos, alteração de vínculo pelo criador, remoção de perfil, desativação, paginação e varredura
  responsiva em 375/768/1280 px sem rolagem horizontal) + regressão das suítes anteriores
  (91 do usuário, 91 do admin, 10 de notificações), todas passando.

## 7. Arquivos

Novos:

- `app/admin/perfis/page.tsx`
- `app/admin/propostas/page.tsx`
- `app/hook/usePaginacao.ts`
- `RELATORIO_AUDITORIA.md`

Alterados:

- `app/components/AdminNav.tsx` (novos itens do menu)
- `app/components/admin/ListaAdmin.tsx` (`LinhaAdmin` com `detalhe`)
- `app/components/admin/Paginacao.tsx` (opções de itens por página configuráveis)
- `app/lib/listagem.ts` (`OPCOES_POR_PAGINA_GRADE`)
- `app/admin/projetos/page.tsx` (gestão de vínculos)
- `app/projetos/[id]/page.tsx` (alterar tipo de vínculo)
- `app/perfil/editar/page.tsx` (remover informações profissionais)
- `app/configuracoes/page.tsx` (desativar conta)
- `app/projetos/page.tsx`, `app/propostas/page.tsx`, `app/contratos/page.tsx` (paginação)
- `O_QUE_FOI_ADICIONADO.md`
