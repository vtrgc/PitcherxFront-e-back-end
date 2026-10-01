# /como-funciona — página inicial sem animação

A mesma história da experiência animada (`/`), em seções comuns, para quem prefere ler,
tem "movimento reduzido" no sistema ou está sem JavaScript.

- `app/como-funciona/page.tsx` — rota e metadados.
- `Secoes.tsx` — hero, faixa de recursos, "como funciona" (grade), ferramentas, para quem é,
  perguntas, chamado final e rodapé.
- `textos.ts` — **todos os textos**. Regra: só o que o produto faz hoje (ver comentário no arquivo).
  Nada de números de uso, depoimentos, notas ou logos de parceiros; os números que aparecem são
  regras reais (2.000 caracteres, 4 papéis). Mensagens/notificações não existem ainda; pagamentos
  e investimentos não passam pela plataforma.
- `CartoesApp.tsx` — recortes das telas reais (perfil, projeto, publicação, equipe, Explorar) com os
  dados fictícios de `home/demo/dados.ts`, marcados como "Interface ilustrativa · dados fictícios".
- `AcoesSessao.tsx` / `Cabecalho.tsx` — botões conforme a sessão (visitante, usuário, admin), só rotas reais.
- `LinkAnimada.tsx` — volta para `/` e guarda a escolha (quem tem movimento reduzido não é redirecionado de novo).
- `como-funciona.css` — estilos escopados em `.cf`. Sem animações de rolagem.

## Imagens (`public/como-funciona/`)

Renderizações 3D feitas para esta página (Blender/Cycles), sem pessoas e sem texto:
`telhado` (hero, 16:9 e 9:16), `caderno` (4:5), `conversa` (3:4) e `planta` (esboço a lápis,
fundo do chamado final). AVIF + WebP em várias larguras (`imagens.ts`).
