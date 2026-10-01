# PitcherX — Perfil, edição de perfil e completar cadastro

Data: 23/09/2026 · Escopo: somente o front-end. O backend (`PitcherX-BackEnd-main 7.zip`) foi usado apenas como referência de contrato e **não foi modificado** (ver seção F).

## Decisões tomadas antes da implementação

A análise do backend mostrou que ele **não armazena** bio, "sobre mim", banner/capa, cargo, empresa, formação, competências, interesses nem nome de usuário. Por decisão do responsável pelo projeto:

- **Esses campos não aparecem na interface.** Nada é salvo só no navegador para parecer persistido.
- **Nome, e-mail e telefone continuam somente leitura.** O único endpoint de edição (`PUT /usuario/{id}`) grava a senha em texto puro (`UsuarioService.atualizarUsuario` + `usuarioMapper.updateFromDTO`) e o usuário perde o acesso.

## A. Arquivos modificados

| Arquivo | O que mudou |
| --- | --- |
| `app/perfil/page.tsx` | Reescrito. "Meu perfil" usa a nova visualização com as ações de dono e mostra o aviso de sucesso vindo da edição. |
| `app/perfil/[id]/page.tsx` | Reescrito. Perfil público com a mesma visualização e validação do id. |
| `app/perfil/editar/page.tsx` | Reescrito do zero. Seções (foto, básicas, profissional, localização), "Salvar alterações" único, "Cancelar", envio só do que mudou, erros por parte, proteção contra saída sem salvar. |
| `app/auth/completar-cadastro/page.tsx` | Reescrito. "Vamos completar seu perfil" em 3 etapas com progresso, "Salvar e continuar", "Fazer isso depois". |
| `app/auth/cadastro/page.tsx` | Correção de 1 linha: o telefone é enviado só com dígitos. A coluna é `VARCHAR(13)` e "(11) 99999-9999" (15 caracteres) fazia o cadastro falhar com 500. |
| `app/components/PageShell.tsx` | `rightRail={null}` explícito agora libera a largura total. Só as páginas de perfil usam isso; as demais não mudam. |
| `app/components/ui/Avatar.tsx` | Aceita URL `blob:` para a prévia local da foto escolhida. |
| `app/hook/useUsuario.ts` | Adicionado `recarregar()` para tentar de novo após uma falha, sem cache. |
| **Novos** `app/components/perfil/PerfilView.tsx` | Visualização do perfil: capa, avatar sobreposto, título, localização, contato, contadores, cartão de progresso (só para o dono), abas Publicações/Projetos e cartão "Sobre". |
| `app/components/perfil/CapaPerfil.tsx` | Capa fixa da identidade visual (pontos conectados). Não é um upload. |
| `app/components/perfil/CampoFotoPerfil.tsx` | Seleção, arrastar e soltar, prévia, validação, descartar e remover (pendente até salvar). |
| `app/components/perfil/CamposProfissional.tsx` / `CamposEndereco.tsx` | Campos controlados, reaproveitados na edição e no completar cadastro. |
| `app/hook/useDadosPerfil.ts` | Busca o perfil profissional e o endereço do usuário na API. |
| `app/hook/useAvisoAlteracoes.ts` | Pede confirmação ao sair com alterações não salvas: aviso do navegador ao fechar a aba e diálogo ao clicar em links internos. |
| `app/lib/perfil.ts` | Validações, comparações e conversão para os DTOs. Limites reais: LinkedIn `VARCHAR(80)`, bairro/logradouro 155. Localização pública (só o estado) e completude do perfil. |
| `app/lib/imagemPerfil.ts` | Regras do `ImagemUploadUtil` (.jpg/.jpeg/.png/.webp, 10 MB) e verificação de que a imagem é realmente legível. |
| `app/services/perfilEdicao.service.ts` | Salvamento de foto, perfil profissional e endereço com os serviços existentes, mais as mensagens de erro por parte. |
| `tests/perfil.test.ts` | 10 testes novos (validações, DTOs, completude, regras de arquivo). |
| **Removido** `app/components/FormPerfilProfissional.tsx` | Substituído por `CamposProfissional`. Não era usado em nenhum outro lugar. |

## B. Funcionalidades

**Implementadas:** novo perfil (próprio e de terceiros); nova página de edição; fluxo de completar cadastro em etapas; cartão de progresso do perfil calculado com dados reais; aba de projetos com imagem e vínculo (Criador/Sócio…); publicações do usuário com curtir, comentar, editar e excluir (reaproveita o `PostCard`); compartilhar perfil (Web Share ou área de transferência); proteção contra perda de alterações; estados de carregamento, vazio e erro com "Tentar novamente".

**Corrigidas:**
- cadastro com telefone formatado (erro 500);
- foto: validação de arquivo corrompido ou com extensão trocada, remoção com confirmação;
- LinkedIn com mais de 80 caracteres (erro 500 no banco);
- perfis sem a largura total da tela.

