# Testes ponta a ponta do PitcherX

Dois roteiros que usam o **front e o backend rodando de verdade** (nada é simulado):

| Arquivo | O que testa |
| --- | --- |
| `api_auditoria.py` | Todos os endpoints do backend (176), fluxos completos e regras de permissão: cadastro, aprovação de identidade, login, recuperação de senha, perfil, projetos, propostas, contrapropostas, contratos, publicações, curtidas, comentários, conexões, notificações, denúncias, administração e tokens inválidos. Mostra a cobertura de endpoints no final. |
| `navegador_auditoria.js` | Playwright: abre todas as páginas (visitante, admin e usuários) em computador, tablet e celular, procurando erros de execução, respostas HTTP de erro, imagens quebradas e rolagem horizontal; depois executa fluxos pela tela (logout, senha errada, redefinição de senha, edição da conta, foto, capa, biografia, publicar, curtir, comentar, buscar, seguir, trocar senha, cadastros do admin). |

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
   ```

`MAILS_LOG` é opcional. Quando o backend envia e-mails para um SMTP de teste que grava as
mensagens nesse arquivo (separadas por uma linha `=====`), os testes leem os códigos de
verificação de conta e de redefinição de senha; sem ele, esses dois fluxos aparecem como
"não testado". Para listar a cobertura de endpoints, gere a lista com os mapeamentos dos
controllers e passe em `ENDPOINTS_TXT` (uma linha por endpoint: `MÉTODO /caminho/{id}`).

Os dois scripts terminam com código 0 quando tudo passa e 1 quando há alguma verificação reprovada.
