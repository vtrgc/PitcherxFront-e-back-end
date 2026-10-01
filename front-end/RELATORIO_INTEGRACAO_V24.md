# PitcherX — Auditoria front × back (backend até a migration V24)

Escopo: somente o front-end foi alterado. O backend foi usado como referência (somente leitura);
SHA-256 dos 424 arquivos do backend antes e depois: idênticos.

## Principais achados

O front havia sido escrito contra um backend anterior às migrations V22–V24. Faltavam:

- todo o módulo `/conexao` (seguir, aceitar/recusar, remover, seguidores, seguindo, solicitações
  pendentes/enviadas, contadores, status entre usuários);
- notificações (`/conexao/notificacoes`, não lidas, marcar uma/todas) — a tela era um placeholder;
- banner do perfil (`POST/DELETE /perfil-usuario/{id}/banner`);
- galerias de imagens (`PUT/DELETE /postagem/{id}/imagens` e `/projeto/{id}/imagens`);
- busca de projetos no servidor (`GET /projeto/buscar`);
- edição e curtida de subcomentários;
- rota `/admin/tipos-projeto`.

Bugs de contrato corrigidos no front:

- `SubComentarioResponseDTO.usuarioId` chega nulo (o mapper não o preenche): a tela mostrava
  "Usuário #null" e link `/perfil/null`. Agora mostra "Participante" e reconhece as respostas do
  próprio usuário (IDs devolvidos pelo POST ficam registrados no navegador) para editar/excluir.
- Limite de URL de imagem de projeto era 155 (V7); a V24 ampliou para 2048.
- O campo "URL da imagem" aparecia na edição de projeto, mas o `PUT /projeto` o ignora.
- O contador de notificações/sidebar diziam "Em breve".

## Telas criadas

`/conexoes`, `/termos`, `/admin/tipos-projeto`; `/notificacoes` reescrita.

## Telas corrigidas/ampliadas

Perfil (capa real com upload/remoção, seguir com todos os estados, "Segue você", aceitar/recusar,
contadores clicáveis), feed/postagem (galeria com visualizador, envio de imagens ao publicar e
editar, remover imagens), respostas, projetos (busca no servidor por nome/descrição/data,
imagens na criação), detalhe do projeto (galeria para membros e admin), Explorar (seguir),
coluna lateral (contadores, solicitações, sugestões reais no lugar de texto fixo), configurações
(dados da conta, sessão, atalhos), admin de postagens (moderação de imagens), admin de termos de
postagem/vínculo (cadastro/edição quando o token tiver a role USUARIO/EMPRESA).

## Limitações reais do backend (não resolvíveis só no front)

1. `PUT /usuario/{id}` grava a senha em texto puro (`updateFromDTO` sobrescreve o hash): nome,
   e-mail e telefone continuam somente leitura.
2. O ID da conexão não aparece em `StatusConexaoDTO` nem em `ConexaoSimplesDTO`. O front o obtém
   das respostas de solicitar/aceitar/recusar (guardadas no navegador) ou do `referenciaId` das
   notificações; quando não há como identificar com segurança (ex.: solicitação enviada em outro
   dispositivo), a ação é bloqueada com explicação.
3. `SubComentarioResponseDTO.usuarioId` sempre nulo: autoria de respostas de outras pessoas não é
   exibida; a própria só é reconhecida no navegador em que foi criada.
4. `/usuario/validar-token` responde 204 mesmo com código inválido; a validação real acontece no
   `/usuario/resetar-senha`.
5. `POST/PUT /contrato` exige a role `EMPRESARIO`, que não existe: contas só EMPRESA recebem 403.
6. `POST/PUT /termo-postagem` e `/termo-vinculo` não aceitam ADMIN (somente USUARIO/EMPRESA).
7. Não há endpoints de mensagens: `/mensagens` continua informando isso.
8. Proposta/contra-proposta não têm autor, status nem vínculo com projeto no modelo.
9. Notificações só são geradas para eventos de conexão.

## Validação

- `npm run typecheck`: sem erros
- `npm run lint`: 0 erros (33 avisos `react-hooks/set-state-in-effect`, regra configurada como aviso)
- `npm run test`: 61 testes passando (7 arquivos)
- `npm run build`: sucesso (39 rotas)

Observação de ambiente: no Windows, caminhos muito longos quebram o Vitest 5
(`ERR_PACKAGE_IMPORT_NOT_DEFINED`). Rode o projeto em um caminho curto (ou via `subst`).
