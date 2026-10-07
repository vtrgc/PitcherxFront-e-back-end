"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, IdCard, Link2 } from "lucide-react";

import CrudAdmin from "../../components/admin/CrudAdmin";
import { cls } from "../../components/ui/estilos";
import { Especialidade, PerfilUsuario } from "../../types/PerfilUsuario";
import { excluirPerfilUsuario, listarEspecialidades, listarPerfisUsuario } from "../../services/perfilUsuario.service";
import { linkedinDoPerfil } from "../../lib/perfil";
import { formatarDocumento } from "../../lib/validacao";
import { tipoDocumento } from "../../lib/verificacao";

/**
 * Perfis profissionais (GET /perfil-usuario; DELETE /perfil-usuario/{id} aceita ADMIN).
 * O perfil (LinkedIn, CPF/CNPJ e especialidade) é preenchido pelo próprio usuário; aqui o
 * administrador consulta, filtra e remove perfis.
 */
export default function AdminPerfisPage() {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [filtroEspecialidade, setFiltroEspecialidade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    listarEspecialidades()
      .then((lista) => setEspecialidades([...(lista ?? [])].sort((a, b) => a.nomeEspecialidade.localeCompare(b.nomeEspecialidade, "pt-BR"))))
      .catch(() => setEspecialidades([]));
  }, []);

  const filtrar = useMemo(() => {
    if (!filtroEspecialidade && !filtroTipo) return undefined;
    return (p: PerfilUsuario) =>
      (!filtroEspecialidade || String(p.especialidade?.idEspecialidade) === filtroEspecialidade) &&
      (!filtroTipo || tipoDocumento(p.identificador) === filtroTipo);
  }, [filtroEspecialidade, filtroTipo]);

  return (
    <CrudAdmin<PerfilUsuario, Record<string, string>>
      titulo="Perfis profissionais"
      descricao="LinkedIn, documento (CPF/CNPJ) e especialidade informados por cada usuário. A edição é feita pelo próprio usuário."
      icone={IdCard}
      rotuloSingular="perfil profissional"
      rotuloPlural="perfis"
      listar={listarPerfisUsuario}
      idDe={(p) => p.idPerfilUsuario}
      textoBusca={(p) => [p.usuario?.nomeUsuario, p.usuario?.emailUsuario, p.especialidade?.nomeEspecialidade, linkedinDoPerfil(p), p.identificador]}
      placeholderBusca="Buscar por nome, e-mail, especialidade ou documento"
      filtros={
        <>
          <select
            aria-label="Filtrar por especialidade"
            value={filtroEspecialidade}
            onChange={(e) => setFiltroEspecialidade(e.target.value)}
            className={`${cls.input} !w-auto !max-w-[14rem] !py-2.5 !bg-white`}
          >
            <option value="">Todas as especialidades</option>
            {especialidades.map((e) => (
              <option key={e.idEspecialidade} value={e.idEspecialidade}>
                {e.nomeEspecialidade}
              </option>
            ))}
          </select>
          <select aria-label="Filtrar por documento" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={`${cls.input} !w-auto !py-2.5 !bg-white`}>
            <option value="">CPF e CNPJ</option>
            <option value="CPF">Pessoas (CPF)</option>
            <option value="CNPJ">Empresas (CNPJ)</option>
          </select>
        </>
      }
      filtrar={filtrar}
      chaveFiltro={`${filtroEspecialidade}|${filtroTipo}`}
      renderItem={(p) => {
        const linkedin = linkedinDoPerfil(p);
        const tipo = tipoDocumento(p.identificador);
        return (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[14.5px] font-semibold text-ink-900 break-words">{p.usuario.nomeUsuario}</h3>
              {p.especialidade?.nomeEspecialidade && <span className={cls.chip}>{p.especialidade.nomeEspecialidade}</span>}
              {p.usuario.active === false && <span className={cls.chipInativo}>Conta inativa</span>}
            </div>
            <p className="mt-0.5 text-[0.8125rem] text-ink-500 break-all">{p.usuario.emailUsuario}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-600">
              <span>
                {tipo ?? "Documento"}: <span className="font-medium tabular-nums">{p.identificador ? formatarDocumento(p.identificador) : "—"}</span>
              </span>
              {linkedin ? (
                <a href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                  <Link2 size={13} aria-hidden="true" /> LinkedIn
                </a>
              ) : (
                <span className="text-ink-400">LinkedIn não informado</span>
              )}
              <Link href={`/perfil/${p.usuario.idUsuario}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                <ExternalLink size={13} aria-hidden="true" /> Ver perfil
              </Link>
            </div>
          </>
        );
      }}
      campos={[]}
      vazio={{}}
      paraFormulario={() => ({})}
      salvar={async () => undefined}
      podeEscrever={false}
      rotuloExcluir={(p) => `perfil profissional de ${p.usuario.nomeUsuario}`}
      excluir={(p) => excluirPerfilUsuario(p.idPerfilUsuario)}
    />
  );
}
