# PitcherX — Grupo 10: correções e implementações do front-end

Escopo: **somente o front-end** (`front-end/`). O back-end foi usado apenas como referência
(controllers, DTOs, models, migrations) e **não foi alterado** — `git diff` da pasta `back-end/`
é vazio.

## Resumo por item

| # | Item | O que foi feito | Onde |
|---|------|-----------------|------|
| 1 | Integração com CEP | Ao completar 8 dígitos, consulta ViaCEP (com BrasilAPI de reserva), preenche logradouro, bairro e UF (editáveis), mostra a cidade, "Consultando CEP...", CEP inválido/inexistente/serviço fora do ar com "Tentar novamente". Máscara 00000-000. Endereço salvo não é sobrescrito ao abrir a tela. | `lib/cep.ts`, `hook/useConsultaCep.ts`, `components/perfil/StatusCep.tsx`, `CamposEndereco.tsx`, `FormEndereco.tsx` |
| 2 | LinkedIn opcional | Campo marcado "(opcional)", sem erro quando vazio; só é validado se preenchido. **O DTO do back-end exige `linkedin` (@NotBlank)**: sem LinkedIn o front envia o marcador `nao-informado`, que nunca é exibido nem vira link. | `lib/perfil.ts`, `CamposProfissional.tsx`, `PerfilView.tsx`, textos do cadastro/edição |
| 3 | Quantidade de comentários | Cada publicação mostra "💬 N comentários" antes de abrir (uma chamada a `GET /comentario` para a lista toda) e atualiza ao comentar. | `postagem.service.ts` (`detalharPostagens`), `PostCard.tsx`, `PerfilView.tsx` |
| 4 | Compartilhamento | Nova rota `/publicacao/{idPostagem}`; o botão usa sempre `post.idPostagem`. O endereço antigo `/comentarios/{id}` redireciona para a nova rota. | `publicacao/[id]/page.tsx`, `comentarios/[postagemId]/page.tsx`, `PostCard.tsx` (`linkDaPostagem`) |
| 5 | Quantidade de curtidas | "❤️ N curtidas" em todos os tamanhos de tela; atualização otimista ao curtir/descurtir (com reversão em erro) e sincronização quando a lista recarrega. | `PostCard.tsx`, `hook/useCurtida.ts` |
| 6 | Contratos para todos | `GET /contrato` devolve tudo; o front agora mostra apenas contratos de projetos em que o usuário é **criador, sócio ou investidor** (o admin vê todos). Acesso direto a `/contratos/{id}` alheio mostra "Acesso restrito". Na página do projeto, a seção de contratos (registro de autoria / verificador antiplágio) só aparece para as partes. Falha ao carregar vínculos = nada é exibido. Contas só EMPRESA não veem ações de contrato (o back-end responde 403). | `contratos/page.tsx`, `contratos/[id]/page.tsx`, `projetos/[id]/page.tsx`, `projetoUsuario.service.ts` |
| 7 | Porcentagem do perfil | Agora é `itens feitos / 3`: 0%, 33,33%, 66,67%, 100% (antes contava a conta como um 4º item e mostrava 75%). Exibe "N de 3 itens". | `lib/perfil.ts` (`completudePerfil`, `formatarPercentual`), `PerfilView.tsx` |
| 8 | Denúncias | Denunciar publicação, comentário, resposta e projeto: modal com motivo obrigatório, detalhes (obrigatórios em "Outro"), proteção contra clique duplo, Esc/clique fora, feedback de sucesso/erro, conteúdo ocultado para quem denunciou e "Desfazer denúncia". | `services/denuncia.service.ts`, `hook/useDenuncia.ts`, `components/denuncia/*`, `PostCard.tsx`, `ComentarioCard.tsx`, `projetos/[id]/page.tsx` |
| 9 | Verificação de pessoa e e-mail | Área "Verificação da conta" no próprio perfil e em Configurações: E-mail, Identidade (CPF/CNPJ) e Conta, com selos Verificado / Não verificado / Pendente, usando apenas dados da API. | `lib/verificacao.ts`, `components/perfil/CartaoVerificacao.tsx` |
| 10 | Empresas | Aba **Empresas** em Explorar (cartões com seguidores e Seguir/Seguindo); selo "Empresa" no perfil; aba **Apoiados** no perfil de empresa (projetos que ela votou); "Empresas relacionadas" e votos de empresas na página do projeto. | `services/empresa.service.ts`, `explorar/page.tsx`, `PerfilView.tsx`, `projetos/[id]/page.tsx` |
| 11 | Parar de seguir | "Seguindo ▾" abre menu com **Parar de seguir** (funciona por toque; antes só aparecia no hover), confirmação, chamada `DELETE /conexao/{id}` e atualização imediata do botão e dos contadores. | `components/conexao/BotaoConexao.tsx`, `hook/useConexao.ts`, `conexoes/page.tsx` |
| 12 | Seguidores | Botão Seguir/Seguindo do autor em cada publicação do feed e na página da publicação, com o mesmo estado das demais telas (evento de alteração já existente recarrega perfil, contadores, Explorar e Conexões). | `PostCard.tsx`, `feed/page.tsx`, `publicacao/[id]/page.tsx` |
| 13 | Dados dos projetos | Página do projeto reorganizada: capa + status + ações (Votar, Compartilhar, Denunciar, Editar, Excluir) → Sobre → Informações principais (categoria, status derivado das datas, período, duração, prazo decorrido, equipe, imagens) → Autor e Empresas relacionadas → **Meta financeira** (meta, captado, restante, progresso, investimento mínimo, uso dos recursos) → **Aquisição/participação** → **Votos** (total, empresas, pessoas, adesão das empresas e quais votaram) → Galeria → Contratos → Equipe. Cartões de projeto (lista, Explorar, perfil) mostram meta, participação e progresso. | `projetos/[id]/page.tsx`, `components/projeto/*`, `lib/fichaProjeto.ts`, `lib/projeto.ts`, `FormProjeto.tsx`, `projeto.service.ts` |

