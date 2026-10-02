import { Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { CENAS, ROSTOS, foto } from "./fotosHero";

/**
 * Fundo do hero: fotos reais de pessoas (Unsplash) dos dois lados do título, como num mural de
 * rede social, com pequenos selos das ações que existem no PitcherX (curtir, comentar, conectar,
 * papéis na equipe). Decorativo: fica escondido de leitores de tela e some em telas estreitas.
 */

function Foto({
  cena,
  w,
  h,
  className,
  selo,
}: {
  cena: { id: string; alt: string };
  w: number;
  h: number;
  className: string;
  selo?: ReactNode;
}) {
  return (
    <div className={`fh-foto ${className}`} style={{ width: w, height: h }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Unsplash, já recortada pela URL */}
      <img src={foto(cena.id, w, h)} alt="" width={w} height={h} loading="eager" decoding="async" />
      {selo}
    </div>
  );
}

function Rosto({ id, tamanho, className, selo }: { id: string; tamanho: number; className: string; selo: ReactNode }) {
  return (
    <div className={`fh-rosto ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Unsplash, já recortada pela URL */}
      <img src={foto(id, tamanho, tamanho)} alt="" width={tamanho} height={tamanho} decoding="async" />
      {selo}
    </div>
  );
}

function Selo({ icone, children, tom = "claro" }: { icone?: ReactNode; children: ReactNode; tom?: "claro" | "roxo" }) {
  return (
    <span className={`fh-selo fh-selo--${tom}`}>
      {icone}
      {children}
    </span>
  );
}

export default function FundoHero() {
  return (
    <div className="fh" aria-hidden="true">
      <div className="fh-mural">
        {/* esquerda */}
        <Foto
          cena={CENAS.riso}
          w={196}
          h={244}
          className="fh-p1"
          selo={<Selo icone={<Heart size={12} fill="currentColor" />}>Curtiu</Selo>}
        />
        <Rosto id={ROSTOS.a} tamanho={76} className="fh-r1" selo={<Selo tom="roxo">Sócio</Selo>} />
        <Foto
          cena={CENAS.ideias}
          w={224}
          h={152}
          className="fh-p2"
          selo={<Selo icone={<MessageCircle size={12} />}>Comentou</Selo>}
        />

        {/* direita */}
        <Foto
          cena={CENAS.equipe}
          w={236}
          h={164}
          className="fh-p3"
          selo={<Selo icone={<Users size={12} />}>Equipe do projeto</Selo>}
        />
        <Rosto id={ROSTOS.b} tamanho={76} className="fh-r2" selo={<Selo tom="roxo">Investidor</Selo>} />
        <Foto
          cena={CENAS.dupla}
          w={184}
          h={228}
          className="fh-p4"
          selo={<Selo icone={<UserPlus size={12} />}>Conectar</Selo>}
        />
      </div>
    </div>
  );
}

/** Rostos sobrepostos acima do título (aparecem também no celular). */
export function RostosComunidade() {
  const ids = [ROSTOS.c, ROSTOS.d, ROSTOS.f, ROSTOS.e, ROSTOS.b];
  return (
    <div className="fh-grupo" aria-hidden="true">
      <span className="fh-grupo-fotos">
        {ids.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do CDN do Unsplash, já recortada pela URL
          <img key={id} src={foto(id, 34, 34)} alt="" width={34} height={34} decoding="async" />
        ))}
      </span>
      <span className="fh-grupo-texto">Criadores, sócios e investidores</span>
    </div>
  );
}
