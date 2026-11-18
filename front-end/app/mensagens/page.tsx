"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, PenSquare } from "lucide-react";
import PageShell, { CarregandoSessao } from "../components/PageShell";
import ListaConversas from "../components/mensagens/ListaConversas";
import PainelConversa from "../components/mensagens/PainelConversa";
import NovaConversa from "../components/mensagens/NovaConversa";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { useAuth } from "../context/AuthContext";
import { useMensagensNaoLidas } from "../context/MensagensContext";
import { useConversas } from "../hook/useConversas";
import { ApiError, mensagemErro } from "../lib/api";
import { buscarConversa, buscarPermissaoMensagem } from "../services/mensagem.service";
import { Conversa, Mensagem, PermissaoMensagem } from "../types/Mensagem";

/**
 * Mensagens privadas (só entre conexões aceitas — o backend confere em todo envio).
 *  - /mensagens                → lista de conversas
 *  - /mensagens?conversa={id}  → uma conversa
 *  - /mensagens?com={usuario}  → abre a conversa com a pessoa (ou começa uma nova)
 * As conversas se atualizam sozinhas por consultas incrementais enquanto a aba está visível.
 */
export default function Mensagens() {
  return (
    <PageShell area="usuario" rightRail={null}>
      <Suspense fallback={<CarregandoSessao />}>
        <MensagensConteudo />
      </Suspense>
    </PageShell>
  );
}

function MensagensConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const { usuario } = useAuth();
  const { atualizarNaoLidas } = useMensagensNaoLidas();
  const lista = useConversas();
  const { recarregar: recarregarLista, zerarNaoLidas } = lista;

  const conversaId = Number(params.get("conversa")) || null;
  const comId = Number(params.get("com")) || null;
  const [novaAberta, setNovaAberta] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  // Conversa aberta por link direto: busca o detalhe (403 para quem não participa).
  const [detalhe, setDetalhe] = useState<{ id: number; conversa?: Conversa; erro?: string } | null>(null);
  useEffect(() => {
    if (!conversaId) return;
    let cancelado = false;
    buscarConversa(conversaId)
      .then((c) => !cancelado && setDetalhe({ id: conversaId, conversa: c }))
      .catch((e) => {
        if (cancelado) return;
        const erro =
          e instanceof ApiError && e.status === 403
            ? "Você não tem acesso a esta conversa."
            : e instanceof ApiError && e.status === 404
              ? "Conversa não encontrada."
              : mensagemErro(e, "Não foi possível abrir a conversa.");
        setDetalhe({ id: conversaId, erro });
      });
    return () => {
      cancelado = true;
    };
  }, [conversaId, tentativa]);

  // Pessoa escolhida no perfil ou em "Nova mensagem": abre a conversa existente ou prepara uma nova.
  const [permissao, setPermissao] = useState<{ id: number; dados?: PermissaoMensagem; erro?: string } | null>(null);
  useEffect(() => {
    if (!comId || conversaId) return;
    let cancelado = false;
    buscarPermissaoMensagem(comId)
      .then((p) => {
        if (cancelado) return;
        if (p.conversaId) router.replace(`/mensagens?conversa=${p.conversaId}`);
        else setPermissao({ id: comId, dados: p });
      })
      .catch((e) => !cancelado && setPermissao({ id: comId, erro: mensagemErro(e, "Não foi possível abrir a conversa.") }));
    return () => {
      cancelado = true;
    };
  }, [comId, conversaId, router, tentativa]);

  // A lista é atualizada periodicamente; ela tem a versão mais recente (inclusive se a conexão caiu).
  const daLista = conversaId ? lista.conversas.find((c) => c.idConversa === conversaId) : undefined;
  const detalheAtual = detalhe && detalhe.id === conversaId ? detalhe : null;
  const conversa = daLista ?? detalheAtual?.conversa;
  const permissaoAtual = permissao && permissao.id === comId && !conversaId ? permissao : null;

  const aoLer = useCallback(
    (id: number) => {
      zerarNaoLidas(id);
      atualizarNaoLidas();
    },
    [zerarNaoLidas, atualizarNaoLidas]
  );
  const aoEnviar = useCallback(
    (m: Mensagem) => {
      recarregarLista();
      if (!conversaId) router.replace(`/mensagens?conversa=${m.conversaId}`);
    },
    [recarregarLista, conversaId, router]
  );
  const aoBloquear = useCallback(() => {
    recarregarLista();
    setTentativa((n) => n + 1);
  }, [recarregarLista]);
  const voltar = useCallback(() => router.push("/mensagens"), [router]);
  const recarregarPainel = useCallback(() => setTentativa((n) => n + 1), []);

  if (!usuario) return null;
  const algoAberto = !!conversaId || !!comId;

  let painel: React.ReactNode;
  if (conversaId) {
    if (detalheAtual?.erro && !daLista) {
      painel = <PainelMensagem titulo={detalheAtual.erro} onVoltar={voltar} onTentarNovamente={recarregarPainel} />;
    } else if (!conversa) {
      painel = <PainelCarregando />;
    } else {
      painel = (
        <PainelConversa
          key={`c${conversa.idConversa}-${tentativa}`}
          conversaId={conversa.idConversa}
          participante={conversa.participante}
          podeEnviar={conversa.podeEnviar}
          situacao={conversa.situacao}
          motivo={conversa.motivoBloqueio}
          idUsuario={usuario.idUsuario}
          onVoltar={voltar}
          onRecarregar={recarregarPainel}
          onLida={aoLer}
          onEnviada={aoEnviar}
          onBloqueada={aoBloquear}
          onMudou={recarregarLista}
        />
      );
    }
  } else if (comId) {
    if (permissaoAtual?.erro) {
      painel = <PainelMensagem titulo={permissaoAtual.erro} onVoltar={voltar} onTentarNovamente={recarregarPainel} />;
    } else if (!permissaoAtual?.dados) {
      painel = <PainelCarregando />;
    } else {
      const p = permissaoAtual.dados;
      painel = (
        <PainelConversa
          key={`n${p.usuario.idUsuario}-${tentativa}`}
          conversaId={null}
          participante={p.usuario}
          podeEnviar={p.podeEnviar}
          situacao={p.situacao}
          motivo={p.motivo}
          idUsuario={usuario.idUsuario}
          onVoltar={voltar}
          onRecarregar={recarregarPainel}
          onLida={aoLer}
          onEnviada={aoEnviar}
          onBloqueada={aoBloquear}
          onMudou={recarregarLista}
        />
      );
    }
  } else {
    painel = (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600" aria-hidden="true">
          <MessageCircle size={30} />
        </span>
        <p className="font-display text-[1.0625rem] font-bold text-ink-900">Suas mensagens</p>
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-5 text-ink-500">
          Escolha uma conversa ao lado ou comece uma nova com uma das suas conexões aceitas.
        </p>
        <button type="button" onClick={() => setNovaAberta(true)} className={`${cls.btnPrimario} mt-5 !text-[13px]`}>
          <PenSquare size={15} aria-hidden="true" /> Nova mensagem
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`${cls.card} grid h-[calc(100dvh-10rem)] min-h-[26rem] overflow-hidden lg:h-[calc(100dvh-4rem)] md:grid-cols-[minmax(17rem,22rem)_1fr]`}
      >
        <div className={`min-h-0 border-ink-100 md:border-r ${algoAberto ? "hidden md:block" : "block"}`}>
          <ListaConversas
            conversas={lista.conversas}
            carregando={lista.carregando}
            erro={lista.erro}
            semConexao={lista.semConexao}
            selecionada={conversaId}
            onTentarNovamente={recarregarLista}
            onNovaMensagem={() => setNovaAberta(true)}
          />
        </div>
        <div className={`min-h-0 ${algoAberto ? "block" : "hidden md:block"}`}>{painel}</div>
      </div>
      <NovaConversa aberto={novaAberta} idUsuario={usuario.idUsuario} onFechar={() => setNovaAberta(false)} />
    </>
  );
}

function PainelCarregando() {
  return (
    <div className="flex h-full items-center justify-center" role="status">
      <span className={`${cls.skeleton} h-10 w-10 rounded-full`} />
      <span className="sr-only">Carregando conversa…</span>
    </div>
  );
}

function PainelMensagem({ titulo, onVoltar, onTentarNovamente }: { titulo: string; onVoltar: () => void; onTentarNovamente: () => void }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <Alerta onTentarNovamente={onTentarNovamente}>{titulo}</Alerta>
      <button type="button" onClick={onVoltar} className={`${cls.btnContorno} self-start !text-[13px]`}>
        Voltar para as conversas
      </button>
    </div>
  );
}
