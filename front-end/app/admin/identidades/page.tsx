"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Check, FileCheck2, Loader2, RefreshCw, Upload, X } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import Alerta from "../../components/ui/Alerta";
import Avatar from "../../components/ui/Avatar";
import Modal from "../../components/ui/Modal";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { ApiError, mensagemErro } from "../../lib/api";
import { ACCEPT_FOTO } from "../../lib/imagemPerfil";
import { resolverUrlImagem } from "../../lib/image";
import {
  analisarIdentidade,
  ativarDesativarUsuario,
  enviarComprovanteIdentidade,
  listarIdentidadesPendentes,
} from "../../services/usuario.service";
import { rotuloNivel } from "../../services/nivelConta.service";
import { Usuario } from "../../types/Usuario";

const TAMANHO = 12;

/**
 * Análise de identidade (admin): GET /usuario/admin/identidade-pendentes (paginado no servidor)
 * e POST /usuario/admin/analise-identidade/{id}. Aprovar ativa a conta (o login só funciona
 * com a conta ativa); reprovar exige justificativa, enviada por e-mail e notificação.
 * O admin também pode anexar o comprovante pelo usuário (POST /usuario/{id}/comprovante-identidade).
 *
 * Atenção — a análise envia um e-mail com os modelos "identidade-aprovada.html" e
 * "identidade-reprovada.html", que não existem em src/main/resources/templates do backend:
 * o servidor responde 500 e desfaz a análise. Para não travar o cadastro, ao falhar a
 * aprovação a tela oferece ativar a conta por PUT /usuario/ativar-desativar/{id} (o status da
 * identidade continua "pendente" no servidor, e a conta passa a entrar normalmente).
 */
