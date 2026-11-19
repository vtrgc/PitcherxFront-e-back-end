# Testes ponta a ponta do PitcherX

Cinco roteiros que usam o **front e o backend rodando de verdade** (nada é simulado):

| Arquivo | O que testa |
| --- | --- |
| `api_auditoria.py` | Todos os endpoints do backend (187), fluxos completos e regras de permissão: cadastro, foto de verificação enviada sem login, aprovação de identidade, código de verificação (conta certa, reenvio), login, recuperação de senha, perfil, projetos, propostas, contrapropostas, contratos, publicações, curtidas, comentários, conexões, notificações, denúncias, administração e tokens inválidos. Mostra a cobertura de endpoints no final. |
| `negociacao_navegador.js` | Playwright: cadastro (vazio, inválido, e-mail duplicado, válido), aprovação pelo admin, código de verificação no primeiro acesso, criar/editar/excluir projeto, acesso sem permissão, proposta, contrapropostas (rejeitar, nova, aceitar), aceite final, recusa e telas no celular. |
| `mensagens_navegador.js` | Playwright, duas pessoas em navegadores separados: botão "Enviar mensagem" só com conexão aceita, aviso de conexão pendente, envio e recebimento sem recarregar, contador de não lidas, "Vista", editar e apagar, queda de rede (aviso e reenvio sem duplicar), conversa de terceiros, estado vazio, conexão removida (somente leitura), histórico após novo login e telas no celular. |
| `navegador_auditoria.js` | Playwright: abre todas as páginas (visitante, admin e usuários) em computador, tablet e celular, procurando erros de execução, respostas HTTP de erro, imagens quebradas, rolagem horizontal, texto ou botão saindo da tela e ícones espremidos; depois executa fluxos pela tela (logout, senha errada, redefinição de senha, código de verificação no primeiro acesso, edição da conta, foto, capa, biografia, publicar, curtir, comentar, buscar, seguir, trocar senha, cadastros do admin). |
| `auditoria_funcional.js` | Playwright, fluxos que os outros roteiros não cobrem: rotas protegidas, redirecionamento após login, sessão expirada, código de redefinição errado; publicação com imagem, edição, compartilhar, comentário, denúncia, busca, "Carregar mais" e exclusão; progresso do perfil, seguir/aceitar, contadores e dados ocultos de terceiros; bloqueio das rotas de admin, CRUD de áreas/subáreas/especialidades com busca e paginação, usuários (desativar, perfis), endereços; valores do projeto, captação, galeria, termos, voto de empresa, proposta aceita, contrato aceito pela outra parte; página 404, erro 500 e queda de rede. Itens que dependem de mudança no backend aparecem como "pendência de backend" (não contam como reprovação). |

Os dados são criados com e-mails aleatórios e nada que já exista no banco é apagado.

## Como rodar

1. Suba o backend (`back-end/`) e o front (`front-end/`, porta 3000, com `BACKEND_URL` apontando para o backend).
2. Defina as variáveis (não deixe credenciais gravadas em arquivos):

   ```bash
   export ADMIN_EMAIL=...            # conta administradora
   export ADMIN_SENHA=...
   export MAILS_LOG=/caminho/mails.log   # opcional, veja abaixo
   ```

3. Execute:

   ```bash
   python3 e2e/api_auditoria.py
   node e2e/navegador_auditoria.js     # requer o pacote playwright instalado
   node e2e/negociacao_navegador.js
   node e2e/mensagens_navegador.js
   node e2e/auditoria_funcional.js
   ```

   Responsividade em seis tamanhos (computador 1920, notebook 1366, tablet paisagem e retrato,
   celular 390 e 360), só a varredura de páginas, com capturas do celular pequeno em `SAIDA_DIR/responsivo`:

   ```bash
   TELAS=completo SOMENTE_PAGINAS=1 SAIDA_DIR=/tmp/resp node e2e/navegador_auditoria.js
   ```

`MAILS_LOG` aponta para o arquivo em que um SMTP de teste grava as mensagens (separadas por uma
linha `=====`); os testes leem dali os códigos de verificação de conta e de redefinição de senha.
No `api_auditoria.py` e no `navegador_auditoria.js` ele é opcional (sem ele, esses fluxos aparecem como "não testado"); no
`negociacao_navegador.js`, no `mensagens_navegador.js` e no `auditoria_funcional.js` ele é necessário, porque o primeiro acesso de cada
conta pede o código do e-mail. Para listar a cobertura de endpoints, gere a lista com os mapeamentos dos
controllers e passe em `ENDPOINTS_TXT` (uma linha por endpoint: `MÉTODO /caminho/{id}`).

Os roteiros terminam com código 0 quando tudo passa e 1 quando há alguma verificação reprovada.
