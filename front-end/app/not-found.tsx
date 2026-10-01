import Link from "next/link";
import { cls } from "./components/ui/estilos";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className={cls.eyebrow}>Erro 404</p>
      <h1 className="font-display mt-3 text-[2rem] font-extrabold text-ink-900">Página não encontrada</h1>
      <p className={`${cls.texto} mt-2 max-w-md`}>O endereço acessado não existe ou foi movido.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cls.btnSecundario}>
          Página inicial
        </Link>
        <Link href="/feed" className={cls.btnPrimario}>
          Ir para a plataforma
        </Link>
      </div>
    </main>
  );
}