export default function AdminIdentidadesPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();
  const [pagina, setPagina] = useState(0);
  const [itens, setItens] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState<number | null>(null);
  const [reprovando, setReprovando] = useState<Usuario | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [erroReprovacao, setErroReprovacao] = useState("");
  const [anexando, setAnexando] = useState<Usuario | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const r = await listarIdentidadesPendentes(pagina, TAMANHO);
      setItens(r.itens);
      setTotal(r.total);
      setTotalPaginas(r.totalPaginas);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar as identidades pendentes."));
    } finally {
      setLoading(false);
    }
  }, [pagina]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  async function aprovar(u: Usuario) {
    const ok = await confirmar(`Aprovar a identidade de ${u.nomeUsuario}? A conta será ativada.`, { titulo: "Aprovar identidade", confirmarLabel: "Aprovar" });
    if (!ok) return;
    setProcessando(u.idUsuario);
    try {
      await analisarIdentidade(u.idUsuario, "APROVADA");
      notificar("Identidade aprovada e conta ativada.", "sucesso");
      await carregar();
    } catch (e) {
      if (e instanceof ApiError && e.status >= 500 && !u.active) {
        const ativar = await confirmar(
          "O servidor não concluiu a aprovação (falha ao gerar o e-mail de confirmação) e a análise foi desfeita. Deseja ativar a conta diretamente para que o usuário consiga entrar? A identidade continuará como pendente.",
          { titulo: "Ativar conta", confirmarLabel: "Ativar conta" }
        );
        if (ativar) {
          try {
            const atualizado = await ativarDesativarUsuario(u.idUsuario);
            setItens((l) => l.map((x) => (x.idUsuario === u.idUsuario ? { ...x, ...atualizado } : x)));
            notificar("Conta ativada. O usuário já pode entrar.", "sucesso");
          } catch (e2) {
            notificar(mensagemErro(e2, "Não foi possível ativar a conta."));
          }
        }
      } else {
        notificar(mensagemErro(e, "Não foi possível aprovar a identidade."));
      }
    } finally {
      setProcessando(null);
    }
  }

  async function confirmarReprovacao() {
    if (!reprovando) return;
    if (!justificativa.trim()) {
      setErroReprovacao("Informe o motivo da reprovação.");
      return;
    }
    setProcessando(reprovando.idUsuario);
    setErroReprovacao("");
    try {
      await analisarIdentidade(reprovando.idUsuario, "REPROVADA", justificativa);
      notificar("Identidade reprovada. O usuário foi avisado por e-mail.", "sucesso");
      setReprovando(null);
      await carregar();
    } catch (e) {
      setErroReprovacao(
        mensagemErro(
          e,
          "O servidor não concluiu a reprovação (falha ao gerar o e-mail ao usuário) e a análise foi desfeita. A conta continua inativa; tente novamente mais tarde."
        )
      );
    } finally {
      setProcessando(null);
    }
  }

  async function anexar(arquivo: File | undefined) {
    const alvo = anexando;
    if (!arquivo || !alvo) return;
    setProcessando(alvo.idUsuario);
    try {
      const atualizado = await enviarComprovanteIdentidade(alvo.idUsuario, arquivo);
      setItens((l) => l.map((u) => (u.idUsuario === alvo.idUsuario ? { ...u, ...atualizado } : u)));
      notificar("Comprovante anexado.", "sucesso");
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível anexar o comprovante."));
    } finally {
      setProcessando(null);
      setAnexando(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={cls.eyebrow}>Administração</p>
          <h1 className={cls.h1}>Análise de identidade</h1>
          <p className={`${cls.texto} mt-1.5 max-w-2xl`}>
            Contas novas ficam inativas até a identidade ser aprovada. Confira o comprovante e aprove (ativa a conta) ou reprove com
            justificativa (o usuário pode reenviar até 5 vezes).
          </p>
        </div>
        <button type="button" onClick={carregar} disabled={loading} className={`${cls.btnContorno} !text-[13px]`}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Atualizar
        </button>
      </div>

      <input ref={inputRef} id={inputId} type="file" accept={ACCEPT_FOTO} className="sr-only" onChange={(e) => anexar(e.target.files?.[0])} />

      {erro && !loading && <Alerta onTentarNovamente={carregar}>{erro}</Alerta>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${cls.skeleton} h-40 rounded-2xl`} />
          ))}
        </div>
      ) : erro ? null : itens.length === 0 ? (
        <div className={cls.card}>
          <EmptyState icon={FileCheck2} title="Nenhuma identidade pendente" description="Todas as contas já foram analisadas." />
        </div>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {itens.map((u) => {
              const comprovante = resolverUrlImagem(u.urlComprovanteIdentidade);
              const ocupado = processando === u.idUsuario;
              return (
                <li key={u.idUsuario} className={`${cls.card} flex flex-col p-5`}>
                  <div className="flex items-center gap-3">
                    <Avatar url={u.urlImagemUsuario} nome={u.nomeUsuario} tamanho={44} />
                    <div className="min-w-0">
                      <Link href={`/perfil/${u.idUsuario}`} className="block truncate font-display text-[15px] font-bold text-ink-900 hover:underline">
                        {u.nomeUsuario}
                      </Link>
                      <p className="truncate text-[12.5px] text-ink-500">{u.emailUsuario}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] text-ink-500">
                    {u.active ? "Conta ativa" : "Conta inativa"} · nível {rotuloNivel(u.nivelConta?.nome)} · {u.tentativasIdentidade ?? 0} envio(s)
                  </p>
                  {comprovante ? (
                    <a href={comprovante} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-ink-100 bg-ink-25">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={comprovante} alt={`Comprovante de ${u.nomeUsuario}`} className="h-40 w-full object-contain" />
                    </a>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-ink-200 px-3 py-4 text-center text-[12.5px] text-ink-500">
                      Nenhum comprovante enviado.
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <button type="button" onClick={() => aprovar(u)} disabled={processando !== null} className={`${cls.btnPrimario} !text-[13px]`}>
                      {ocupado ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReprovando(u);
                        setJustificativa("");
                        setErroReprovacao("");
                      }}
                      disabled={processando !== null}
                      className={`${cls.btnPerigo} !text-[13px]`}
                    >
                      <X size={15} aria-hidden="true" /> Reprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnexando(u);
                        inputRef.current?.click();
                      }}
                      disabled={processando !== null}
                      className={`${cls.btnContorno} !text-[13px]`}
                    >
                      <Upload size={15} aria-hidden="true" /> Anexar comprovante
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between gap-3 text-[13px] text-ink-500">
              <span>
                {total} pendente{total === 1 ? "" : "s"} · página {pagina + 1} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0} className={`${cls.btnContorno} !text-[13px]`}>
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina + 1 >= totalPaginas}
                  className={`${cls.btnContorno} !text-[13px]`}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        aberto={!!reprovando}
        titulo={`Reprovar identidade de ${reprovando?.nomeUsuario ?? ""}`}
        descricao="O motivo é enviado ao usuário por e-mail e notificação."
        onFechar={() => setReprovando(null)}
        ocupado={processando !== null}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (processando === null) confirmarReprovacao();
          }}
        >
          {erroReprovacao && <Alerta className="mb-3">{erroReprovacao}</Alerta>}
          <label htmlFor="reprovacao-motivo" className={cls.label}>
            Motivo *
          </label>
          <textarea
            id="reprovacao-motivo"
            value={justificativa}
            maxLength={1000}
            rows={4}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Ex.: documento ilegível, foto cortada, dados divergentes do cadastro..."
            className={`${cls.input} resize-y`}
          />
          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={() => setReprovando(null)} disabled={processando !== null} className={cls.btnSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={processando !== null} className={cls.btnPerigo}>
              {processando !== null ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
              Reprovar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
