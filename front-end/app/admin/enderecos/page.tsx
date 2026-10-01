"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, Pencil, Trash2, Plus, X } from "lucide-react";

import EmptyState from "../../components/EmptyState";
import FormEndereco from "../../components/FormEndereco";
import Alerta from "../../components/ui/Alerta";
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
        {!criando && !editando && (
          <button type="button" onClick={() => setCriando(true)} className={cls.btnPrimario}>
            <Plus size={16} aria-hidden="true" /> Novo endereço
          </button>
        )}
      </div>

      {(criando || editando) && (
        <section className={`${cls.card} p-5 sm:p-6`} aria-labelledby="titulo-form-endereco">
          <div className="flex items-start justify-between gap-3">
            <h2 id="titulo-form-endereco" className={cls.h2}>
              {editando ? `Editar endereço de ${nomes.get(editando.usuarioId) ?? `Usuário #${editando.usuarioId}`}` : "Novo endereço"}
            </h2>
            <button type="button" onClick={fecharFormulario} className={cls.btnIcone} aria-label="Fechar formulário">
              <X size={16} />
            </button>
          </div>

          {!editando && (
            <div className="mt-4 max-w-sm">
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
                {usuarios.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {u.nomeUsuario}
                  </option>
                ))}
              </select>
            </div>
          )}

          {usuarioDoForm ? (
            <div className="mt-4">
              <FormEndereco
                key={editando?.idEndereco ?? `novo-${usuarioDoForm}`}
                usuarioId={Number(usuarioDoForm)}
                endereco={editando}
                onSalvo={() => {
                  fecharFormulario();
                  carregar();
                }}
              />
            </div>
          ) : (
            <p className={`${cls.textoSuave} mt-3`}>Selecione o usuário para preencher o endereço.</p>
          )}
        </section>
      )}

      {erroCarregamento && !loading && <Alerta onTentarNovamente={carregar}>{erroCarregamento}</Alerta>}

      <div className={`${cls.card} overflow-hidden`}>
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Carregando">
            <div className={`${cls.skeleton} h-5 w-full rounded-lg`} />
            <div className={`${cls.skeleton} h-5 w-4/5 rounded-lg`} />
          </div>
        ) : erroCarregamento ? null : enderecos.length === 0 ? (
          <EmptyState icon={Home} title="Nenhum endereço cadastrado ainda" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {enderecos.map((endereco) => (
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
                      window.scrollTo({ top: 0, behavior: "smooth" });
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
        )}
      </div>
    </>
  );
}
