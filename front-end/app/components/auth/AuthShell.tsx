import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import "@fontsource-variable/archivo/wdth.css";
import "./auth.css";

/**
 * Moldura visual compartilhada pelas telas de login e cadastro.
 * Lateral violeta (marca, mensagem e ilustração) + folha branca com o formulário.
 * Não contém lógica de autenticação: o formulário entra via `children`.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="ax-root">
      <div className="ax-panel">
        <aside className="ax-side">
          <Link href="/" className="ax-logo" aria-label="PitcherX, página inicial">
            <span className="ax-logo-tile">
              <Image src="/home/logo-mark.png" alt="" width={30} height={37} priority className="h-[29px] w-auto" />
            </span>
            <span className="ax-wordmark">
              Pitcher<span>X</span>
            </span>
          </Link>

          <p className="ax-side-title">Grandes ideias começam com as conexões certas.</p>
          <p className="ax-side-text">
            Publique seu projeto, encontre sócios e investidores e feche acordos em um só lugar.
          </p>

          <div className="ax-art" aria-hidden="true">
            <Image src="/auth/pitch-scene.svg" alt="" width={720} height={520} priority unoptimized />
          </div>
        </aside>

        <section className="ax-form-area">{children}</section>
      </div>
    </main>
  );
}
