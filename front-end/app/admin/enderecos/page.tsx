"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, Pencil, Trash2, Plus } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import FormEndereco from "../../components/FormEndereco";
import Alerta from "../../components/ui/Alerta";
import CampoBusca from "../../components/ui/CampoBusca";
import Modal from "../../components/ui/Modal";
import Paginacao from "../../components/ui/Paginacao";
import { usePaginacao } from "../../hook/usePaginacao";
import { correspondeBusca } from "../../lib/listagem";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import { useRequireAdmin } from "../../hook/useRequireAdmin";
import { mensagemErro } from "../../lib/api";
import { Endereco } from "../../types/Endereco";
import { Usuario } from "../../types/Usuario";
import { listarEnderecos, excluirEndereco } from "../../services/endereco.service";
import { listarUsuarios } from "../../services/usuario.service";

function formatarCep(cep: string) {
  const d = (cep || "").replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}

/** Endereços (EnderecoRequestDTO: cep, uf, bairro, logradouro, complemento, numeroCasa, usuarioId). */
export default function AdminEnderecosPage() {
  const { pronto } = useRequireAdmin();
  const { notificar, confirmar } = useFeedback();

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [editando, setEditando] = useState<Endereco | null>(null);
  const [criando, setCriando] = useState(false);
  const [usuarioNovo, setUsuarioNovo] = useState<number | "">("");
  const [busca, setBusca] = useState("");
  const [filtroUf, setFiltroUf] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento("");
    try {
      const [enderecosData, usuariosData] = await Promise.all([listarEnderecos(), listarUsuarios()]);
      setEnderecos(enderecosData ?? []);
      setUsuarios(usuariosData ?? []);
    } catch (error) {
      setErroCarregamento(mensagemErro(error, "Não foi possível carregar os endereços."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const nomes = useMemo(() => new Map(usuarios.map((u) => [u.idUsuario, u.nomeUsuario])), [usuarios]);
  const ufs = useMemo(() => [...new Set(enderecos.map((e) => (e.uf || "").toUpperCase()).filter(Boolean))].sort(), [enderecos]);
  const filtrados = useMemo(
    () =>
      enderecos
        .filter(
          (e) =>
            (!filtroUf || (e.uf || "").toUpperCase() === filtroUf) &&
            correspondeBusca(busca, e.logradouro, e.bairro, e.complemento, e.cep, formatarCep(e.cep), e.uf, e.numeroCasa, nomes.get(e.usuarioId))
        )
        .sort((a, b) => b.idEndereco - a.idEndereco),
    [enderecos, busca, filtroUf, nomes]
  );
  const paginacao = usePaginacao(filtrados, { chaveReinicio: `${busca}|${filtroUf}` });

  function fecharFormulario() {
    setEditando(null);
    setCriando(false);
    setUsuarioNovo("");
  }

  async function excluir(endereco: Endereco) {
    if (!(await confirmar("Deseja realmente excluir este endereço?", { titulo: "Excluir endereço", perigo: true }))) return;
    try {
      await excluirEndereco(endereco.idEndereco);
      notificar("Endereço excluído.", "sucesso");
      await carregar();
    } catch (error) {
      notificar(mensagemErro(error, "Não foi possível excluir o endereço."));
    }
  }

  if (!pronto) {
    return <div className={`${cls.skeleton} h-24 w-full rounded-2xl`} />;
  }

  const usuarioDoForm = editando ? editando.usuarioId : usuarioNovo;

  return (
    <>
      <div className={`${cls.card} flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Home size={19} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-bold text-ink-900">Endereços</h1>
            <p className="text-[0.8125rem] text-ink-500 mt-0.5">Endereços cadastrados vinculados a cada usuário.</p>
          </div>
        </div>
        <button type="button" onClick={() => setCriando(true)} className={cls.btnPrimario}>
          <Plus size={16} aria-hidden="true" /> Cadastrar
        </button>
      </div>

      <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por rua, bairro, CEP ou usuário">
        <select aria-label="Filtrar por UF" value={filtroUf} onChange={(e) => setFiltroUf(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
          <option value="">Todas as UFs</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </CampoBusca>

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className={`${cls.card} overflow-hidden`}>
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Carregando">
            <div className={`${cls.skeleton} h-5 w-full rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-4/5 rounded-lg`} />
          </div>
        ) : erroCarregamento ? null : enderecos.length === 0 ? (
          <EmptyState icon={Home} title="Nenhum endereço cadastrado ainda" />
        ) : filtrados.length === 0 ? (
          <EmptyState icon={Home} title="Nenhum resultado encontrado" description="Tente buscar por outro termo ou limpe os filtros." />
        ) : (
          <>
          <ul className="divide-y divide-ink-100">
            {paginacao.itens.map((endereco) => (
              <li key={endereco.idEndereco} className="flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-brand-50/60 sm:px-6">
                <div className="min-w-0">
                  <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">
                    {endereco.logradouro}, {endereco.numeroCasa}
                    {endereco.complemento ? ` — ${endereco.complemento}` : ""}
                  </h3>
                  <p className="text-[0.8125rem] text-ink-500 mt-0.5 break-words">
                    {endereco.bairro} · {endereco.uf} · CEP {formatarCep(endereco.cep)} ·{" "}
                    {nomes.get(endereco.usuarioId) ?? `Usuário #${endereco.usuarioId}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCriando(false);
                      setEditando(endereco);
                    }}
                    className={cls.btnIcone}
                    aria-label="Editar endereço"
                  >
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => excluir(endereco)} className={cls.btnIconePerigo} aria-label="Excluir endereço">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Paginacao
            pagina={paginacao.pagina}
            totalPaginas={paginacao.totalPaginas}
            total={paginacao.total}
            inicio={paginacao.inicio}
            fim={paginacao.fim}
            tamanho={paginacao.tamanho}
            onPagina={paginacao.irPara}
            onTamanho={paginacao.setTamanho}
            rotulo="endereços"
          />
          </>
        )}
      </div>
      <Modal
        aberto={criando || !!editando}
        titulo={editando ? `Editar endereço de ${nomes.get(editando.usuarioId) ?? `Usuário #${editando.usuarioId}`}` : "Cadastrar endereço"}
        onFechar={fecharFormulario}
        largura="max-w-2xl"
      >
        {!editando && (
          <div className="mb-4 max-w-sm">
            <label htmlFor="endereco-usuario" className={cls.label}>
              Usuário
            </label>
            <select
              id="endereco-usuario"
              value={usuarioNovo}
              onChange={(e) => setUsuarioNovo(e.target.value ? Number(e.target.value) : "")}
              className={`${cls.input} !bg-white`}
            >
              <option value="">Selecione o usuário</option>
              {[...usuarios]
                .sort((a, b) => a.nomeUsuario.localeCompare(b.nomeUsuario, "pt-BR"))
                .map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {u.nomeUsuario} ({u.emailUsuario})
                  </option>
                ))}
            </select>
          </div>
        )}

        {usuarioDoForm ? (
          <FormEndereco
            key={editando?.idEndereco ?? `novo-${usuarioDoForm}`}
            usuarioId={Number(usuarioDoForm)}
            endereco={editando}
            onSalvo={() => {
              fecharFormulario();
              carregar();
            }}
          />
        ) : (
          <p className={cls.textoSuave}>Selecione o usuário para preencher o endereço.</p>
        )}
      </Modal>
    </>
  );
}
