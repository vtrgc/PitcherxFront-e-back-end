"use client";

import { type LucideIcon } from "lucide-react";

import CrudAdmin from "./CrudAdmin";
import { useAuth } from "../../context/AuthContext";

export interface TermoSimples {
  id: number;
  titulo: string;
  descricao: string;
}

interface Props {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  listar: () => Promise<TermoSimples[]>;
  criar: (dados: { titulo: string; descricao: string }) => Promise<unknown>;
  atualizar: (id: number, dados: { titulo: string; descricao: string }) => Promise<unknown>;
  excluir: (id: number) => Promise<unknown>;
}

/**
 * Cadastro de termos com título e descrição (termos de postagem e de vínculo).
 *
 * Regra do backend: leitura para todas as contas; cadastrar, editar e excluir só para ADMIN
 * (antes o servidor invertia a regra e bloqueava justamente o administrador).
 */
export default function CrudTermoSimples({ titulo, descricao, icone, listar, criar, atualizar, excluir }: Props) {
  const { usuario } = useAuth();
  const podeEscrever = !!usuario?.roles.includes("ADMIN");

  return (
    <CrudAdmin<TermoSimples, { titulo: string; descricao: string }>
      titulo={titulo}
      descricao={descricao}
      icone={icone}
      rotuloSingular="termo"
      rotuloPlural="termos"
      listar={listar}
      idDe={(t) => t.id}
      textoBusca={(t) => [t.titulo, t.descricao]}
      placeholderBusca="Buscar por título ou descrição"
      renderItem={(t) => (
        <>
          <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{t.titulo}</h3>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500 whitespace-pre-line break-words">{t.descricao}</p>
        </>
      )}
      campos={[
        { nome: "titulo", rotulo: "Título", maxLength: 255, largo: true },
        { nome: "descricao", rotulo: "Descrição", tipo: "textarea", maxLength: 2000 },
      ]}
      vazio={{ titulo: "", descricao: "" }}
      paraFormulario={(t) => ({ titulo: t.titulo, descricao: t.descricao })}
      validar={(f) => (!f.titulo.trim() || !f.descricao.trim() ? "Preencha o título e a descrição." : null)}
      salvar={(f, id) => {
        const dados = { titulo: f.titulo.trim(), descricao: f.descricao.trim() };
        return id ? atualizar(id, dados) : criar(dados);
      }}
      rotuloExcluir={(t) => t.titulo}
      excluir={(t) => excluir(t.id)}
      podeEscrever={podeEscrever}
      avisoSomenteLeitura="Somente a administração cadastra e edita estes termos."
    />
  );
}
