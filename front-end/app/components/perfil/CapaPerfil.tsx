import ImagemRemota from "../ImagemRemota";

/**
 * Capa do perfil. Quando o perfil profissional tem banner (`urlBanner`, enviado por
 * POST /perfil-usuario/{id}/banner), a imagem cobre a arte. Sem banner — ou se a imagem
 * falhar ao carregar — aparece a arte da identidade do PitcherX (pontos ligados por linhas).
 *
 * A variação da arte é derivada do id do usuário apenas para que perfis diferentes não
 * fiquem idênticos; não representa nenhum dado do usuário.
 */
export default function CapaPerfil({
  semente = 1,
  url,
  className = "",
}: {
  semente?: number;
  url?: string | null;
  className?: string;
}) {
  const s = Math.abs(Math.floor(semente)) || 1;
  const rnd = (i: number) => {
    const x = Math.sin(s * 97.13 + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const nos = Array.from({ length: 9 }, (_, i) => ({
    x: 560 + rnd(i) * 420,
    y: 18 + rnd(i + 40) * 180,
    r: 1.6 + rnd(i + 80) * 2.2,
  }));
  const ligacoes: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [7, 8], [4, 8], [2, 6],
  ];

  return (
    <div className={`relative overflow-hidden bg-void ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(90%_140%_at_85%_0%,rgba(124,60,245,0.55)_0%,rgba(124,60,245,0)_60%),radial-gradient(60%_120%_at_0%_100%,rgba(86,19,190,0.45)_0%,rgba(86,19,190,0)_65%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`pontos-${s}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill="rgba(235,224,255,0.10)" />
          </pattern>
        </defs>
        <rect width="1000" height="220" fill={`url(#pontos-${s})`} />
        <g stroke="rgba(216,198,255,0.28)" strokeWidth="1">
          {ligacoes.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={nos[a].x} y1={nos[a].y} x2={nos[b].x} y2={nos[b].y} />
          ))}
        </g>
        <g>
          {nos.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={i === 3 ? "#FF80BE" : "rgba(235,224,255,0.75)"} />
          ))}
        </g>
      </svg>
      <ImagemRemota url={url} alt="" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
    </div>
  );
}
