"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock, Inbox, Loader2, Send, UserMinus, Users, X } from "lucide-react";

import PageShell, { CarregandoSessao } from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import PessoaItem from "../components/conexao/PessoaItem";
import BotaoConexao from "../components/conexao/BotaoConexao";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useAuth } from "../context/AuthContext";
import { useMinhasConexoes } from "../hook/useConexao";
import { useUsuario } from "../hook/useUsuario";
import { mensagemErro } from "../lib/api";
import { listarSeguidores, listarSeguindo } from "../services/conexao.service";
import { ConexaoSimples } from "../types/Conexao";

type Aba = "seguidores" | "seguindo" | "recebidas" | "enviadas";
const ABAS_PROPRIAS: Aba[] = ["seguidores", "seguindo", "recebidas", "enviadas"];
const POR_PAGINA = 20;

const ROTULOS: Record<Aba, string> = {
  seguidores: "Seguidores",
  seguindo: "Seguindo",
  recebidas: "Solicitações recebidas",
  enviadas: "Solicitações enviadas",
};

/**
 * Conexões: `/conexoes` (as minhas, com todas as ações) ou `/conexoes?usuario=ID`
 * (seguidores e seguindo de outra pessoa). Dados de GET /conexao/seguidores|seguindo|
 * solicitacoes/pendentes|solicitacoes/enviadas.
 */
export default function ConexoesPage() {
  return (
    <PageShell area="usuario">
      <Suspense fallback={<CarregandoSessao />}>
        <Conexoes />
      </Suspense>
    </PageShell>
  );
}

