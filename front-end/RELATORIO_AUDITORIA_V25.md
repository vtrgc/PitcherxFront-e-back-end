# PitcherX — Auditoria front × back (backend com a migration V25)

Escopo: **somente o front-end** foi alterado. O backend de referência é o `PitcherX-BackEnd-main.zip`
enviado (mais novo que a pasta `back-end/` do repositório: tem a V25, verificação de conta e campos
financeiros do projeto). Nenhum arquivo de `back-end/` foi criado, editado ou removido.

## 1. O que o backend novo mudou e quebrava o front

| Mudança no backend | Efeito no front antes | Correção |
|---|---|---|
| Cadastro cria a conta **inativa** e envia um código de 6 dígitos por e-mail; `POST /usuario/verificar-conta` ativa a conta (exige token: a rota não está no `permitAll`) | O login tratava a conta nova como "desativada" e bloqueava o usuário para sempre | Nova tela **`/auth/verificar-conta`**; cadastro → login → verificação → completar cadastro; login com conta inativa leva à verificação; `useRequireAuth`/`useRequireAdmin` redirecionam contas não verificadas; aviso no login pós-cadastro |
| `ProjetoRequestDTO.metaFinanceira` **obrigatório** (+ `valorArrecadado`, `riscoProjeto`) | `POST/PUT /projeto` respondia 400 (a meta era guardada escondida na descrição) | Formulário envia os campos reais; meta obrigatória; novo campo **Risco do projeto**; painel do projeto mostra o risco; projetos antigos continuam lendo meta/captado do bloco legado |
| E-mail passa a ser confirmado | "Verificação da conta" dizia que não existia confirmação de e-mail | Conta ativa = e-mail confirmado; inativa = pendente, com link para verificar |

## 2. Administração

Endpoints de cadastro devolvem `List<T>` sem página nem filtro (só `/conexao` é paginado no servidor),
então busca e paginação são feitas no navegador (`lib/listagem.ts`, `hook/usePaginacao.ts`).

- Novo componente **`CrudAdmin`**: botão **Cadastrar**, **modal** de cadastro/edição, busca sem acentos,
  filtros, paginação (anterior/próxima, números, 10/20/50 por página, "Mostrando X–Y de N"), confirmação
  de exclusão, toasts de sucesso/erro, loading, erro com "Tentar novamente", vazio e "sem resultados".
- Reescritas com ele: **Áreas, Subáreas** (filtro por área), **Especialidades, Tipos de projeto, Termos de
  contrato** (filtro por contrato), **Termos de postagem/vínculo**. As regras de proteção existentes foram
  mantidas (nome único, área com subáreas, especialidade/tipo em uso que apagaria registros em cascata).
- **Endereços**: modal (mantém a consulta de CEP), busca, filtro por UF e paginação.
- **Usuários, Projetos, Postagens**: paginação adicionada às buscas/filtros existentes; "Inativo" explica
  que pode ser conta aguardando verificação.
- Telas novas: **`/admin/perfis`** (perfis profissionais: busca, filtro por especialidade e CPF/CNPJ,
  link do perfil, exclusão — `DELETE /perfil-usuario/{id}` aceita ADMIN) e **`/admin/propostas`**
  (propostas com as contrapropostas, filtro com/sem contrapropostas, exclusão de ambas).
- Paginação também nas listas do usuário: **Projetos** (12 por página), **Propostas** e **Contratos**.

## 3. Limitações do backend (não resolvíveis só no front)

1. Não há endpoint para **reenviar o código** de verificação nem campo `verificado` na resposta: conta
   inativa pode ser "não verificada" ou "desativada pelo admin"; a tela trata as duas (o backend responde
   "Conta já foi verificada!" no segundo caso).
2. `PerfilUsuario.biografia` existe no banco (V25), mas **não está nos DTOs**: não dá para exibir/editar.
3. `PUT /usuario/{id}` continua sobrescrevendo o hash da senha com texto puro (`updateFromDTO`): nome,
   e-mail e telefone seguem somente leitura.
4. Participação, investimento mínimo e uso dos recursos não têm coluna: continuam no bloco da descrição.
5. Proposta/contraproposta não têm autor nem vínculo com projeto; não há endpoints de mensagens,
   publicações salvas nem denúncias (itens já documentados nos relatórios anteriores).

## 4. Validação

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | 0 erros |
| `npm run lint` | 0 erros (33 avisos `set-state-in-effect`, mesmo padrão já existente) |
| `npm run test` | 10 arquivos, 95 testes OK (novos: `tests/listagem.test.ts`, ficha financeira, verificação) |
| `next build` | OK — todas as rotas, incluindo `/auth/verificar-conta`, `/admin/perfis`, `/admin/propostas` |
| Fumaça no Chromium (API simulada a partir dos DTOs) | 16/16: cadastro → verificação (código inválido e válido, corpo do POST), rota protegida, áreas (1–10 de 25, página 3, busca sem acento, modal, validação, nome duplicado, POST com o DTO), propostas em 390 px sem rolagem horizontal, projeto com `metaFinanceira`/`valorArrecadado`/`riscoProjeto` |

Antes de publicar, rode os fluxos principais contra o backend real (com SMTP configurado, pois o
cadastro envia o e-mail de forma síncrona).
