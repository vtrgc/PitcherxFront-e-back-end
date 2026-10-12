/**
 * Endereço do PitcherX-BackEnd usado pelo proxy /backend (lido no build e no `next start`).
 * O navegador chama /backend/... na mesma origem do front-end e o Next repassa ao backend:
 * assim as chamadas não dependem de CORS (o SecurityConfig atual do backend não aplica a
 * configuração de CORS e recusa com 403 o preflight das rotas autenticadas).
 */
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Somente as fotos da página inicial (Unsplash) passam pelo otimizador do Next.
    // Imagens enviadas por usuários (URLs arbitrárias) são exibidas com <img>, para que o
    // servidor do front-end não funcione como proxy de qualquer host.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
