"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Award, FileCheck2, Loader2, Upload } from "lucide-react";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import { ACCEPT_FOTO } from "../../lib/imagemPerfil";
import { validarArquivosGaleria } from "../../lib/galeria";
import { resolverUrlImagem } from "../../lib/image";
import {
  LIMITE_TENTATIVAS_IDENTIDADE,
  ROTULO_STATUS_IDENTIDADE,
  buscarUsuario,
  enviarComprovanteIdentidade,
} from "../../services/usuario.service";
import { listarNiveisConta, rotuloNivel } from "../../services/nivelConta.service";
import { NivelConta, Usuario } from "../../types/Usuario";

const ESTILO_STATUS: Record<string, string> = {
  PENDENTE: "bg-amber-50 text-amber-800 border-amber-200",
  APROVADA: "bg-[#ECFDF3] text-[#05603A] border-transparent",
  REPROVADA: "bg-red-50 text-red-700 border-red-200",
};

/**
 * Comprovante de identidade (POST /usuario/{id}/comprovante-identidade) e nível de conta.
 * Lê o usuário completo (GET /usuario/{id}) para mostrar status, tentativas e nível atual.
 */
export default function CartaoIdentidade({ idUsuario }: { idUsuario: number }) {
  const { notificar } = useFeedback();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dados, setDados] = useState<Usuario | null>(null);
  const [niveis, setNiveis] = useState<NivelConta[]>([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const [u, n] = await Promise.all([buscarUsuario(idUsuario, { forcar: true }), listarNiveisConta().catch(() => [] as NivelConta[])]);
      setDados(u);
      setNiveis(n ?? []);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar a verificação de identidade."));
    }
  }, [idUsuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return;
    const invalido = validarArquivosGaleria([arquivo]);
    if (invalido) {
      notificar(invalido);
      return;
    }
    setEnviando(true);
    try {
      setDados(await enviarComprovanteIdentidade(idUsuario, arquivo));
      notificar("Comprovante enviado. A administração vai analisar sua identidade.", "sucesso");
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível enviar o comprovante."));
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (erro) return <Alerta onTentarNovamente={carregar}>{erro}</Alerta>;
  if (!dados) return <div className={`${cls.skeleton} h-24 w-full rounded-xl`} aria-label="Carregando verificação de identidade" />;

  const status = dados.statusAnaliseIdentidade ?? "PENDENTE";
  const tentativas = dados.tentativasIdentidade ?? 0;
  const esgotado = status === "REPROVADA" && tentativas >= LIMITE_TENTATIVAS_IDENTIDADE;
  const podeEnviar = status !== "APROVADA" && !esgotado;
  const comprovante = resolverUrlImagem(dados.urlComprovanteIdentidade);
  const nivel = dados.nivelConta;
  const ordemMax = Math.max(1, ...niveis.map((n) => n.ordem ?? 0));

  return (
    <div className="space-y-5">
      <section aria-labelledby="identidade-titulo">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="identidade-titulo" className="flex items-center gap-2 text-[14.5px] font-bold text-ink-900">
            <FileCheck2 size={16} className="text-brand-600" aria-hidden="true" /> Comprovante de identidade
          </h3>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold ${ESTILO_STATUS[status] ?? ESTILO_STATUS.PENDENTE}`}>
            {comprovante || status !== "PENDENTE" ? ROTULO_STATUS_IDENTIDADE[status] ?? status : "Não enviado"}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] leading-5 text-ink-500">
          {status === "APROVADA"
            ? "Sua identidade foi aprovada pela administração."
            : status === "REPROVADA"
            ? esgotado
              ? `O limite de ${LIMITE_TENTATIVAS_IDENTIDADE} envios foi atingido. Fale com o suporte.`
              : `A análise anterior foi reprovada (veja o motivo nas notificações). Envie um novo comprovante — ${tentativas} de ${LIMITE_TENTATIVAS_IDENTIDADE} envios usados.`
            : comprovante
            ? "Comprovante recebido e aguardando análise."
            : "Envie uma foto legível de um documento com foto (RG, CNH ou cartão CNPJ). Formatos JPG, PNG ou WEBP, até 10 MB."}
        </p>
        <Link href="/auth/verificar-conta?redirect=%2Fconfiguracoes" className="mt-1 mr-3 inline-block text-[12.5px] font-semibold text-brand-700 hover:underline">
          Confirmar código do e-mail
        </Link>
        {comprovante && (
          <a href={comprovante} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[12.5px] font-semibold text-brand-700 hover:underline">
            Ver comprovante enviado
          </a>
        )}
        {podeEnviar && (
          <div className="mt-3">
            <input ref={inputRef} id={inputId} type="file" accept={ACCEPT_FOTO} className="sr-only" disabled={enviando} onChange={(e) => enviar(e.target.files?.[0])} />
            <label htmlFor={inputId} className={`${cls.btnContorno} !text-[13px] ${enviando ? "pointer-events-none opacity-55" : ""}`}>
              {enviando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
              {comprovante ? "Enviar novo comprovante" : "Enviar comprovante"}
            </label>
          </div>
        )}
      </section>

      <section aria-labelledby="nivel-titulo" className="border-t border-ink-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="nivel-titulo" className="flex items-center gap-2 text-[14.5px] font-bold text-ink-900">
            <Award size={16} className="text-brand-600" aria-hidden="true" /> Nível da conta
          </h3>
          <span className={cls.chip}>{rotuloNivel(nivel?.nome)}</span>
        </div>
        {nivel?.descricao && <p className="mt-1 text-[12.5px] leading-5 text-ink-500">{nivel.descricao}</p>}
        {niveis.length > 0 && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${((nivel?.ordem ?? 1) / ordemMax) * 100}%` }} />
            </div>
            <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-ink-400">
              {niveis.map((n) => (
                <li key={n.idNivelConta} className={n.idNivelConta === nivel?.idNivelConta ? "font-bold text-brand-700" : ""}>
                  {rotuloNivel(n.nome)}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[12px] text-ink-400">
              O nível sobe automaticamente: criar projetos, ser sócio/investidor e alcançar visualizações e seguidores nos seus projetos.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
