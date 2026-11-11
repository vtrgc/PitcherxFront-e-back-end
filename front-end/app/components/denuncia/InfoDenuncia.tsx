import Link from "next/link";
import { cls } from "../ui/estilos";
import { rotuloCategoria } from "../../services/denuncia.service";
import { formatarDataHora } from "../../lib/date";
import {
  ACOES_DENUNCIA,
  Denuncia,
  PrioridadeDenuncia,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS_DENUNCIA,
  ROTULO_TIPO_DENUNCIA,
  StatusDenuncia,
  TipoDenuncia,
} from "../../types/Denuncia";

const ESTILO_STATUS: Record<StatusDenuncia, string> = {
  PENDENTE: "inline-flex items-center rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200",
  ACEITA: "inline-flex items-center rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold bg-red-50 text-red-700 border border-red-200",
  REJEITADA: cls.chipInativo,
};

export function ChipStatusDenuncia({ status }: { status: StatusDenuncia }) {
  return <span className={ESTILO_STATUS[status] ?? cls.chipInativo}>{ROTULO_STATUS_DENUNCIA[status] ?? status}</span>;
}

const ESTILO_PRIORIDADE: Record<PrioridadeDenuncia, string> = {
  BAIXA: cls.chipInativo,
  MEDIA: cls.chip,
  ALTA: "inline-flex items-center rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200",
  CRITICA: "inline-flex items-center rounded-full px-[0.8rem] py-[0.3rem] text-xs font-bold bg-red-600 text-white",
};

export function ChipPrioridade({ prioridade }: { prioridade: PrioridadeDenuncia | null }) {
  if (!prioridade) return null;
  return <span className={ESTILO_PRIORIDADE[prioridade]}>Prioridade {ROTULO_PRIORIDADE[prioridade].toLowerCase()}</span>;
}

/** Link para o conteúdo denunciado (comentários não têm página própria). */
export function hrefAlvo(tipo: TipoDenuncia, alvoId: number): string | null {
  if (tipo === "POSTAGEM") return `/publicacao/${alvoId}`;
  if (tipo === "PROJETO") return `/projetos/${alvoId}`;
  if (tipo === "PERFIL") return `/perfil/${alvoId}`;
  return null;
}

export function AlvoDenuncia({ denuncia }: { denuncia: Denuncia }) {
  const href = hrefAlvo(denuncia.tipoDenuncia, denuncia.alvoId);
  const texto = `${ROTULO_TIPO_DENUNCIA[denuncia.tipoDenuncia] ?? denuncia.tipoDenuncia} #${denuncia.alvoId}`;
  return href ? (
    <Link href={href} className="font-semibold text-brand-700 hover:underline">
      {texto}
    </Link>
  ) : (
    <span className="font-semibold text-ink-800">{texto}</span>
  );
}

export function rotuloAcao(acao: string | null | undefined): string {
  if (!acao) return "Nenhuma ação";
  return ACOES_DENUNCIA.find((a) => a.id === acao)?.rotulo ?? acao;
}

/** Corpo comum de uma denúncia (usado na lista do usuário e na moderação). */
export function ResumoDenuncia({ denuncia }: { denuncia: Denuncia }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[14.5px] font-semibold text-ink-900">Denúncia #{denuncia.idDenuncia}</span>
        <ChipStatusDenuncia status={denuncia.status} />
        <ChipPrioridade prioridade={denuncia.prioridade} />
        {denuncia.apelacaoSolicitada && <span className={cls.chip}>Apelação solicitada</span>}
      </div>
      <p className="mt-1 text-[0.8125rem] text-ink-600">
        <AlvoDenuncia denuncia={denuncia} /> · motivo: <strong className="font-semibold">{rotuloCategoria(denuncia.categoria)}</strong>
        {denuncia.dataCriacao && ` · enviada em ${formatarDataHora(denuncia.dataCriacao)}`}
      </p>
      {denuncia.descricao && <p className={`${cls.texto} mt-2 whitespace-pre-line break-words !text-[14px]`}>{denuncia.descricao}</p>}
      {denuncia.status !== "PENDENTE" && (
        <div className="mt-3 rounded-xl border border-ink-100 bg-ink-25 px-4 py-3 text-[13.5px] text-ink-700">
          <p>
            <strong className="font-semibold">Decisão da moderação:</strong> {rotuloAcao(denuncia.acaoTomada)}
            {denuncia.dataDecisao && <span className="text-ink-500"> · {formatarDataHora(denuncia.dataDecisao)}</span>}
          </p>
          {denuncia.decisaoAdmin && <p className="mt-1 whitespace-pre-line break-words">{denuncia.decisaoAdmin}</p>}
        </div>
      )}
    </>
  );
}
