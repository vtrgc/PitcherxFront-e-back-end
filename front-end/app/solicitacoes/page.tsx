"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Send, UserPlus } from "lucide-react";

import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import Paginacao from "../components/ui/Paginacao";
import Alerta from "../components/ui/Alerta";
import { cls } from "../components/ui/estilos";
import { LinhaSolicitacao, useDecisaoSolicitacao } from "../components/projeto/SolicitacoesVinculo";
import { useAuth } from "../context/AuthContext";
import { usePaginacao } from "../hook/usePaginacao";
import { mapComLimite, mensagemErro } from "../lib/api";
import { listarIdsProjetosCriados } from "../services/projetoUsuario.service";
import { listarMinhasSolicitacoes, listarSolicitacoesDoProjeto } from "../services/solicitacaoVinculo.service";
import { ROTULO_STATUS_SOLICITACAO, SolicitacaoVinculo } from "../types/SolicitacaoVinculo";

type Aba = "recebidas" | "enviadas";

const ordenar = (a: SolicitacaoVinculo, b: SolicitacaoVinculo) =>
  Number(b.status === "PENDENTE") - Number(a.status === "PENDENTE") || b.idSolicitacaoVinculo - a.idSolicitacaoVinculo;

/**
 * Solicitações de participação em projetos. "Recebidas": pedidos feitos aos projetos que o
 * usuário criou (GET /solicitacao-vinculo/projeto/{id}), com aprovar/recusar. "Enviadas":
 * GET /solicitacao-vinculo/minhas-solicitacoes.
 */
export default function SolicitacoesPage() {
  const { isAuthenticated, usuario } = useAuth();
  const idUsuario = usuario?.idUsuario;
  const [aba, setAba] = useState<Aba>("recebidas");
  const [status, setStatus] = useState("");
  const [recebidas, setRecebidas] = useState<SolicitacaoVinculo[]>([]);
  const [enviadas, setEnviadas] = useState<SolicitacaoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [avisoParcial, setAvisoParcial] = useState("");

  const carregar = useCallback(async () => {
    if (!idUsuario) return;
    setCarregando(true);
    setErro("");
    setAvisoParcial("");
    try {
      const [minhas, idsCriados] = await Promise.all([listarMinhasSolicitacoes(), listarIdsProjetosCriados(idUsuario)]);
      const resultados = await mapComLimite([...idsCriados], 4, (id) => listarSolicitacoesDoProjeto(id));
      const falhas = resultados.filter((r) => r.status === "rejected").length;
      if (falhas > 0) setAvisoParcial(`Não foi possível carregar as solicitações de ${falhas} projeto${falhas === 1 ? "" : "s"}.`);
      setRecebidas(resultados.flatMap((r) => (r.status === "fulfilled" ? (r.value ?? []) : [])).sort(ordenar));
      setEnviadas([...(minhas ?? [])].sort(ordenar));
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar as solicitações."));
    } finally {
      setCarregando(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (isAuthenticated) carregar();
  }, [isAuthenticated, carregar]);

  const aoDecidir = useCallback((atualizada: SolicitacaoVinculo) => {
    setRecebidas((lista) => lista.map((s) => (s.idSolicitacaoVinculo === atualizada.idSolicitacaoVinculo ? atualizada : s)));
  }, []);
  const { decidir, processando } = useDecisaoSolicitacao(idUsuario, aoDecidir);

  const lista = aba === "recebidas" ? recebidas : enviadas;
  const visiveis = useMemo(() => (status ? lista.filter((s) => s.status === status) : lista), [lista, status]);
  const paginacao = usePaginacao(visiveis, { tamanhoInicial: 10, chaveReinicio: `${aba}|${status}` });
  const pendentesRecebidas = recebidas.filter((s) => s.status === "PENDENTE").length;

  return (
    <PageShell area="usuario">
      <div className="pb-5">
        <p className={cls.eyebrow}>
          <UserPlus size={14} aria-hidden="true" /> Projetos
        </p>
        <h1 className={cls.h1}>Solicitações de participação</h1>
        <p className={`${cls.texto} mt-1.5 max-w-xl`}>
          Pedidos para entrar em projetos como sócio ou investidor. Só é possível pedir depois de aceitar os termos de vínculo do projeto.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Tipo de solicitação" className="flex gap-2">
          {(
            [
              { id: "recebidas", rotulo: `Recebidas${pendentesRecebidas > 0 ? ` (${pendentesRecebidas} pendente${pendentesRecebidas === 1 ? "" : "s"})` : ""}`, icone: Inbox },
              { id: "enviadas", rotulo: `Enviadas (${enviadas.length})`, icone: Send },
            ] as const
          ).map(({ id, rotulo, icone: Icone }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                aba === id ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
              }`}
            >
              <Icone size={13} aria-hidden="true" /> {rotulo}
            </button>
          ))}
        </div>
        <select aria-label="Filtrar por situação" value={status} onChange={(e) => setStatus(e.target.value)} className={`${cls.input} !w-auto !bg-white !py-2 !text-[13px]`}>
          <option value="">Todas as situações</option>
          {Object.entries(ROTULO_STATUS_SOLICITACAO).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>

      {avisoParcial && !carregando && (
        <Alerta variante="aviso" onTentarNovamente={carregar}>
          {avisoParcial}
        </Alerta>
      )}

      <div role="tabpanel" className={`${cls.card} px-5 sm:px-6`}>
        {carregando ? (
          <div className="space-y-3 py-6" aria-label="Carregando solicitações">
            <div className={`${cls.skeleton} h-5 w-2/3 rounded-lg`} />
            <div className={`${cls.skeleton} h-4 w-full rounded-lg`} />
          </div>
        ) : erro ? (
          <Alerta className="my-5" onTentarNovamente={carregar}>
            {erro}
          </Alerta>
        ) : visiveis.length === 0 ? (
          <EmptyState
            icon={aba === "recebidas" ? Inbox : Send}
            title={aba === "recebidas" ? "Nenhuma solicitação recebida" : "Você ainda não enviou solicitações"}
            description={
              aba === "recebidas"
                ? "Quando alguém pedir para participar de um projeto seu, o pedido aparece aqui."
                : "Abra um projeto, aceite os termos de vínculo e peça para participar como sócio ou investidor."
            }
          />
        ) : (
          <ul>
            {paginacao.itens.map((s) => (
              <LinhaSolicitacao
                key={s.idSolicitacaoVinculo}
                solicitacao={s}
                mostrarProjeto
                mostrarSolicitante={aba === "recebidas"}
                onDecidir={aba === "recebidas" ? decidir : undefined}
                processando={processando === s.idSolicitacaoVinculo}
              />
            ))}
          </ul>
        )}
      </div>

      {!carregando && !erro && visiveis.length > 0 && (
        <div className={`${cls.card} overflow-hidden`}>
          <Paginacao
            pagina={paginacao.pagina}
            totalPaginas={paginacao.totalPaginas}
            total={paginacao.total}
            inicio={paginacao.inicio}
            fim={paginacao.fim}
            tamanho={paginacao.tamanho}
            onPagina={paginacao.irPara}
            onTamanho={paginacao.setTamanho}
            rotulo="solicitações"
          />
        </div>
      )}
    </PageShell>
  );
}
