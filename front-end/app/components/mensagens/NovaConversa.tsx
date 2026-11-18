"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Alerta from "../ui/Alerta";
import { cls } from "../ui/estilos";
import { mensagemErro } from "../../lib/api";
import { TAMANHO_LISTA_COMPLETA, listarSeguidores, listarSeguindo } from "../../services/conexao.service";
import { ConexaoSimples } from "../../types/Conexao";

/**
 * Escolha de destinatário: só aparecem as conexões aceitas (quem eu sigo e quem me segue).
 * Mesmo assim, quem decide é o backend, que confere a conexão em todo envio.
 */
export default function NovaConversa({ aberto, idUsuario, onFechar }: { aberto: boolean; idUsuario: number; onFechar: () => void }) {
  const [pessoas, setPessoas] = useState<ConexaoSimples[] | null>(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    Promise.all([listarSeguindo(idUsuario, 0, TAMANHO_LISTA_COMPLETA), listarSeguidores(idUsuario, 0, TAMANHO_LISTA_COMPLETA)])
      .then(([seguindo, seguidores]) => {
        if (cancelado) return;
        const porId = new Map<number, ConexaoSimples>();
        for (const p of [...seguindo.itens, ...seguidores.itens]) if (p.id !== idUsuario) porId.set(p.id, p);
        setPessoas([...porId.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setErro("");
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemErro(e, "Não foi possível carregar suas conexões."));
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, idUsuario, tentativa]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const lista = pessoas ?? [];
    return termo ? lista.filter((p) => p.nome.toLocaleLowerCase("pt-BR").includes(termo)) : lista;
  }, [busca, pessoas]);

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova mensagem" descricao="Você pode conversar com as suas conexões aceitas.">
      <label className="relative block">
        <span className="sr-only">Buscar conexão pelo nome</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar conexão"
          className={`${cls.input} !py-2 !pl-9 !text-[13.5px]`}
          autoFocus
        />
      </label>

      <div className="mt-3 max-h-[50vh] overflow-y-auto">
        {erro ? (
          <Alerta onTentarNovamente={() => setTentativa((n) => n + 1)}>{erro}</Alerta>
        ) : pessoas === null ? (
          <ul className="space-y-2" aria-label="Carregando conexões">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 py-1.5">
                <div className={`${cls.skeleton} h-10 w-10 rounded-full`} />
                <div className={`${cls.skeleton} h-3 w-40 rounded`} />
              </li>
            ))}
          </ul>
        ) : pessoas.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Users size={26} className="text-ink-300" aria-hidden="true" />
            <p className="mt-2 text-[13.5px] font-semibold text-ink-800">Você ainda não tem conexões aceitas</p>
            <p className="mt-1 text-[12.5px] text-ink-500">As mensagens ficam disponíveis com quem aceitar a sua conexão.</p>
            <Link href="/explorar" onClick={onFechar} className={`${cls.btnContorno} mt-4 !text-[13px]`}>
              Encontrar pessoas
            </Link>
          </div>
        ) : filtradas.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-500">Nenhuma conexão com esse nome.</p>
        ) : (
          <ul className="divide-y divide-ink-50">
            {filtradas.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/mensagens?com=${p.id}`}
                  onClick={onFechar}
                  className="flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-ink-25"
                >
                  <Avatar url={p.imagem} nome={p.nome} tamanho={40} />
                  <span className="truncate text-[14px] font-semibold text-ink-900">{p.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
