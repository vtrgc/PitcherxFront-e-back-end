"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, HandCoins, Trash2 } from "lucide-react";

import BarraPesquisaAdmin from "../../components/admin/BarraPesquisaAdmin";
import CabecalhoAdmin from "../../components/admin/CabecalhoAdmin";
import { CampoAdmin, LinhaAdmin, ListaAdmin } from "../../components/admin/ListaAdmin";
import ModalAdmin from "../../components/admin/ModalAdmin";
import Paginacao from "../../components/admin/Paginacao";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useListagemAdmin } from "../../hook/useListagemAdmin";
import { useModalCadastro } from "../../hook/useModalCadastro";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { LIMITES } from "../../lib/limites";
import { formatarMoeda, parseValorMonetario } from "../../lib/validacao";
import { ContraProposta } from "../../types/ContraProposta";
import { Proposta } from "../../types/Proposta";
import { listarPropostas, criarProposta, atualizarProposta, excluirProposta } from "../../services/proposta.service";
import { listarContraPropostas, excluirContraProposta } from "../../services/contraProposta.service";

type FiltroContra = "" | "com" | "sem";

/**
 * Propostas (PropostaRequestDTO: descricaoProposta obrigatória, valorProposta opcional) e
 * contrapropostas. No backend, /proposta não tem @PreAuthorize (qualquer conta autenticada,
 * inclusive ADMIN, cadastra/edita/exclui). Em /contra-proposta, o ADMIN só pode EXCLUIR —
 * POST/PUT são das roles USUARIO/EMPRESA. Excluir uma proposta apaga as contrapropostas
 * dela (ON DELETE CASCADE).
 */