## Limitações do back-end (não resolvíveis só no front)

1. **Dados financeiros do projeto não existem no back-end** (`ProjetoRequestDTO` só tem nome,
   descrição, datas, tipo e imagem). Para que o criador possa informá-los sem alterar o back-end,
   meta, captado, participação, investimento mínimo e uso dos recursos são guardados num bloco no
   fim de `descricaoProjeto` (coluna TEXT). `projeto.service` separa o bloco em toda resposta, então
   ele nunca aparece na interface. Os valores são sempre os informados pelo criador; sem eles a tela
   diz "não informado". Recomendação: criar colunas próprias no back-end e migrar o bloco.
2. **Votos**: não há votação no back-end. O voto é a curtida do projeto (`tipo_conteudo` PROJETO);
   o voto de cada empresa é lido em `GET /curtida/status/{empresa}/4/{projeto}`.
3. **Empresa** não é entidade no back-end: é a conta com role `EMPRESA` (atribuída pelo admin) ou
   o perfil cadastrado com CNPJ. Como `GET /usuario` é só do ADMIN, a lista parte de
   `GET /perfil-usuario` e lê as roles de cada conta.
4. **Denúncia**: não existe endpoint. A denúncia é registrada na conta do usuário neste navegador
   (localStorage) e oculta o conteúdo para ele; **ela não chega à administração**. Para isso é
   preciso um endpoint (ex.: `POST /denuncia`); basta trocar o corpo de `enviarDenuncia`.
5. **E-mail**: não há confirmação de e-mail no back-end, por isso o e-mail aparece sempre como
   "Não verificado". A identidade é validada apenas pelos dígitos do CPF/CNPJ (sem consulta oficial).
