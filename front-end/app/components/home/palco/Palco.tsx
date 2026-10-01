import Image from "next/image";
import Celular from "./Celular";
import Laptop from "./Laptop";
import Indicador from "./Indicador";
import Cena01Ideia from "../cenas/Cena01Ideia";
import Cena02Celular from "../cenas/Cena02Celular";
import Cena03PitcherX from "../cenas/Cena03PitcherX";
import Cena04Criacao from "../cenas/Cena04Criacao";
import Cena05Publicacao from "../cenas/Cena05Publicacao";
import Cena06Descoberta from "../cenas/Cena06Descoberta";
import Cena07Interessado from "../cenas/Cena07Interessado";
import Cena08Analise from "../cenas/Cena08Analise";
import Cena09Conexao from "../cenas/Cena09Conexao";
import Cena10Conclusao from "../cenas/Cena10Conclusao";
import DemoNota from "../demo/DemoNota";
import DemoFeed, { DemoToast } from "../demo/DemoFeed";
import DemoFormProjeto from "../demo/DemoFormProjeto";
import DemoProjeto from "../demo/DemoProjeto";
import DemoPerfil from "../demo/DemoPerfil";
import DemoPostCard from "../demo/DemoPostCard";
import { DemoComentarios } from "../demo/DemoComentario";
import { PaginaApp } from "../demo/DemoTela";
import { TelaNotebook } from "../demo/DemoNotebook";
import { COMENTARIO, CRIADORA, ETIQUETA_FICTICIA, INTERESSADO, RESPOSTA } from "../demo/dados";

/**
 * Palco cinematográfico: uma trilha alta (espaço de rolagem) com um palco fixo (sticky)
 * de 100svh. Tudo que aparece nas cenas 01–10 vive aqui como camadas; a timeline-mestra
 * (motion/mestra.ts) move essas camadas conforme o scroll.
 *
 * "Atores" que atravessam várias cenas ficam no palco (não em uma cena só):
 *  - cel-a: o celular da criadora (cenas 03–06 e 09)
 *  - cel-b: o celular do interessado (08–09)
 *  - lap:   o notebook do interessado (08–09, desktop e tablet)
 *  - cartao: a MESMA publicação, da cena 05 à 09
 */
export default function Palco() {
  return (
    <div data-hx="trilha" className="hx-trilha">
      <div data-hx="palco" className="hx-palco">
        <div className="hx-fundo" aria-hidden="true">
          <span data-hx="luz-quente" className="hx-luz hx-luz--quente" />
          <span data-hx="luz-fria" className="hx-luz hx-luz--fria" />
        </div>

        <Cena01Ideia />
        <Cena07Interessado />
        <Cena08Analise />
        <Cena10Conclusao />
        <Cena06Descoberta />

        {/* ---------------- atores ---------------- */}
        <Celular hx="cel-a" luz="quente">
          <DemoNota />
          <div data-hx="a-logo" className="hx-pagina-logo">
            <Image src="/home/logo-mark.png" alt="" width={475} height={584} sizes="120px" className="hx-pagina-logo-img" />
            <p className="hx-pagina-logo-marca">
              Pitcher<span>X</span>
            </p>
          </div>
          <PaginaApp hx="a-feed" hora="23:48" nav="feed" sobre={<DemoToast />}>
            <DemoFeed />
          </PaginaApp>
          <PaginaApp hx="a-projetos" hora="23:48" nav="projetos">
            <DemoFormProjeto />
          </PaginaApp>
          <PaginaApp hx="a-projeto" hora="23:48" nav="projetos">
            <DemoProjeto visao="criadora" prefixo="a" />
          </PaginaApp>
        </Celular>

        <Celular hx="cel-b" luz="fria">
          <PaginaApp hx="b-feed" hora="08:12" nav="feed">
            <DemoFeed
              comComposer={false}
              depoisDoSlot={
                <div data-hx="b-comentarios" className="hx-b-comentarios overflow-hidden">
                  <DemoComentarios prefixo="b-com" autor={INTERESSADO.nome} texto={COMENTARIO} outro={CRIADORA.nome} resposta={RESPOSTA} />
                </div>
              }
            />
          </PaginaApp>
          <PaginaApp
            hx="b-projeto"
            hora="08:14"
            nav="explorar"
            sobre={
              <div data-hx="b-folha" className="hx-folha">
                <span className="hx-folha-alca" />
                <DemoPerfil compacto semente={9} />
              </div>
            }
          >
            <DemoProjeto visao="visitante" prefixo="b" />
          </PaginaApp>
        </Celular>

        <Laptop hx="lap">
          <TelaNotebook prefixo="l" />
        </Laptop>

        <Cena09Conexao />

        <div data-hx="cartao" className="hx-cartao" aria-hidden="true">
          <span data-hx="cartao-sombra" className="hx-cartao-sombra" />
          <DemoPostCard comComentarios comResposta />
          <span data-hx="cartao-anel" className="hx-cartao-anel" />
        </div>

        {/* ---------------- textos ---------------- */}
        <Cena02Celular />
        <Cena03PitcherX />
        <Cena04Criacao />
        <Cena05Publicacao />

        <p data-hx="etiqueta" className="hx-etiqueta" aria-hidden="true">
          {ETIQUETA_FICTICIA}
        </p>
        <Indicador />
      </div>
    </div>
  );
}