export default function AdminPropostasPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contras, setContras] = useState<ContraProposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [filtroContra, setFiltroContra] = useState<FiltroContra>("");
  const [expandida, setExpandida] = useState<number | null>(null);

  const modal = useModalCadastro<Proposta>();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [listaPropostas, listaContras] = await Promise.all([listarPropostas(), listarContraPropostas()]);
      setPropostas([...(listaPropostas ?? [])].sort((a, b) => b.idProposta - a.idProposta));
      setContras([...(listaContras ?? [])].sort((a, b) => b.idContraProposta - a.idContraProposta));
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar as propostas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const contrasPorProposta = useMemo(() => {
    const mapa = new Map<number, ContraProposta[]>();
    contras.forEach((c) => mapa.set(c.propostaId, [...(mapa.get(c.propostaId) ?? []), c]));
    return mapa;
  }, [contras]);

  const filtradas = useMemo(
    () =>
      propostas.filter((p) => {
        const qtd = contrasPorProposta.get(p.idProposta)?.length ?? 0;
        return filtroContra === "" || (filtroContra === "com" ? qtd > 0 : qtd === 0);
      }),
    [propostas, contrasPorProposta, filtroContra]
  );
  const lista = useListagemAdmin(filtradas, (p) => [
    p.descricaoProposta,
    p.valorProposta,
    p.valorProposta != null ? formatarMoeda(p.valorProposta) : "a combinar",
    ...(contrasPorProposta.get(p.idProposta) ?? []).map((c) => c.descricaoContraProposta),
  ]);

  function abrirNovo() {
    setDescricao("");
    setValor("");
    modal.abrirNovo();
  }

  function abrirEdicao(p: Proposta) {
    setDescricao(p.descricaoProposta);
    setValor(p.valorProposta != null ? String(p.valorProposta).replace(".", ",") : "");
    modal.abrirEdicao(p);
  }

  function salvar() {
    const atual = modal.registro;
    const numero = parseValorMonetario(valor.replace(/R\$\s*/i, "").replace(/^(\d{1,3}(\.\d{3})+)$/, (m) => m.replace(/\./g, "")));
    modal.salvar({
      validar: () => {
        if (!descricao.trim()) return "Informe a descrição da proposta.";
        if (Number.isNaN(numero)) return "Informe um valor válido (ex.: 1500 ou 1.500,00) ou deixe em branco.";
        if (numero !== null && numero > LIMITES.valorMonetario) return `O valor máximo aceito é ${formatarMoeda(LIMITES.valorMonetario)}.`;
        if (numero !== null && numero < 0) return "O valor não pode ser negativo.";
        return null;
      },
      enviar: () => {
        const dados = {
          descricaoProposta: descricao.trim(),
          valorProposta: numero,
        };
        return atual ? atualizarProposta(atual.idProposta, dados) : criarProposta(dados);
      },
      sucesso: atual ? "Proposta atualizada." : "Proposta cadastrada.",
      falha: "Não foi possível salvar a proposta.",
      depois: carregar,
    });
  }

  async function excluir(p: Proposta) {
    const qtd = contrasPorProposta.get(p.idProposta)?.length ?? 0;
    const aviso = qtd > 0 ? ` As ${qtd} contraproposta${qtd === 1 ? "" : "s"} dela também ser${qtd === 1 ? "á excluída" : "ão excluídas"}.` : "";
    if (
      !(await confirmar(`Excluir a proposta #${p.idProposta}?${aviso}`, {
        titulo: "Excluir proposta",
        perigo: true,
      }))
    )
      return;
    try {
      await excluirProposta(p.idProposta);
      await carregar();
      notificar("Proposta excluída.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a proposta."));
    }
  }

  async function excluirContra(c: ContraProposta) {
    if (
      !(await confirmar("Excluir esta contraproposta?", {
        titulo: "Excluir contraproposta",
        perigo: true,
      }))
    )
      return;
    try {
      await excluirContraProposta(c.idContraProposta);
      await carregar();
      notificar("Contraproposta excluída.", "sucesso");
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir a contraproposta."));
    }
  }

  if (!pronto) return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;

  return (
    <>
      <CabecalhoAdmin
        icone={HandCoins}
        titulo="Propostas"
        descricao="Propostas de trabalho e as contrapropostas recebidas."
        total={loading ? null : propostas.length}
        rotuloTotal={["proposta", "propostas"]}
        onCadastrar={abrirNovo}
      />

      <BarraPesquisaAdmin
        valor={lista.termo}
        onChange={lista.setTermo}
        placeholder="Pesquisar por descrição, valor ou contraproposta..."
        rotulo="Pesquisar propostas"
        resultado={`${lista.total} resultado${lista.total === 1 ? "" : "s"}`}
        filtros={
          <select
            aria-label="Filtrar por contrapropostas"
            value={filtroContra}
            onChange={(e) => {
              setFiltroContra(e.target.value as FiltroContra);
              lista.irPara(1);
            }}
            className={`${cls.input} !py-2.5 !bg-white sm:!w-56`}
          >
            <option value="">Todas as propostas</option>
            <option value="com">Com contrapropostas</option>
            <option value="sem">Sem contrapropostas</option>
          </select>
        }
      />

      <ListaAdmin
        carregando={loading}
        erro={erroCarregamento}
        onTentarNovamente={carregar}
        vazio={propostas.length === 0}
        semResultado={lista.total === 0}
        termo={lista.termo}
        onLimparPesquisa={() => {
          lista.setTermo("");
          setFiltroContra("");
        }}
        icone={HandCoins}
        tituloVazio="Nenhuma proposta cadastrada"
        descricaoVazio='Use "Cadastrar" para criar a primeira proposta.'
        rodape={<Paginacao {...lista} onPagina={lista.irPara} onPorPagina={lista.setPorPagina} rotuloItens="propostas" />}
      >
        {lista.itens.map((p) => {
          const daProposta = contrasPorProposta.get(p.idProposta) ?? [];
          const aberta = expandida === p.idProposta;
          return (
            <LinhaAdmin
              key={p.idProposta}
              rotulo={`proposta #${p.idProposta}`}
              titulo={
                <>
                  Proposta #{p.idProposta} · <span className="text-brand-700">{formatarMoeda(p.valorProposta)}</span>
                </>
              }
              subtitulo={<span className="whitespace-pre-line">{p.descricaoProposta}</span>}
              meta={
                <span className={daProposta.length > 0 ? cls.chip : cls.chipInativo}>
                  {daProposta.length} contraproposta
                  {daProposta.length === 1 ? "" : "s"}
                </span>
              }
              acoes={
                <>
                  <Link
                    href={`/propostas/${p.idProposta}`}
                    className={`${cls.btnIcone} !h-9 !w-9`}
                    aria-label={`Abrir proposta #${p.idProposta}`}
                    title="Abrir página da proposta"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpandida(aberta ? null : p.idProposta)}
                    aria-expanded={aberta}
                    className={`${cls.btnIcone} !h-9 !w-9`}
                    aria-label={`Ver contrapropostas da proposta #${p.idProposta}`}
                    title="Ver contrapropostas"
                  >
                    <ChevronDown size={16} className={`transition-transform ${aberta ? "rotate-180" : ""}`} />
                  </button>
                </>
              }
              onEditar={() => abrirEdicao(p)}
              onExcluir={() => excluir(p)}
              detalhe={
                aberta && (
                  <div className="border-t border-ink-100 bg-ink-25 px-4 py-4 sm:px-6">
                    <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">Contrapropostas</p>
                    {daProposta.length === 0 ? (
                      <p className="text-[12.5px] text-ink-500">Nenhuma contraproposta para esta proposta.</p>
                    ) : (
                      <ul className="space-y-2">
                        {daProposta.map((c) => (
                          <li
                            key={c.idContraProposta}
                            className="flex items-start justify-between gap-3 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-ink-800">{formatarMoeda(c.valorContraProposta)}</p>
                              <p className="mt-0.5 whitespace-pre-line break-words text-[12.5px] text-ink-600">{c.descricaoContraProposta}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => excluirContra(c)}
                              className={`${cls.btnIconePerigo} !h-8 !w-8 shrink-0`}
                              aria-label="Excluir contraproposta"
                              title="Excluir contraproposta"
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-[11.5px] text-ink-400">
                      Contrapropostas são enviadas pelos usuários; o administrador pode apenas excluí-las.
                    </p>
                  </div>
                )
              }
            />
          );
        })}
      </ListaAdmin>

      <ModalAdmin
        aberto={modal.aberto}
        titulo={modal.editando ? `Editar proposta #${modal.registro?.idProposta}` : "Cadastrar proposta"}
        descricao={modal.editando ? undefined : "Descreva a proposta. O valor é opcional (em branco = a combinar)."}
        onFechar={modal.fechar}
        onSalvar={salvar}
        salvando={modal.salvando}
        rotuloSalvar={modal.editando ? "Salvar alterações" : "Cadastrar"}
      >
        <div className="space-y-4">
          {modal.erro && <Alerta>{modal.erro}</Alerta>}
          <CampoAdmin id="prop-descricao" rotulo="Descrição" obrigatorio contador={{ atual: descricao.length, max: 2000 }}>
            <textarea
              id="prop-descricao"
              value={descricao}
              rows={5}
              maxLength={2000}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${cls.input} resize-y`}
            />
          </CampoAdmin>
          <CampoAdmin id="prop-valor" rotulo="Valor (R$)" ajuda="Opcional. Ex.: 1500 ou 1.500,00">
            <input
              id="prop-valor"
              inputMode="decimal"
              value={valor}
              maxLength={24}
              onChange={(e) => setValor(e.target.value.replace(/[^\d.,R$\s]/g, ""))}
              className={cls.input}
            />
          </CampoAdmin>
        </div>
      </ModalAdmin>
    </>
  );
}
