# Integração com o PitcherX-BackEnd atualizado

Front-end ajustado para usar **todos** os recursos do backend enviado (`PitcherX-BackEnd-main`),
sem nenhuma alteração no servidor. Endpoints mapeados: ~170 em 29 controllers.

## O que foi implementado

| Área | Endpoints | Onde |
| --- | --- | --- |
| Denúncias (reais, substituem o registro local) | `POST /denuncia`, `GET /denuncia/me`, `GET /denuncia/categorias`, `POST /denuncia/{id}/apelacao` | Modal de denúncia (publicação, comentário, projeto e **perfil**), `/denuncias` |
| Moderação | `GET /denuncia/admin/pending`, `GET /denuncia/admin/{id}`, `PUT .../decisao`, `PUT .../apelacao/decisao` | `/admin/denuncias` |
| Identidade | `POST /usuario/{id}/comprovante-identidade`, `GET /usuario/admin/identidade-pendentes`, `POST /usuario/admin/analise-identidade/{id}` | Configurações → Verificação; `/admin/identidades` |
| Nível de conta | `GET /nivel-conta`, `PUT /usuario/admin/nivel-conta/{id}` | Configurações, perfil, `/admin/usuarios` |
| Propostas | `GET /proposta/projeto/{id}`, `PUT /proposta/aceitar/{id}`, `PUT /proposta/recusar/{id}`, `projetoId` no cadastro | `/propostas` (abas), `/propostas/[id]`, página do projeto |
| Contrapropostas | `GET /contra-proposta/projeto/{id}`, `me/criadas`, `me/recebidas`, `PUT /{id}/aceitar`, `PUT /{id}/rejeitar` | `/propostas` e `/propostas/[id]` |
| Contratos | `propostaId` obrigatório, `PUT /contrato/{id}/aceitar`, `GET /termo/contrato/{id}` | `/contratos`, `/contratos/[id]` |
| Projeto | `investimentoMinimo`, `participacaoOferecida`, `usoRecursos` (campos reais), `PUT/DELETE /projeto/{id}/videos`, `POST /{id}/visualizar`, `POST /{id}/seguir`, `GET /projeto/usuario/{id}`, `GET /projeto/visualizar/{id}` | Formulário e página do projeto |
| Vídeos | `PUT/DELETE /postagem/{id}/videos`, `POST/DELETE /perfil-usuario/{id}/video` | Criar/editar publicação, editar perfil |
| Recomendações | `GET /recomendacoes/projetos/{userId}` | Feed e Explorar → Projetos |
| Notificações | novos tipos (contrapropostas, denúncias, identidade, nível) com atalho para a tela certa | `/notificacoes` |

Painel do admin ganhou atalhos de pendências (denúncias e identidades).

## Defeitos do backend encontrados nos testes (contornados no front)

1. **`PropostaResponseDTO` sempre vem com `idProposta` e `projetoId` nulos** (`PropostaMapper.toDTO`
   ignora o id e não mapeia o projeto). O front reconstrói os dois campos com `GET /proposta/{id}` e
   `GET /proposta/projeto/{id}` (`proposta.service.ts`). Isso gera alguns 404 esperados no console.
2. **Aprovar/reprovar identidade responde 500 e desfaz a análise**: faltam os modelos
   `identidade-aprovada.html` e `identidade-reprovada.html` em `src/main/resources/templates`.
   Em `/admin/identidades`, se a aprovação falhar, o admin pode ativar a conta por
   `PUT /usuario/ativar-desativar/{id}` (a identidade continua "pendente" no servidor).
3. **Contas novas nascem inativas e o login recusa contas inativas**, então o próprio usuário não
   consegue enviar o comprovante antes da aprovação. O admin pode anexá-lo por ele.
4. `GET /recomendacoes/projetos/{id}` dá 500 para quem ainda não tem perfil profissional (o bloco some).
5. `POST /projeto/{id}/visualizar` dá 500 a partir da 2ª visita da mesma pessoa (restrição única no
   banco); o front só registra a primeira.
6. `PUT /perfil-usuario/{id}` grava nulos nos campos não enviados: o front reenvia capa e vídeo.
7. `POST /projeto/{id}/seguir` alterna o estado e não há como consultá-lo: o front lembra o último estado.
8. As migrations antigas (V7…) não rodam num banco vazio; nos testes o schema foi criado pelo Hibernate.

## Testes executados

- `npm run typecheck`, `npm run lint` (0 erros), `npm test` (110 testes) e `npm run build`.
- Backend rodando localmente (Postgres + SMTP falso) com 58 verificações de API ponta a ponta.
- Navegador (Playwright) logado como admin, criador e investidor: 45 páginas sem erro de
  execução, fluxo proposta → aceite, denúncia → moderação, vídeos, e 7 telas no celular sem
  rolagem horizontal.
