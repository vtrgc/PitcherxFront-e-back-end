"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileSignature, ArrowLeft, Pencil, Trash2, Loader2, Briefcase, ScrollText, Lock } from "lucide-react";

import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import FormContrato from "../../components/FormContrato";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useAuth } from "../../context/AuthContext";
import { ApiError, mensagemErro } from "../../lib/api";
import { formatarDataHora } from "../../lib/date";
import { Contrato, ContratoRequest } from "../../types/Contrato";
import { Projeto } from "../../types/Projeto";
import { Termo } from "../../types/Termo";
import { buscarContrato, atualizarContrato, excluirContrato } from "../../services/contrato.service";
import { buscarProjeto } from "../../services/projeto.service";
import { listarTermos } from "../../services/termo.service";
import { ehParteDoContrato, listarPorUsuario } from "../../services/projetoUsuario.service";
import { TIPO_VINCULO_ID } from "../../types/ProjetoUsuario";

export default function ContratoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { isAuthenticated, isAdmin, usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [termos, setTermos] = useState<Termo[]>([]);
  const [erroTermos, setErroTermos] = useState(false);
  const [ehDono, setEhDono] = useState(false);
  // Contratos são visíveis só para as partes do projeto (criador, sócio, investidor) e o admin.
  const [semAcesso, setSemAcesso] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    if (!Number.isInteger(id) || id <= 0) {
      setNaoEncontrado(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro("");
    setNaoEncontrado(false);
    setSemAcesso(false);
    try {
      const dados = await buscarContrato(id);
      // Permissão primeiro: sem confirmar o vínculo, o conteúdo não é exibido.
      if (!isAdmin) {
        const meusVinculos = (await listarPorUsuario(usuario.idUsuario)) ?? [];
        const doProjeto = meusVinculos.filter((v) => v.projetoId === dados.projetoId);
        if (!ehParteDoContrato(doProjeto, usuario.idUsuario)) {
          setContrato(null);
          setSemAcesso(true);
          return;
        }
        setEhDono(doProjeto.some((v) => v.tipoVinculoId === TIPO_VINCULO_ID.CRIADOR));
      }
      setContrato(dados);
      const [rProjeto, rTermos] = await Promise.allSettled([buscarProjeto(dados.projetoId), listarTermos()]);
      setProjeto(rProjeto.status === "fulfilled" ? rProjeto.value : null);
      setTermos(rTermos.status === "fulfilled" ? (rTermos.value ?? []).filter((t) => t.contratoId === id) : []);
      setErroTermos(rTermos.status !== "fulfilled");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNaoEncontrado(true);
      else setErro(mensagemErro(error, "Não foi possível carregar este contrato."));
    } finally {
      setLoading(false);
    }
  }, [id, usuario, isAdmin]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const podeGerenciar = isAdmin || ehDono;

  async function salvar(dados: ContratoRequest) {
    if (!contrato) return;
    const atualizado = await atualizarContrato(contrato.idContrato, { ...dados, projetoId: contrato.projetoId });
    setContrato(atualizado);
    setEditando(false);
    notificar("Contrato atualizado.", "sucesso");
  }

  async function excluir() {
    if (!contrato) return;
    // termo.id_contrato não tem cascade: com termos vinculados o servidor recusa (erro 500).
    if (erroTermos) {
      notificar("Não foi possível verificar os termos deste contrato. Recarregue a página e tente novamente.");
      return;
    }
    if (termos.length > 0) {
      notificar(
        `Este contrato tem ${termos.length} termo${termos.length === 1 ? "" : "s"} vinculado${termos.length === 1 ? "" : "s"}. ${
          isAdmin ? "Exclua os termos (Admin → Termos) antes de excluir o contrato." : "Peça a um administrador para remover os termos antes de excluir o contrato."
        }`
      );
      return;
    }
    const ok = await confirmar("Excluir este contrato? Essa ação não pode ser desfeita.", { titulo: "Excluir contrato", perigo: true });
    if (!ok) return;
    setExcluindo(true);
    try {
      await excluirContrato(contrato.idContrato);
      notificar("Contrato excluído.", "sucesso");
      router.push("/contratos");
    } catch (error) {
      notificar(
        mensagemErro(error, "Não foi possível excluir este contrato. Verifique se ele não tem termos vinculados.")
      );
      setExcluindo(false);
    }
  }

  return (
    <PageShell>
      <Link href="/contratos" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} aria-hidden="true" /> Voltar para contratos
      </Link>

      {loading ? (
        <div className={`${cls.card} p-6`} aria-label="Carregando contrato">
          <div className={`${cls.skeleton} h-6 w-56 rounded-lg`} />
          <div className={`${cls.skeleton} mt-4 h-4 w-full rounded-lg`} />
          <div className={`${cls.skeleton} mt-2 h-4 w-4/5 rounded-lg`} />
        </div>
      ) : naoEncontrado ? (
        <div className={cls.card}>
          <EmptyState icon={FileSignature} title="Contrato não encontrado" />
        </div>
      ) : semAcesso ? (
        <div className={cls.card}>
          <EmptyState
            icon={Lock}
            title="Acesso restrito"
            description="Este contrato faz parte do registro de autoria (verificador antiplágio) de um projeto. Somente o criador, os sócios, os investidores do projeto e a administração podem vê-lo."
          />
        </div>
      ) : erro ? (
        <Alerta onTentarNovamente={carregar}>{erro}</Alerta>
      ) : contrato ? (
        <>
          <article className={`${cls.card} p-5 sm:p-7`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={contrato.active ? cls.chipAtivo : cls.chipInativo}>{contrato.active ? "Ativo" : "Inativo"}</span>

              {!editando && podeGerenciar && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditando(true)} className={`${cls.btnSecundario} !text-[13px]`}>
                    <Pencil size={14} aria-hidden="true" /> Editar
                  </button>
                  <button type="button" onClick={excluir} disabled={excluindo} className={`${cls.btnPerigo} !text-[13px]`}>
                    {excluindo ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} aria-hidden="true" />}
                    Excluir
                  </button>
                </div>
              )}
            </div>

            {editando ? (
              <FormContrato
                contrato={contrato}
                projetos={[]}
                projetoFixo={contrato.projetoId}
                onEnviar={salvar}
                onCancelar={() => setEditando(false)}
              />
            ) : (
              <>
                <h1 className="font-display mt-4 text-[1.5rem] sm:text-[1.75rem] font-extrabold leading-tight text-ink-900 break-words">
                  {contrato.tituloContrato}
                </h1>
                <p className={`${cls.texto} mt-3 whitespace-pre-line break-words`}>{contrato.descricaoContrato}</p>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-100 px-4 py-3">
                    <dt className="text-xs font-semibold text-ink-500">Início</dt>
                    <dd className="mt-0.5 font-semibold text-ink-900">{formatarDataHora(contrato.dataInicioContrato)}</dd>
                  </div>
                  <div className="rounded-xl border border-ink-100 px-4 py-3">
                    <dt className="text-xs font-semibold text-ink-500">Término</dt>
                    <dd className="mt-0.5 font-semibold text-ink-900">{formatarDataHora(contrato.dataFimContrato)}</dd>
                  </div>
                </dl>

                <Link
                  href={`/projetos/${contrato.projetoId}`}
                  className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-700 hover:underline"
                >
                  <Briefcase size={16} aria-hidden="true" />
                  {projeto?.nomeProjeto || `Projeto #${contrato.projetoId}`}
                </Link>
              </>
            )}
          </article>

          <section className="mt-2" aria-labelledby="titulo-termos">
            <h2 id="titulo-termos" className={cls.eyebrow}>
              <ScrollText size={14} aria-hidden="true" /> Termos do contrato
            </h2>
            {erroTermos ? (
              <Alerta className="mt-3" onTentarNovamente={carregar}>
                Não foi possível carregar os termos deste contrato.
              </Alerta>
            ) : termos.length === 0 ? (
              <p className="mt-3 text-[0.8125rem] text-ink-500">
                Nenhum termo cadastrado para este contrato.
                {isAdmin && (
                  <>
                    {" "}
                    <Link href="/admin/termos" className="font-semibold text-brand-700 hover:underline">
                      Gerenciar termos
                    </Link>
                  </>
                )}
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
                {termos.map((t, i) => (
                  <li key={t.idTermo} className={`${cls.card} p-4`}>
                    <p className="text-[14px] font-semibold text-ink-900">
                      {i + 1}. {t.tituloTermo}
                    </p>
                    <p className="mt-1 text-[13.5px] text-ink-600 whitespace-pre-line break-words">{t.descricaoTermo}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
