import Link from "next/link";
import { ReactNode } from "react";
import Avatar from "../ui/Avatar";

/**
 * Linha de uma pessoa em listas de conexões (seguidores, seguindo, solicitações, sugestões).
 * O `identificador` do ConexaoSimplesDTO é o CPF/CNPJ do perfil: dado pessoal, nunca exibido.
 */
export default function PessoaItem({
  id,
  nome,
  imagem,
  detalhe,
  children,
}: {
  id: number;
  nome: string;
  imagem?: string | null;
  detalhe?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 py-3.5 last:border-b-0">
      <Link href={`/perfil/${id}`} className="group flex min-w-0 flex-1 items-center gap-3">
        <Avatar url={imagem} nome={nome} tamanho={44} />
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-semibold text-ink-900 group-hover:underline">{nome}</span>
          {detalhe && <span className="block truncate text-[12.5px] text-ink-400">{detalhe}</span>}
        </span>
      </Link>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </li>
  );
}
