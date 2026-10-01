import {
  House,
  Compass,
  Briefcase,
  HandCoins,
  FileSignature,
  MessageCircle,
  Bell,
  PlusSquare,
  Settings,
  User,
  Users,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SECOES_ADMIN } from "./AdminNav";

export interface ItemNavegacao {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Funcionalidade sem suporte no backend: a página existe, mas só informa isso. */
  emBreve?: boolean;
  /** Mostra o contador de notificações não lidas. */
  contadorNotificacoes?: boolean;
}

/** Navegação de usuários comuns (USUARIO/EMPRESA). */
export const NAV_USUARIO: ItemNavegacao[] = [
  { href: "/feed", label: "Início", icon: House },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/projetos", label: "Projetos", icon: Briefcase },
  { href: "/conexoes", label: "Conexões", icon: Users },
  { href: "/propostas", label: "Propostas", icon: HandCoins },
  { href: "/contratos", label: "Contratos", icon: FileSignature },
  { href: "/feed#criar-post", label: "Criar publicação", icon: PlusSquare },
  { href: "/notificacoes", label: "Notificações", icon: Bell, contadorNotificacoes: true },
  { href: "/mensagens", label: "Mensagens", icon: MessageCircle, emBreve: true },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/**
 * Navegação do administrador: apenas o que as permissões de ADMIN no backend suportam.
 * Sem feed, sem criação de postagens e sem criação de projetos.
 */
export const NAV_ADMIN: ItemNavegacao[] = [
  { href: "/admin", label: "Dashboard", icon: ShieldCheck },
  ...SECOES_ADMIN.map(({ href, titulo, icon }) => ({ href, label: titulo, icon })),
  { href: "/contratos", label: "Contratos", icon: FileSignature },
  { href: "/notificacoes", label: "Notificações", icon: Bell, contadorNotificacoes: true },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/** Item ativo: rota exata ou sub-rota (ex.: /projetos/12 ativa "Projetos"). */
export function itemAtivo(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const caminho = href.split("#")[0];
  if (href.includes("#")) return false;
  if (caminho === "/admin") return pathname === "/admin";
  return pathname === caminho || pathname.startsWith(`${caminho}/`);
}

/** Texto do contador (99+ acima de 99). */
export function textoContador(n: number | null | undefined): string | null {
  if (!n || n <= 0) return null;
  return n > 99 ? "99+" : String(n);
}
