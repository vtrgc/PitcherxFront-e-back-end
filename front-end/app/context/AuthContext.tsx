"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as loginService,
  logout as logoutService,
  buscarUsuario,
} from "../services/usuario.service";
import {
  getToken,
  clearToken,
  tokenExpirado,
  decodificarToken,
  EVENTO_SESSAO_EXPIRADA,
  ApiError,
} from "../lib/api";
import { LoginRequest, LoginResponse } from "../types/Login";

export interface AuthUser {
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  telefoneUsuario?: string | null;
  urlImagemUsuario?: string | null;
  isActive: boolean;
  roles: string[];
}

/**
 * Guardamos em localStorage apenas o token (necessário para o header Authorization)
 * e dados públicos do próprio usuário para exibir a UI imediatamente ao recarregar.
 * Senhas NUNCA são armazenadas.
 */
const USER_STORAGE_KEY = "pitcherx:usuario";
// Chave usada por versões antigas do front para guardar a senha — removida no boot.
const CHAVE_LEGADA_SENHA = "pitcherx:senha-sessao";

interface AuthContextValue {
  usuario: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<AuthUser>;
  logout: (opcoes?: { redirecionar?: boolean }) => void;
  atualizarUsuarioLocal: (dados: Partial<AuthUser>) => void;
  recarregarUsuario: () => Promise<void>;
  /** true quando havia uma sessão salva, mas o token já tinha vencido ao abrir a aplicação. */
  sessaoExpirada: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapLoginResponseToUser(response: LoginResponse): AuthUser {
  return {
    idUsuario: response.idUsuario,
    nomeUsuario: response.nomeUsuario,
    emailUsuario: response.emailUsuario,
    urlImagemUsuario: null,
    isActive: response.isActive ?? response.active ?? true,
    roles: (response.roles ?? [])
      .map((r) => (typeof r === "string" ? r : r?.nomeRole))
      .filter((r): r is string => !!r),
  };
}

function salvarUsuarioLocal(usuario: AuthUser | null) {
  try {
    if (usuario) window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    else window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}

function lerUsuarioLocal(): AuthUser | null {
  try {
    const bruto = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as AuthUser;
    if (!dados || typeof dados.idUsuario !== "number" || !Array.isArray(dados.roles)) return null;
    return dados;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const router = useRouter();
  const usuarioRef = useRef<AuthUser | null>(null);
  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  const limparSessao = useCallback(() => {
    usuarioRef.current = null;
    logoutService();
    salvarUsuarioLocal(null);
    setUsuario(null);
  }, []);

  /** Busca no backend os dados completos (foto, telefone, status) do usuário logado. */
  const sincronizarComServidor = useCallback(async (base: AuthUser) => {
    try {
      const dados = await buscarUsuario(base.idUsuario, { forcar: true });
      const atualizado: AuthUser = {
        ...base,
        nomeUsuario: dados.nomeUsuario ?? base.nomeUsuario,
        emailUsuario: dados.emailUsuario ?? base.emailUsuario,
        telefoneUsuario: dados.telefoneUsuario ?? null,
        urlImagemUsuario: dados.urlImagemUsuario ?? null,
        isActive: dados.active ?? base.isActive,
        // As permissões efetivas vêm do token (é ele que o servidor usa), então
        // mantemos as roles do login; as do cadastro só complementam a exibição.
        roles: base.roles.length > 0 ? base.roles : dados.roles ?? [],
      };
      if (usuarioRef.current?.idUsuario === base.idUsuario) {
        setUsuario(atualizado);
        salvarUsuarioLocal(atualizado);
      }
      return atualizado;
    } catch {
      // Falha ao complementar não derruba a sessão (o token continua válido).
      return base;
    }
  }, []);

  // Restaura a sessão ao carregar a aplicação.
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(CHAVE_LEGADA_SENHA);
    } catch {
      /* ignora */
    }

    const token = getToken();
    const salvo = lerUsuarioLocal();
    const payload = decodificarToken(token);

    if (token && salvo && !tokenExpirado(token) && (payload?.idUsuario === undefined || payload.idUsuario === salvo.idUsuario)) {
      // As roles efetivas são as do token (o servidor decide por elas).
      const roles = Array.isArray(payload?.roles) && payload.roles.length > 0 ? payload.roles : salvo.roles;
      const restaurado = { ...salvo, roles };
      usuarioRef.current = restaurado;
      setUsuario(restaurado);
      sincronizarComServidor(restaurado);
    } else {
      // Havia sessão salva, mas o token venceu: a tela de login avisa o motivo.
      if (token && salvo && tokenExpirado(token)) setSessaoExpirada(true);
      clearToken();
      salvarUsuarioLocal(null);
    }
    setIsLoading(false);
  }, [sincronizarComServidor]);

