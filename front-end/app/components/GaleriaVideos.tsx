import { resolverUrlImagem } from "../lib/image";

/** Lista de vídeos enviados ao backend (servidos em /videos/**, rota pública). */
export default function GaleriaVideos({ videos, titulo, className = "" }: { videos: string[]; titulo: string; className?: string }) {
  const urls = videos.map((v) => resolverUrlImagem(v)).filter((v): v is string => !!v);
  if (urls.length === 0) return null;
  return (
    <div className={`grid gap-4 ${urls.length > 1 ? "sm:grid-cols-2" : ""} ${className}`}>
      {urls.map((url, i) => (
        <video
          key={url}
          src={url}
          controls
          preload="metadata"
          playsInline
          className="aspect-video w-full rounded-xl border border-ink-100 bg-void object-contain"
          aria-label={`${titulo} — vídeo ${i + 1} de ${urls.length}`}
        />
      ))}
    </div>
  );
}
