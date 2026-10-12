/**
 * Endereço do PitcherX-BackEnd (sem barra no final). O navegador não chama o backend
 * direto: tudo passa por `/api-backend/*` (mesma origem do front) e o Next repassa para cá.
 * Assim o CORS do backend não interfere — o SecurityConfig atual não habilita CORS no
 * Spring Security e recusa o "preflight" (OPTIONS) das requisições com token (403).
 */
const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");

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
    return [{ source: "/api-backend/:path*", destination: `${BACKEND_URL}/:path*` }];
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
