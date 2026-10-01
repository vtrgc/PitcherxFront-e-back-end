"use client";

import { useState } from "react";
import { CHAVE_ANIMAR, ID_ESPERA, ROTA_SEM_ANIMACAO } from "./constantes";

const ID = "hx-script-inicial";

/**
 * Roda antes da primeira pintura (só na carga do documento).
 *
 * 1. Com "movimento reduzido" no sistema (e sem ter escolhido a versão animada), esconde a Home e
 *    leva direto para a página sem animação — nada da experiência chega a aparecer.
 * 2. Em recarga, volta no histórico ou
 * link com #hash, o navegador restaura a rolagem no meio da história: escondemos o palco até o
 * motor desenhar a cena certa (evita o "flash" da cena 01). Se o motor não subir em 4 s, o palco
 * reaparece mesmo assim.
 *
 * Numa navegação dentro do app (client-side) o script não é renderizado: a rolagem começa no
 * topo e o React não executa scripts inline — renderizá-lo só geraria um aviso.
 */
const CODIGO = `(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches){var q;try{q=localStorage.getItem('${CHAVE_ANIMAR}')}catch(e){}if(q!=='1'){var o=document.createElement('style');o.textContent='.hx-home{visibility:hidden!important}';document.head.appendChild(o);location.replace('${ROTA_SEM_ANIMACAO}');return}}var n=performance.getEntriesByType('navigation')[0];if((n&&n.type!=='navigate')||location.hash||window.scrollY>0){var s=document.createElement('style');s.id='${ID_ESPERA}';s.textContent='.hx-home .hx-palco>*{visibility:hidden!important}';document.head.appendChild(s);setTimeout(function(){var e=document.getElementById('${ID_ESPERA}');if(e)e.remove()},4000)}}catch(e){}})();`;

export default function ScriptInicial() {
  // No servidor e na hidratação o <script> existe no HTML; numa navegação client-side, não.
  const [noDocumento] = useState(() => typeof document === "undefined" || !!document.getElementById(ID));
  return noDocumento ? <script id={ID} dangerouslySetInnerHTML={{ __html: CODIGO }} /> : null;
}