function Conexoes() {
  const params = useSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const eu = usuario?.idUsuario ?? 0;
  const idParam = Number(params.get("usuario"));
  const alvoId = Number.isInteger(idParam) && idParam > 0 ? idParam : eu;
  const proprio = alvoId === eu;

  const abaParam = params.get("aba") as Aba | null;
  const abasDisponiveis: Aba[] = proprio ? ABAS_PROPRIAS : ["seguidores", "seguindo"];
  const aba: Aba = abaParam && abasDisponiveis.includes(abaParam) ? abaParam : "seguidores";

  const minhas = useMinhasConexoes();
  const { usuario: alvo } = useUsuario(alvoId);

  function trocarAba(nova: Aba) {
    const q = new URLSearchParams();
    if (!proprio) q.set("usuario", String(alvoId));
    q.set("aba", nova);
    router.replace(`/conexoes?${q.toString()}`, { scroll: false });
  }

  const totais: Partial<Record<Aba, number>> = proprio
    ? {
        seguidores: minhas.seguidores.length,
        seguindo: minhas.seguindo.length,
        recebidas: minhas.recebidas.length,
        enviadas: minhas.enviadas.length,
      }
    : {};

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {!proprio && (
        <Link href={`/perfil/${alvoId}`} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-700 hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar ao perfil
        </Link>
      )}

      <div>
        <p className={cls.eyebrow}>
          <Users size={14} aria-hidden="true" /> Rede
        </p>
        <h1 className={cls.h1}>{proprio ? "Minhas conexões" : `Conexões de ${alvo?.nomeUsuario ?? "…"}`}</h1>
      </div>

      <div role="tablist" aria-label="Tipo de conexão" className="flex gap-1 overflow-x-auto border-b border-ink-100">
        {abasDisponiveis.map((a) => {
          const ativa = a === aba;
          const total = totais[a];
          return (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => trocarAba(a)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-[13.5px] font-semibold transition-colors ${
                ativa ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              {ROTULOS[a]}
              {total !== undefined && !minhas.carregando && (
                <span className={`rounded-full px-1.5 text-[11.5px] ${ativa ? "bg-brand-50 text-brand-700" : "bg-ink-50 text-ink-500"}`}>
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className={`${cls.card} px-4 sm:px-6`}>
        {proprio ? <ListaPropria aba={aba} minhas={minhas} /> : <ListaDeOutro usuarioId={alvoId} aba={aba as "seguidores" | "seguindo"} minhas={minhas} eu={eu} />}
      </div>
    </div>
  );
}

type Minhas = ReturnType<typeof useMinhasConexoes>;

function Carregando() {
  return (
    <div className="space-y-3 py-5" aria-label="Carregando conexões">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`${cls.skeleton} h-11 w-11 rounded-full`} />
          <div className={`${cls.skeleton} h-4 w-40 rounded-md`} />
        </div>
      ))}
    </div>
  );
}

function ListaPropria({ aba, minhas }: { aba: Aba; minhas: Minhas }) {
  if (minhas.carregando) return <Carregando />;
  if (minhas.erro) {
    return (
      <Alerta className="my-5" onTentarNovamente={minhas.recarregar}>
        {minhas.erro}
      </Alerta>
    );
  }

  const lista = minhas[aba];
  if (lista.length === 0) {
    const vazio = {
      seguidores: { icon: Users, t: "Ninguém segue você ainda", d: "Publique ideias e projetos para ser encontrado pela comunidade." },
      seguindo: { icon: Users, t: "Você ainda não segue ninguém", d: "Encontre pessoas em Explorar e envie solicitações de conexão." },
      recebidas: { icon: Inbox, t: "Nenhuma solicitação pendente", d: "Quando alguém pedir para seguir você, a solicitação aparece aqui." },
      enviadas: { icon: Send, t: "Nenhuma solicitação enviada pendente", d: "As solicitações que você enviar aparecem aqui até serem respondidas." },
    }[aba];
    return (
      <EmptyState
        icon={vazio.icon}
        title={vazio.t}
        description={vazio.d}
        action={
          aba === "seguindo" || aba === "enviadas" ? (
            <Link href="/explorar" className={cls.btnPrimario}>
              Explorar pessoas
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul>
      {lista.map((p) => {
        const pessoa = { id: p.id, nome: p.nome };
        const ocupado = minhas.ocupado(p.id);
        const rel = minhas.relacaoCom(p.id);
        return (
          <PessoaItem
            key={`${aba}-${p.id}`}
            id={p.id}
            nome={p.nome}
            imagem={p.imagem}
            detalhe={aba === "seguidores" && rel.euSigo ? "Vocês se seguem" : aba === "seguindo" && rel.meSegue ? "Segue você" : undefined}
          >
            {aba === "recebidas" && (
              <>
                <button type="button" disabled={ocupado} onClick={() => minhas.aceitar(pessoa)} className={`${cls.btnPrimario} !px-3 !py-[0.45rem] !text-[12.5px]`}>
                  {ocupado ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} Aceitar
                </button>
                <button type="button" disabled={ocupado} onClick={() => minhas.recusar(pessoa)} className={`${cls.btnContorno} !px-3 !py-[0.45rem] !text-[12.5px]`}>
                  <X size={14} aria-hidden="true" /> Recusar
                </button>
              </>
            )}
            {aba === "enviadas" && (
              <button type="button" disabled={ocupado} onClick={() => minhas.cancelarSolicitacao(pessoa)} className={`${cls.btnSecundario} !px-3 !py-[0.45rem] !text-[12.5px]`}>
                {ocupado ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />} Cancelar
              </button>
            )}
            {aba === "seguindo" && (
              <button type="button" disabled={ocupado} onClick={() => minhas.deixarDeSeguir(pessoa)} className={`${cls.btnContorno} !px-3 !py-[0.45rem] !text-[12.5px]`}>
                {ocupado ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <UserMinus size={14} aria-hidden="true" />} Parar de seguir
              </button>
            )}
            {aba === "seguidores" && (
              <>
                {!rel.euSigo && (
                  <BotaoConexao
                    compacto
                    relacao={rel}
                    ocupado={ocupado}
                    mostrarResposta={false}
                    onSeguir={() => minhas.seguir(pessoa)}
                    onDeixarDeSeguir={() => minhas.deixarDeSeguir(pessoa)}
                    onCancelar={() => minhas.cancelarSolicitacao(pessoa)}
                  />
                )}
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => minhas.removerSeguidor(pessoa)}
                  aria-label={`Remover ${p.nome} dos seguidores`}
                  title="Remover seguidor"
                  className={cls.btnIconePerigo}
                >
                  <UserMinus size={15} aria-hidden="true" />
                </button>
              </>
            )}
          </PessoaItem>
        );
      })}
    </ul>
  );
}

function ListaDeOutro({ usuarioId, aba, minhas, eu }: { usuarioId: number; aba: "seguidores" | "seguindo"; minhas: Minhas; eu: number }) {
  const [itens, setItens] = useState<ConexaoSimples[]>([]);
  const [pagina, setPagina] = useState(0);
  const [ultima, setUltima] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const buscar = useCallback(
    async (p: number) => {
      setCarregando(true);
      setErro("");
      try {
        const fn = aba === "seguidores" ? listarSeguidores : listarSeguindo;
        const resultado = await fn(usuarioId, p, POR_PAGINA);
        setItens((atual) => (p === 0 ? resultado.itens : [...atual, ...resultado.itens]));
        setPagina(p);
        setUltima(resultado.ultima);
      } catch (error) {
        setErro(mensagemErro(error, "Não foi possível carregar as conexões."));
      } finally {
        setCarregando(false);
      }
    },
    [aba, usuarioId]
  );

  useEffect(() => {
    buscar(0);
  }, [buscar]);

  const semDuplicados = useMemo(() => [...new Map(itens.map((i) => [i.id, i])).values()], [itens]);

  if (carregando && itens.length === 0) return <Carregando />;
  if (erro && itens.length === 0) {
    return (
      <Alerta className="my-5" onTentarNovamente={() => buscar(0)}>
        {erro}
      </Alerta>
    );
  }
  if (semDuplicados.length === 0) {
    return <EmptyState icon={Users} title={aba === "seguidores" ? "Nenhum seguidor ainda" : "Não segue ninguém ainda"} />;
  }

  return (
    <>
      <ul>
        {semDuplicados.map((p) => {
          const pessoa = { id: p.id, nome: p.nome };
          return (
            <PessoaItem key={p.id} id={p.id} nome={p.nome} imagem={p.imagem} detalhe={p.id === eu ? "Você" : undefined}>
              {p.id !== eu && !minhas.carregando && (
                <BotaoConexao
                  compacto
                  relacao={minhas.relacaoCom(p.id)}
                  ocupado={minhas.ocupado(p.id)}
                  onSeguir={() => minhas.seguir(pessoa)}
                  onDeixarDeSeguir={() => minhas.deixarDeSeguir(pessoa)}
                  onCancelar={() => minhas.cancelarSolicitacao(pessoa)}
                  onAceitar={() => minhas.aceitar(pessoa)}
                  onRecusar={() => minhas.recusar(pessoa)}
                />
              )}
            </PessoaItem>
          );
        })}
      </ul>
      {erro && <Alerta className="mb-4">{erro}</Alerta>}
      {!ultima && (
        <div className="flex justify-center py-4">
          <button type="button" onClick={() => buscar(pagina + 1)} disabled={carregando} className={cls.btnSecundario}>
            {carregando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Carregar mais
          </button>
        </div>
      )}
    </>
  );
}