  // Sessão expirada detectada pela camada de API ou em outra aba.
  useEffect(() => {
    function aoExpirar() {
      if (!usuarioRef.current) return;
      limparSessao();
      router.replace("/auth/login?expirada=1");
    }
    function aoMudarStorage(e: StorageEvent) {
      if (e.key === "pitcherx:token" && !e.newValue && usuarioRef.current) {
        salvarUsuarioLocal(null);
        setUsuario(null);
        router.replace("/auth/login");
      }
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    window.addEventListener("storage", aoMudarStorage);
    return () => {
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
      window.removeEventListener("storage", aoMudarStorage);
    };
  }, [limparSessao, router]);

  // Verifica periodicamente o vencimento do token (30 dias no backend).
  useEffect(() => {
    if (!usuario) return;
    const intervalo = window.setInterval(() => {
      if (tokenExpirado(getToken())) window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }, 60000);
    return () => window.clearInterval(intervalo);
  }, [usuario]);

  const login = useCallback(
    async (data: LoginRequest) => {
      let response: LoginResponse;
      try {
        response = await loginService(data);
      } catch (error) {
        // O backend compara o e-mail exatamente como foi digitado, e o cadastro deste front
        // grava o e-mail em minúsculas. Quem digita "Ana@Email.com" no login receberia
        // "e-mail ou senha inválidos"; tentamos de novo com o e-mail em minúsculas.
        const emMinusculas = data.emailUsuario.trim().toLowerCase();
        const podeRepetir =
          error instanceof ApiError && (error.status === 404 || error.status === 400) && emMinusculas !== data.emailUsuario;
        if (!podeRepetir) throw error;
        response = await loginService({ ...data, emailUsuario: emMinusculas });
      }
      const authUser = mapLoginResponseToUser(response);
      setSessaoExpirada(false);
      usuarioRef.current = authUser;
      setUsuario(authUser);
      salvarUsuarioLocal(authUser);
      // Completa foto/telefone em segundo plano.
      sincronizarComServidor(authUser);
      return authUser;
    },
    [sincronizarComServidor]
  );

  const logout = useCallback(
    ({ redirecionar = true }: { redirecionar?: boolean } = {}) => {
      limparSessao();
      if (redirecionar) router.push("/auth/login");
    },
    [limparSessao, router]
  );

  const atualizarUsuarioLocal = useCallback((dados: Partial<AuthUser>) => {
    setUsuario((atual) => {
      if (!atual) return atual;
      const atualizado = { ...atual, ...dados };
      salvarUsuarioLocal(atualizado);
      return atualizado;
    });
  }, []);

  const recarregarUsuario = useCallback(async () => {
    if (usuarioRef.current) await sincronizarComServidor(usuarioRef.current);
  }, [sincronizarComServidor]);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      isLoading,
      isAuthenticated: !!usuario,
      isAdmin: !!usuario?.roles?.includes("ADMIN"),
      login,
      logout,
      atualizarUsuarioLocal,
      recarregarUsuario,
      sessaoExpirada,
    }),
    [usuario, isLoading, login, logout, atualizarUsuarioLocal, recarregarUsuario, sessaoExpirada]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return context;
}
