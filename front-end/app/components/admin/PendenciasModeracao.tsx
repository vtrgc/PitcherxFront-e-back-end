"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileCheck2, Flag } from "lucide-react";
import { cls } from "../ui/estilos";
import { listarDenunciasPendentes } from "../../services/denuncia.service";
import { listarIdentidadesPendentes } from "../../services/usuario.service";

/** Atalhos com o que aguarda o administrador (denúncias e identidades pendentes). */
export default function PendenciasModeracao() {
  const [denuncias, setDenuncias] = useState<number | null>(null);
  const [identidades, setIdentidades] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    listarDenunciasPendentes(0, 200)
      .then((l) => ativo && setDenuncias((l ?? []).length))
      .catch(() => ativo && setDenuncias(-1));
    listarIdentidadesPendentes(0, 1)
      .then((p) => ativo && setIdentidades(p.total))
      .catch(() => ativo && setIdentidades(-1));
    return () => {
      ativo = false;
    };
  }, []);

  const itens = [
    { href: "/admin/denuncias", rotulo: "Denúncias pendentes", valor: denuncias, icone: Flag, cor: "bg-red-50 text-red-700" },
    { href: "/admin/identidades", rotulo: "Identidades para analisar", valor: identidades, icone: FileCheck2, cor: "bg-amber-50 text-amber-800" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {itens.map(({ href, rotulo, valor, icone: Icone, cor }) => (
        <Link key={href} href={href} className={`${cls.card} flex items-center gap-3 p-4 hover:border-brand-200`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cor}`}>
            <Icone size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold text-ink-500">{rotulo}</span>
            <span className="font-display text-[1.35rem] font-extrabold text-ink-900">
              {valor === null ? <span className={`${cls.skeleton} inline-block h-6 w-10 rounded`} /> : valor < 0 ? "—" : valor.toLocaleString("pt-BR")}
            </span>
          </span>
          <ChevronRight size={17} className="text-ink-400" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