6. **LinkedIn** é `@NotBlank` no DTO: o marcador `nao-informado` é gravado quando não informado.
7. **Deixar de seguir / cancelar solicitação** exigem o ID da conexão, que a API não devolve nas
   listas. O front usa o ID visto ao seguir (cache local) ou o `referenciaId` das notificações.
8. **Editar projeto** (inclusive os dados financeiros) exige data de início ≥ hoje (regra do DTO).
9. **CEP**: a cidade é exibida, mas não é salva (`EnderecoRequestDTO` não tem cidade).

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 erros |
| `npx eslint .` | 0 erros; só avisos `react-hooks/set-state-in-effect` (padrão já documentado de carregar dados ao montar) |
| `npx vitest run` | 9 arquivos, 88 testes OK (27 novos: `tests/cep.test.ts`, `tests/grupo10.test.ts`, `tests/perfil.test.ts`) |
| `npx next build` | OK, todas as rotas (inclui `/publicacao/[id]`) |
| E2E (Chromium, build de produção) | 91/91: feed (contagens, curtir/descurtir, compartilhar, parar de seguir, denúncia, comentar), publicação e redirecionamento, contratos (parte × não parte), projeto em 1280 e 390 px, lista de projetos, perfil (33,33%, verificação), Explorar/Empresas, perfil de empresa (Apoiados, seguir), CEP (encontrado, inexistente, incompleto), LinkedIn opcional e varredura de 10 rotas em 390/1280 px sem rolagem horizontal nem erros de console |

O E2E rodou contra um mock da API escrito a partir dos controllers/DTOs do back-end (o back-end
real não sobe neste ambiente). O mock não faz parte da entrega. Antes de publicar, rode os fluxos
principais contra o back-end real.

---

# Grupo 10 — Melhorias nas páginas administrativas

Escopo: somente o front-end. O back-end não foi alterado.

## Páginas e o que cada uma ganhou

| Página | Pesquisar | Cadastrar (modal) | Editar (modal) | Paginação |
|---|---|---|---|---|
| Áreas | nome, descrição | sim | sim | sim |
| Subáreas | nome, descrição, área + filtro por área | sim | sim | sim |
| Especialidades | nome | sim | sim | sim |
| Endereços | rua, número, complemento, bairro, UF, CEP, usuário + filtro por estado | sim (com busca de CEP) | sim | sim |
| Tipos de projeto | nome, descrição | sim | sim | sim |
| Termos de contrato | título, descrição, contrato + filtro por contrato | sim | sim | sim |
| Termos de postagem / vínculo | título, descrição | sim* | sim* | sim |
| Usuários | nome, e-mail, telefone, perfil + filtros de status e perfil | sim | status e perfis** | sim |
| Projetos | nome, descrição, tipo + filtros | —*** | —*** | sim |
| Postagens | título, texto, data, autor | —*** | —*** | sim |
| Interações (comentários) | texto, autor, publicação | — | — | sim |

\* `POST/PUT /termo-postagem` e `/termo-vinculo` só aceitam as roles USUARIO/EMPRESA. Para um
administrador sem essas roles, "Cadastrar" e "Editar" ficam desabilitados com a explicação.
\*\* `PUT /usuario/{id}` grava a senha sem criptografia e bloquearia o acesso do usuário; por isso a
modal de edição altera status (`/usuario/ativar-desativar`) e adiciona perfis (`/usuario/alterar-role`).
\*\*\* `POST/PUT /projeto` e `/postagem` não aceitam a role ADMIN: as telas são de moderação.

## Como funciona

- **Paginação:** nenhum endpoint de listagem do back-end tem `Pageable`; a lista vem inteira e é
  paginada no front (10, 20 ou 50 por página). Mudar a pesquisa ou um filtro volta à página 1; uma
  página que deixa de existir após excluir é corrigida sozinha. Com 0 registros a barra some.
