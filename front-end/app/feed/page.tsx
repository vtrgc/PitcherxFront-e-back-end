"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";

import PageShell from "../components/PageShell";
import SearchBar from "../components/SearchBar";
import CriarPost from "../components/CriarPost";
import PostCard from "../components/PostCard";
import EmptyState from "../components/EmptyState";
import Alerta from "../components/ui/Alerta";
import { PostCardSkeleton } from "../components/Skeleton";
import { cls } from "../components/ui/estilos";

import { Post } from "../types/Post";
import { listarPostagensComCurtidas } from "../services/postagem.service";
import { useAuth } from "../context/AuthContext";
import { useMinhasConexoes } from "../hook/useConexao";
import { mensagemErro } from "../lib/api";

const POR_PAGINA = 10;

/** Feed de publicações — exclusivo de usuários comuns (administradores vão ao dashboard). */
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  // Depois da primeira carga, as atualizações (após publicar, editar ou excluir) mantêm a
  // lista na tela: trocar tudo por esqueletos fechava comentários abertos e "pulava" a página.
  const [carregouUmaVez, setCarregouUmaVez] = useState(false);
  const [busca, setBusca] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [limite, setLimite] = useState(POR_PAGINA);
  const { isAuthenticated, usuario, isAdmin } = useAuth();
  const idUsuario = usuario?.idUsuario ?? null;
  // Uma única carga das minhas conexões para os botões Seguir/Seguindo de todos os autores.
  const conexoes = useMinhasConexoes({ automatico: isAuthenticated && !isAdmin });

  const carregarPosts = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      setPosts(await listarPostagensComCurtidas(idUsuario));
      setCarregouUmaVez(true);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar o feed."));
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) carregarPosts();
  }, [isAuthenticated, isAdmin, carregarPosts]);

  // Ao chegar por "/feed#criar-post", leva o foco ao formulário.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#criar-post") {
      window.setTimeout(() => document.getElementById("post-titulo")?.focus(), 150);
    }
  }, []);

  const termo = busca.trim().toLowerCase();
  const postsFiltrados = termo
    ? posts.filter((post) => `${post.tituloPostagem} ${post.textoPostagem}`.toLowerCase().includes(termo))
    : posts;
  const visiveis = postsFiltrados.slice(0, limite);

  return (
    <PageShell area="usuario">
      <div className="pb-5 mb-1">
        <p className={cls.eyebrow}>O feed</p>
        <h1 className={cls.h1}>O que estão lançando agora</h1>
      </div>

      <SearchBar
        value={busca}
        onChange={(v) => {
          setBusca(v);
          setLimite(POR_PAGINA);
        }}
        onRefresh={carregarPosts}
        loading={loading}
        placeholder="Pesquisar publicações..."
        rotulo="Pesquisar publicações"
      />
      <CriarPost atualizarFeed={carregarPosts} />

      {erroCarregamento && !loading && (
        <Alerta titulo="Erro ao carregar o feed" onTentarNovamente={carregarPosts}>
          {erroCarregamento}
        </Alerta>
      )}

      {loading && !carregouUmaVez ? (
        <div className="space-y-5 pt-2" aria-label="Carregando publicações">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : erroCarregamento && !carregouUmaVez ? null : postsFiltrados.length === 0 ? (
        <div className={cls.card}>
          <EmptyState
            icon={FileText}
            title={busca ? "Nenhuma publicação encontrada para essa busca" : "Nenhuma publicação ainda"}
            description={busca ? "Tente outro termo de pesquisa." : "Seja o primeiro a compartilhar uma ideia com a comunidade."}
          />
        </div>
      ) : (
        <div>
          {visiveis.map((post) => (
            <PostCard key={post.idPostagem} post={post} onUpdate={carregarPosts} conexoes={isAdmin ? null : conexoes} />
          ))}
          {postsFiltrados.length > limite && (
            <div className="flex justify-center pt-4">
              <button type="button" onClick={() => setLimite((l) => l + POR_PAGINA)} className={cls.btnSecundario}>
                Carregar mais ({postsFiltrados.length - limite} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
