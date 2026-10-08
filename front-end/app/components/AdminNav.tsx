"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutGrid,
  Award,
  Home,
  FileSignature,
  Tag,
  Link2,
  ShieldCheck,
  Tags,
  Briefcase,
  FileText,
  Activity,
  IdCard,
  HandCoins,
} from "lucide-react";



export const SECOES_ADMIN = [
  { href: "/admin/usuarios", titulo: "Usuários", icon: Users },
  { href: "/admin/projetos", titulo: "Projetos", icon: Briefcase },
  { href: "/admin/postagens", titulo: "Postagens", icon: FileText },
  { href: "/admin/interacoes", titulo: "Interações", icon: Activity },
  { href: "/admin/propostas", titulo: "Propostas", icon: HandCoins },
  { href: "/admin/tipos-projeto", titulo: "Tipos de projeto", icon: Tags },
  { href: "/admin/areas", titulo: "Áreas", icon: LayoutGrid },
  { href: "/admin/subareas", titulo: "Subáreas", icon: LayoutGrid },
  { href: "/admin/especialidades", titulo: "Especialidades", icon: Award },
  { href: "/admin/perfis", titulo: "Perfis profissionais", icon: IdCard },
  { href: "/admin/enderecos", titulo: "Endereços", icon: Home },
  { href: "/admin/termos", titulo: "Termos de contrato", icon: FileSignature },
  { href: "/admin/termos-postagem", titulo: "Termos de postagem", icon: Tag },
  { href: "/admin/termos-vinculo", titulo: "Termos de vínculo", icon: Link2 },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-ink-100 px-4 py-8 xl:block">
        <div className="flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <ShieldCheck size={16} />
          </span>
          <div>
            <p className="text-[13px] font-bold text-ink-900">Admin</p>
            <p className="text-[0.75rem] text-ink-400">Painel do backend</p>
          </div>
        </div>

        <nav className="mt-6 space-y-0.5">
          <Link
            href="/admin"
            className={`block rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
              pathname === "/admin" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            }`}
          >
            Dashboard
          </Link>

          <div className="my-3 h-px bg-ink-100" />

          {SECOES_ADMIN.map(({ href, titulo, icon: Icon }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                  ativo ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <Icon size={16} className={ativo ? "text-brand-600" : "text-ink-400"} />
                {titulo}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-ink-100 px-4 py-3 xl:hidden">
        <Link
          href="/admin"
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
            pathname === "/admin" ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500"
          }`}
        >
          Dashboard
        </Link>
        {SECOES_ADMIN.map(({ href, titulo }) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              pathname === href ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500"
            }`}
          >
            {titulo}
          </Link>
        ))}
      </div>
    </>
  );
}