**Foto em todo o sistema:** depois de salvar, o `AuthContext` é atualizado (`atualizarUsuarioLocal`), o cache de `GET /usuario/{id}` é invalidado e os dados são revalidados (`recarregarUsuario`). A nova foto aparece no perfil, no feed (compositor e cartões), nos comentários, em Explorar, na barra lateral, na coluna "Seu perfil" e na edição, sem precisar sair e entrar de novo.

## C. Integrações com o backend (somente endpoints existentes)

| Uso | Endpoint |
| --- | --- |
| Cadastro / login | `POST /usuario/cadastro-usuario`, `POST /usuario/login` |
| Dados do usuário | `GET /usuario/{id}?id={id}` (contorno já existente para a falta de `@PathVariable`) |
| Foto | `POST /usuario/{id}/foto` (multipart, campo `arquivo`), `DELETE /usuario/{id}/foto` |
| Perfil profissional | `GET /perfil-usuario`, `POST /perfil-usuario`, `PUT /perfil-usuario/{id}`, `GET /especialidade` |
| Localização | `GET /endereco`, `POST /endereco`, `PUT /endereco/{id}`, `DELETE /endereco/{id}` |
| Publicações e projetos | `GET /postagem`, `GET /projeto-usuario/usuario/{id}`, `GET /projeto`, `/curtida/...`, `/comentario` |

## D. Testes realizados

| Verificação | Resultado |
| --- | --- |
| `tsc --noEmit` (strict) | ✅ 0 erros |
| `eslint .` | ✅ 0 erros. 28 avisos `set-state-in-effect`, o mesmo padrão já documentado no `RELATORIO_TECNICO.md` |
| `vitest run` | ✅ 37/37 (10 novos) |
| `next build` | ✅ todas as rotas geradas |
| E2E Playwright (Chromium) contra um **stub de contrato** | ✅ **111/111** |

Resultados do E2E, organizados como no pedido:
1. Cadastro: 6/6
2. Completar cadastro: 17/17
3. Persistência (recarregar, sair e entrar): 11/11
4. Editar perfil: 11/11
5. Foto em todo o sistema, com e sem foto: 14/14
6. Erros (API, rede, upload, campos inválidos, salvar sem alterações, cancelar, perfil vazio): 15/15
7. Responsividade em 390/768/1024/1440 px, sem rolagem horizontal: 23/23
8. Regressão (rotas protegidas, login, admin, feed, explorar, projetos, configurações, cadastro duplicado): 13/13
9. Console do navegador sem erros inesperados: 1/1

**Não executado:** integração com o **backend real**. Ele exige Java 25 (o ambiente tem JDK 21), o Maven Central está bloqueado pelo proxy (403) e não há Docker. Para não declarar integrações não testadas, o E2E rodou contra um stub HTTP que reproduz o contrato lido no código Java: rotas, validações dos DTOs, `@PreAuthorize`, 403 sem token, formato do `GlobalExceptionHandler`, regras do `ImagemUploadUtil`, limites de coluna e o 500 do `GET /usuario/{id}` sem `?id`. O stub é uma ferramenta de teste e **não faz parte da entrega**. Também não foram testados Safari/Firefox nem leitores de tela reais.

**Recomendação antes de publicar:** rodar o fluxo de ponta a ponta contra o backend real com `UPLOAD_*` configurado.

## E. Limitações (dependem do backend)

1. **Nome, e-mail e telefone não podem ser editados.** Motivo: o bug do `PUT /usuario/{id}` descrito acima. Correção no servidor: ignorar `senhaUsuario` no `updateFromDTO` ou usar o `UsuarioUpdateDTO` que já existe e não é usado.
2. **Banner/capa não tem armazenamento.** A capa é uma arte fixa da marca e não há upload.
3. **Bio, sobre mim, cargo, empresa, formação, competências, interesses e nome de usuário não existem** no modelo e por isso não aparecem.
4. **O perfil profissional exige LinkedIn, CPF/CNPJ e especialidade juntos** (`@NotBlank`/`@NotNull`). Não dá para salvar só a área de atuação. A interface explica isso.
5. **Contas somente EMPRESA não conseguem salvar o perfil profissional** (`POST/PUT /perfil-usuario` só aceita ADMIN/USUARIO). A interface mostra uma mensagem específica.
6. **Localização mostra apenas o estado:** o backend não guarda cidade. O endereço completo nunca aparece no perfil, mas `GET /endereco` o expõe a qualquer usuário autenticado (problema de privacidade no servidor).
7. **Não há endpoints de busca "por usuário"** para perfil e endereço, então o front filtra as listagens completas.

## F. Preservação do backend

Antes de começar, o backend extraído foi colocado em somente leitura (`chmod -R a-w`) e foram calculados os SHA-256 dos **403 arquivos**. Ao final, os hashes foram recalculados: **idênticos**. Uma nova extração do ZIP original também foi comparada (`diff -r`): **idêntica**. SHA-256 do ZIP recebido: `09fa11de92dd38e23882a3c88d9927576411b3afd96f40b4879f4327dc03df44`. A entrega contém **apenas o front-end**.