- **Pesquisa:** ignora maiúsculas e acentos e exige todas as palavras digitadas; funciona junto com a
  paginação e com os filtros.
- **Modais:** mesmo componente em todas as telas (`ModalAdmin`): validação, mensagens de erro, Enter
  envia, Esc/X/Cancelar fecham, proteção contra clique duplo, foco preso na modal; no celular abre
  como painel inferior. Após salvar, a lista é recarregada e só então aparece a mensagem de sucesso.
- **Regras preservadas:** nome duplicado em colunas UNIQUE é bloqueado antes de enviar; limites de
  tamanho das colunas; exclusão de área com subáreas, de especialidade em uso e de tipo de projeto em
  uso continua bloqueada (evita erro 500 ou exclusão em cascata).

## Verificações

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 erros |
| `npx eslint .` | 0 erros (só o aviso `set-state-in-effect` já documentado) |
| `npx vitest run` | 10 arquivos, 95 testes OK (7 novos em `tests/listagem.test.ts`) |
| `npx next build` | OK |
| E2E admin (Chromium) | 91/91: paginação (próxima, anterior, número, itens por página), pesquisa com/sem resultado, cadastrar e editar em Áreas, Subáreas, Especialidades, Tipos de projeto, Termos de contrato, Endereços (CEP) e Usuários; termos de postagem sem permissão; 12 páginas admin em 375, 768 e 1280 px sem rolagem horizontal nem erros de console; modal dentro da tela |
| E2E usuário (regressão) | 91/91 |

---

# Notificações de curtidas, comentários, respostas e votos

Escopo: somente o front-end. O back-end não foi alterado.

**Por que no front:** o back-end só cria notificações de conexão (`ConexaoService.criarNotificacao`);
não existe notificação de curtida/comentário nem endpoint para criá-las.

**Como funciona** (`lib/atividade.ts`, `services/atividade.service.ts`):

- A cada 60 s (com a aba visível), ao abrir Notificações e ao clicar em "Atualizar", o front consulta
  `GET /postagem`, `GET /comentario`, `GET /sub-comentario`, os projetos em que o usuário é criador e
  `GET /curtida/status/{eu}/{tipo}/{id}` das publicações, comentários e projetos dele.
- Compara com o último estado visto (guardado no navegador, por usuário) e gera:
  - **Novo comentário** — comentário de outra pessoa numa publicação do usuário (com autor e trecho);
  - **Nova resposta** — resposta a um comentário do usuário (o back-end não envia o autor das
    respostas, então aparece "Alguém respondeu"; respostas do próprio usuário são ignoradas);
  - **Novas curtidas** — aumento das curtidas de outras pessoas numa publicação ou comentário
    (a API não informa quem curtiu, só a quantidade);
  - **Novo voto no projeto** — aumento das curtidas (votos) de outras pessoas num projeto criado pelo usuário.
- Avisos novos aparecem como **toast**, entram no **contador do sino** (somados às notificações de
  conexão do servidor) e na página **Notificações**, com filtros e "Ver publicação"/"Ver projeto".
- Na primeira verificação, o que já existia vira histórico lido, sem horário.

**Limitações:** o estado fica no navegador, então o aviso aparece no dispositivo em que a pessoa
usa o PitcherX (em outro dispositivo, a primeira verificação vira histórico). Para notificações
iguais em todos os dispositivos e com o nome de quem curtiu, o back-end precisaria criar
`Notificacao` em `CurtidaService`, `ComentarioService` e `SubComentarioService`.

**Verificações:** `tsc` 0 erros; ESLint 0 erros; `vitest` 101 testes (6 novos em
`tests/atividade.test.ts`); `next build` OK; E2E de notificações 10/10 (histórico inicial, toast,
contador do sino, comentário com autor, curtidas, voto, abrir publicação, marcar todas como lidas,
novo aviso depois de tudo lido, sem erros de console); regressão: E2E usuário 91/91 e admin 91/91.
