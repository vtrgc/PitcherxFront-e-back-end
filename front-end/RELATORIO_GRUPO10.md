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
