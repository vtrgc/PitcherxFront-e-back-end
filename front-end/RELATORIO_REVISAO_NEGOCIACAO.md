# Revisão: cadastro, projetos, propostas e contrapropostas

Tudo foi feito no front-end. Nenhum arquivo do backend foi alterado.

## Arquivos

**Novos:**
- `app/lib/autoriaProposta.ts`: identifica o autor de cada proposta.
- `app/lib/negociacao.ts`: calcula a situação da negociação conforme o papel de quem vê.
- `RELATORIO_REVISAO_NEGOCIACAO.md`: este relatório.

**Modificados:**
- Páginas: `app/auth/cadastro/page.tsx`, `app/propostas/page.tsx`, `app/propostas/[id]/page.tsx` (reescrita), `app/projetos/page.tsx`, `app/admin/identidades/page.tsx`.
- Componentes: `app/components/FormProjeto.tsx`, `app/components/projeto/PropostasDoProjeto.tsx`, `app/components/projeto/ChipsNegociacao.tsx`, `app/components/projeto/Recomendacoes.tsx`.
- Serviços, tipos e validação: `app/services/proposta.service.ts`, `app/types/Proposta.ts`, `app/lib/validacao.ts`.
- Testes: `tests/validacao.test.ts`, `tests/backendNovo.test.ts`.

## Melhorias

**Cadastro**
- Nome com 3 a 120 caracteres e com letras.
- Senha com letras e números, diferente do e-mail.
- E-mail duplicado indicado no próprio campo.
- Erros de validação do servidor mapeados para cada campo.
- Nova tela "Conta criada!" com os próximos passos (aguardar a aprovação, guardar o código de verificação, enviar o comprovante). Antes, o usuário era mandado para o login sem explicação.

**Projetos**
- Vídeos podem ser enviados já na criação.
- Investimento mínimo e participação são validados como obrigatórios, como exige o backend.

**Propostas**
- Autor identificado ("Enviada por Igor") e "Enviadas por mim" funcionando em qualquer dispositivo.
- A situação da negociação aparece para cada papel: recebida, enviada, contraproposta recebida, contraproposta aceita (aguardando o aceite final), aceita ou recusada. Há um destaque de "sua vez".
- Bloqueio de propostas duplicadas: só uma proposta em aberto por projeto.
- "Excluir" passou a se chamar "Cancelar proposta".

**Contrapropostas**
- Histórico da negociação em linha do tempo: proposta, cada contraproposta com autor, valor, status e datas, e o desfecho.
- Só uma contraproposta pendente por vez.
- Não é possível aceitar a proposta com uma contraproposta pendente, nem editar ou cancelar a proposta nessa situação.
- Rejeitar exige justificativa.
- Ao aceitar uma contraproposta, o valor da proposta é atualizado para o valor acordado. Assim, o aceite final soma ao arrecadado o valor certo (o backend soma o valor da proposta).

**Administração**
- A fila de identidades carrega todas as páginas e tem busca por nome ou e-mail.
- Novo filtro "Somente contas inativas". Antes, contas novas ficavam escondidas em outras páginas.

## Erros encontrados e corrigidos no front

- Após o cadastro, a conta (inativa) era redirecionada ao login sem explicação.
- O criador do projeto não sabia quem tinha enviado cada proposta.
- O criador podia mandar várias contrapropostas pendentes para a mesma proposta.
- O criador conseguia aceitar a proposta com uma contraproposta em aberto.
- A contraproposta aceita não mudava o valor que entrava no arrecadado.
- O admin não encontrava contas novas na fila de identidades.
- As recomendações geravam erro 500 para quem não tem perfil profissional; agora só são consultadas para quem tem.

## Testes

**Verificações:** typecheck sem erros, lint com 0 erros (43 avisos que já existiam), 112 testes unitários e build sem erros.

**Pela interface, com backend e Postgres reais:** 47 de 47 cenários aprovados.
- Cadastro: vazio, inválido, e-mail duplicado e válido.
- Login: bloqueado antes da aprovação; funciona e a sessão persiste depois da aprovação.
- Projetos: criar (com validações), ver, editar, excluir, e acesso de outra conta (sem editar ou excluir, e com o portão de termos).
- Propostas: enviar, proposta duplicada bloqueada, receber em outra conta com o nome do autor, aceitar e recusar.
- Contrapropostas: enviar; segunda contraproposta bloqueada; aceitar a proposta bloqueado enquanto há contraproposta pendente; rejeição sem justificativa bloqueada; rejeitar; nova contraproposta; aceitar.
- Resultado da negociação: valor atualizado, aceite final, investidor vira sócio, valor arrecadado correto, notificações recebidas.
- Celular: 5 telas sem rolagem horizontal.

**Regressão:** 58 de 58 verificações de API, e 45 páginas abertas sem erro de execução.

**Não testado:** o envio real de e-mails (foi usado um servidor de e-mail falso) e a aprovação de identidade pelo caminho normal, que sempre falha no backend (item 1 abaixo).

## Problemas que dependem do backend

1. Aprovar ou reprovar identidade dá erro 500 porque faltam os templates `identidade-aprovada.html` e `identidade-reprovada.html`. O front oferece ativar a conta como alternativa.
2. `PropostaResponseDTO` sempre vem sem `idProposta` e sem `projetoId`. O front reconstrói esses dados, o que gera 404 esperados no console.
3. A resposta da proposta não informa o autor. O front grava a autoria na descrição; serve para exibição, não como prova de identidade.
4. `PUT` e `DELETE /projeto/{id}` não verificam quem é o dono. O front só mostra essas ações ao criador, mas qualquer conta conseguiria editar ou excluir chamando a API diretamente.
5. O servidor aceita várias contrapropostas pendentes para a mesma proposta. O front impede.
6. A justificativa da rejeição não volta na resposta da contraproposta; ela só chega por notificação.
7. Conta nova não consegue entrar antes da aprovação, então não consegue enviar o próprio comprovante.
8. `POST /projeto/{id}/visualizar` dá erro 500 a partir da segunda visita da mesma pessoa.
