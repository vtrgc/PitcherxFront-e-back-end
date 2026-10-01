"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import PageShell from "../../components/PageShell";
import PostCard from "../../components/PostCard";
import EmptyState from "../../components/EmptyState";
import Alerta from "../../components/ui/Alerta";
import { PostCardSkeleton } from "../../components/Skeleton";
import { cls } from "../../components/ui/estilos";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { buscarPostagemComCurtidas } from "../../services/postagem.service";
import { Post } from "../../types/Post";

/** Página de uma publicação com seus comentários (destino do link "Compartilhar"). */
export default function PublicacaoPage() {
  const params = useParams();
  const router = useRouter();
  const postagemId = Number(params.postagemId);
  const { usuario, isAuthenticated, isAdmin } = useAuth();
  const idUsuario = usuario?.idUsuario ?? null;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const carregar = useCallback(async () => {
    if (!Number.isInteger(postagemId) || postagemId <= 0) {
      setNaoEncontrado(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro("");
    setNaoEncontrado(false);
    try {
      setPost(await buscarPostagemComCurtidas(postagemId, idUsuario));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNaoEncontrado(true);
      else setErro(mensagemErro(error, "Não foi possível carregar a publicação."));
    } finally {
      setLoading(false);
    }
  }, [postagemId, idUsuario]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const voltar = isAdmin ? { href: "/admin/postagens", label: "Voltar para postagens" } : { href: "/feed", label: "Voltar para o feed" };

  return (
    <PageShell>
      <Link href={voltar.href} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} aria-hidden="true" />
        {voltar.label}
      </Link>

      <div className="pb-2">
        <p className={cls.eyebrow}>Discussão</p>
        <h1 className={cls.h1}>Publicação</h1>
      </div>

      {loading ? (
        <PostCardSkeleton />
      ) : naoEncontrado ? (
        <div className={cls.card}>
          <EmptyState icon={FileText} title="Publicação não encontrada" description="Ela pode ter sido excluída pelo autor." />
        </div>
      ) : erro ? (
        <Alerta onTentarNovamente={carregar}>{erro}</Alerta>
      ) : post ? (
        <PostCard post={post} comentariosAbertos onUpdate={carregar} onExcluido={() => router.push(voltar.href)} />
      ) : null}
    </PageShell>
  );
}
