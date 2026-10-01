import Image from "next/image";
import { Bell, Briefcase, Compass, FileSignature, HandCoins, House, MessageCircle, PlusSquare, Settings, User } from "lucide-react";
import Avatar from "../../ui/Avatar";
import { INTERESSADO } from "./dados";

const ITENS = [
  { label: "Início", icon: House, chave: "feed" },
  { label: "Explorar", icon: Compass, chave: "explorar" },
  { label: "Projetos", icon: Briefcase, chave: "projetos" },
  { label: "Propostas", icon: HandCoins, chave: "propostas" },
  { label: "Contratos", icon: FileSignature, chave: "contratos" },
  { label: "Criar publicação", icon: PlusSquare, chave: "criar" },
  { label: "Mensagens", icon: MessageCircle, chave: "mensagens", emBreve: true },
  { label: "Notificações", icon: Bell, chave: "notificacoes", emBreve: true },
  { label: "Perfil", icon: User, chave: "perfil" },
  { label: "Configurações", icon: Settings, chave: "configuracoes" },
];

const BASE =
  "relative flex items-center gap-[0.7rem] rounded-lg border-l-2 border-transparent py-[0.55rem] pr-[0.65rem] pl-[0.375rem] text-[0.8375rem] font-medium text-ink-500";
const ATIVO =
  "relative flex items-center gap-[0.7rem] rounded-lg border-l-2 border-brand-400 py-[0.55rem] pr-[0.65rem] pl-[0.375rem] text-[0.8375rem] font-semibold text-brand-700 bg-brand-50";

/** Réplica da Sidebar do app (usuário comum), usada na tela do notebook. */
export default function DemoSidebar({ ativo }: { ativo: string }) {
  return (
    <aside className="relative flex h-full w-60 shrink-0 flex-col border-r border-ink-100 bg-white text-ink-900">
      <div className="relative flex items-center gap-2.5 px-5 pb-5 pt-6">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gradient">
          <Image src="/logo.png" alt="" width={17} height={17} className="rounded-full" />
        </span>
        <span className="font-display text-[15px] font-bold tracking-tight text-ink-900">
          Pitcher<span className="text-brand-300">X</span>
        </span>
      </div>
      <nav className="relative flex flex-1 flex-col gap-0.5 px-3 pb-3">
        {ITENS.map(({ label, icon: Icon, chave, emBreve }) => (
          <span key={chave} className={ativo === chave ? ATIVO : BASE}>
            <Icon size={18} strokeWidth={ativo === chave ? 2.25 : 1.75} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
            {emBreve && (
              <span className="ml-auto shrink-0 rounded-full bg-ink-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-400">
                Em breve
              </span>
            )}
          </span>
        ))}
      </nav>
      <div className="relative border-t border-ink-100 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar nome={INTERESSADO.nome} tamanho={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-900">{INTERESSADO.nome}</p>
            <p className="truncate text-[11px] text-ink-400">{INTERESSADO.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
