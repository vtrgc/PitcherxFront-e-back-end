"use client";

export interface BarDatum {
  label: string;
  value: number;
}

/** Corta o rótulo para caber na largura da barra (o texto completo fica no <title>). */
function rotuloCurto(label: string, maxCaracteres: number) {
  return label.length > maxCaracteres ? `${label.slice(0, Math.max(1, maxCaracteres - 1))}…` : label;
}

export default function BarChart({
  data,
  color = "#7C3CF5",
  height = 168,
  formatValue,
}: {
  data: BarDatum[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 30;
  const gap = 22;
  const width = Math.max(280, data.length * (barWidth + gap) + gap);
  // Com poucas barras, cada uma ganha uma faixa maior: os rótulos não se sobrepõem.
  const faixa = data.length > 0 ? (width - gap) / data.length : barWidth + gap;
  const maxCaracteres = Math.max(4, Math.floor(faixa / 6));
  const chartBottom = height - 26;
  const chartTop = 22;
  const resumo = data.map((d) => `${d.label}: ${formatValue ? formatValue(d.value) : d.value}`).join("; ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMinYMid meet"
        role="img"
        aria-label={resumo ? `Gráfico de barras. ${resumo}` : "Gráfico de barras sem dados"}
      >
        <line x1={0} y1={chartBottom} x2={width} y2={chartBottom} stroke="#EFEAFA" strokeWidth={1} />

        {data.map((d, i) => {
          const x = gap / 2 + i * faixa + (faixa - barWidth) / 2;
          const barHeight = d.value <= 0 ? 0 : Math.max(3, (d.value / max) * (chartBottom - chartTop));
          const y = chartBottom - barHeight;

          return (
            <g key={`${d.label}-${i}`}>
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 7}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight={700}
                  fill="#362C52"
                >
                  {formatValue ? formatValue(d.value) : d.value}
                </text>
              )}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={7}
                fill={color}
                opacity={0.88}
              />
              {d.value <= 0 && (
                <rect x={x} y={chartBottom - 2} width={barWidth} height={2} rx={1} fill="#DED4F0" />
              )}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#8F7FAE"
              >
                <title>{d.label}</title>
                {rotuloCurto(d.label, maxCaracteres)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
