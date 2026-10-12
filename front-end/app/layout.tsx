import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { NotificacoesProvider } from "./context/NotificacoesContext";

export const metadata: Metadata = {
  title: "PitcherX — Conecte ideias a oportunidades",
  description: "PitcherX é a plataforma que conecta criadores de projetos a profissionais, propostas e contratos em um só lugar.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {/* FeedbackProvider por fora: o NotificacoesProvider usa os avisos (toasts). */}
          <FeedbackProvider>
            <NotificacoesProvider>{children}</NotificacoesProvider>
          </FeedbackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
