# Página inicial (`/`) — como funciona

Experiência controlada pelo scroll, em 11 cenas (10 no palco fixo + chamado final).

- `HomeExperience.tsx` — raiz; carrega o motor (GSAP + ScrollTrigger + Lenis) sob demanda e o desmonta ao sair.
- `palco/Palco.tsx` — o palco fixo e os "atores" que atravessam cenas (celular da criadora, celular e
  notebook do interessado e o **cartão da publicação**, um único elemento da cena 05 à 09).
- `cenas/CenaXX*.tsx` — cada arquivo exporta o DOM da cena e `timeline(tl, ctx)`, o trecho dela na timeline-mestra.
- `motion/mestra.ts` — geometria (enquadramento das fotos, poses, encaixes do cartão) e a timeline-mestra.
- `motion/duracoes.ts` — duração de cada cena em "vh de rolagem" (soma 1680 no desktop; ×0,85 tablet, ×0,7 celular).
  **Se mudar, ajuste a altura de `.hx-trilha` em `home.css`** (= soma + 100: hoje 1780 / 1528 / 1276 svh).
- `demo/*` — réplicas visuais do app, **sem API**; textos fictícios em `demo/dados.ts`.
- Não há versão estática aqui. A versão sem animação é outra página: **`/como-funciona`**
  (`app/components/como-funciona/`). Vão para ela:
  - quem clica em "Sem animação" (header) ou "Veja como o PitcherX funciona" (cena final);
  - quem tem "movimento reduzido" no sistema — o script inicial redireciona antes da primeira pintura,
    a menos que a pessoa tenha escolhido a animação em /como-funciona
    (`localStorage["pitcherx:home-animada"] = "1"`; o link "Sem animação" apaga a escolha);
  - quem está sem JavaScript (`<noscript>` com `meta refresh` + link visível);
  - se o motor de animação falhar ao carregar.

## O scroll é a animação

- Um único palco `position: sticky` (100svh) dentro de uma trilha alta; uma timeline-mestra com `scrub`
  (no toque, `scrub: 0.35`); Lenis dá o "peso" da rodinha (`lerp 0.085`, `wheelMultiplier 0.85`). Sem snap.
- Cada quadro depende só da posição do scroll: subir desfaz exatamente o que a descida fez.
- Transições contínuas (nada de só fade): câmera avança na foto 01 → celular; cartão sai do celular e a
  plataforma entra de lado (06); o cartão vira a **máscara** que abre a foto 02 (07); panorâmica lateral
  foto 02 → foto 03, com o notebook entrando pela direita (08); linha SVG desenhada entre os aparelhos (09);
  zoom out em que os aparelhos voltam para dentro da foto 04 (10).
- O motor sobe logo depois da primeira pintura (ou no primeiro gesto de rolagem), em etapas curtas.
  Em recarga/volta, o palco só reaparece depois do `load` (quando a rolagem já foi restaurada).

## Desempenho: não troque `textContent` no palco

As regras `html:has(.hx-home)` fazem o Chrome recalcular o estilo do **documento inteiro** sempre que
um nó é inserido/removido dentro da Home. Trocar `textContent` substitui o nó de texto — por isso o
texto "digitado" e o indicador de cena usam `escreverTexto()` (`motion/util.ts`), que altera o nó que
já existe. Isso tirou ~110 ms (CPU 4× mais lenta) de cada campo digitado, na montagem e a cada quadro.

## Fotografias (`public/home/v2/`)

As imagens atuais são renderizações 3D feitas para esta página (Blender/Cycles): cenas sem pessoas,
com a tela dos aparelhos apagada. Para trocá-las por fotografias com os personagens:

1. Gere/fotografe cada cena em 16:9 (2400×1350) e 9:16 (1080×1920) com a tela do aparelho **vazia e de frente**.
2. Exporte em AVIF e WebP com os nomes `NN-nome-16x9-{1280,1920,2400}` e `NN-nome-9x16-{720,1080}`.
3. Em `fotos.ts`, atualize `tela` (x, y, largura e altura da tela, em fração da imagem) e `foco`.

Prompts sugeridos estão no relatório de planejamento (seção 8).

## Fonte

`public/home/v2/fonte/archivo-home.woff2` é um recorte da Archivo (SIL Open Font License 1.1 — ver `OFL.txt`):
só latim, larguras 86–92% e pesos 500–700.
