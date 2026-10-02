"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { mensagemErro } from "../../lib/api";
import { formatarDocumento } from "../../lib/validacao";
import { CamposProfissionalValor, ErrosProfissional, LINKEDIN_MAX } from "../../lib/perfil";
import { listarEspecialidades } from "../../services/perfilUsuario.service";
import { Especialidade } from "../../types/PerfilUsuario";
import { cls } from "../ui/estilos";
import Alerta from "../ui/Alerta";

/** Campos controlados do perfil profissional (PerfilUsuario): área de atuação, LinkedIn e CPF/CNPJ. */
export default function CamposProfissional({
  valor,
  onChange,
  erros,
  desabilitado = false,
  prefixoId = "prof",
}: {
  valor: CamposProfissionalValor;
  onChange: (v: CamposProfissionalValor) => void;
  erros: ErrosProfissional;
  desabilitado?: boolean;
  prefixoId?: string;
}) {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroLista("");
    try {
      const lista = (await listarEspecialidades()) ?? [];
      setEspecialidades([...lista].sort((a, b) => a.nomeEspecialidade.localeCompare(b.nomeEspecialidade, "pt-BR")));
    } catch (error) {
      setErroLista(mensagemErro(error, "Não foi possível carregar as áreas de atuação."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const set = <K extends keyof CamposProfissionalValor>(campo: K, v: CamposProfissionalValor[K]) =>
    onChange({ ...valor, [campo]: v });

  const id = (c: string) => `${prefixoId}-${c}`;
  const erroDe = (c: keyof CamposProfissionalValor) =>
    erros[c] ? (
      <p id={id(`${c}-erro`)} className="mt-1 text-[13px] text-red-600">
        {erros[c]}
      </p>
    ) : null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {erroLista && (
        <Alerta className="md:col-span-2" onTentarNovamente={carregar}>
          {erroLista}
        </Alerta>
      )}

      <div className="md:col-span-2">
        <label htmlFor={id("idEspecialidade")} className={cls.label}>
          Área de atuação
        </label>
        <select
          id={id("idEspecialidade")}
          value={valor.idEspecialidade}
          onChange={(e) => set("idEspecialidade", e.target.value ? Number(e.target.value) : "")}
          disabled={desabilitado || carregando}
          aria-invalid={!!erros.idEspecialidade}
          aria-describedby={erros.idEspecialidade ? id("idEspecialidade-erro") : id("idEspecialidade-ajuda")}
          className={`${cls.input} !bg-white`}
        >
          <option value="">
            {carregando
              ? "Carregando áreas…"
              : especialidades.length === 0
              ? "Nenhuma área cadastrada pela administração"
              : "Selecione sua área"}
          </option>
          {especialidades.map((e) => (
            <option key={e.idEspecialidade} value={e.idEspecialidade}>
              {e.nomeEspecialidade}
            </option>
          ))}
        </select>
        {erroDe("idEspecialidade") ?? (
          <p id={id("idEspecialidade-ajuda")} className="mt-1 text-[12.5px] text-ink-400">
            Aparece como seu título no perfil e ajuda outras pessoas a encontrarem você em Explorar.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={id("linkedin")} className={cls.label}>
          LinkedIn <span className="font-normal text-ink-400">(opcional)</span>
        </label>
        <input
          id={id("linkedin")}
          type="url"
          inputMode="url"
          autoComplete="url"
          value={valor.linkedin}
          maxLength={LINKEDIN_MAX}
          disabled={desabilitado}
          onChange={(e) => set("linkedin", e.target.value)}
          placeholder="linkedin.com/in/seu-usuario"
          aria-invalid={!!erros.linkedin}
          aria-describedby={erros.linkedin ? id("linkedin-erro") : id("linkedin-ajuda")}
          className={cls.input}
        />
        {erroDe("linkedin") ?? (
          <p id={id("linkedin-ajuda")} className="mt-1 text-[12.5px] text-ink-400">
            Não é obrigatório. Se preferir, deixe em branco.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={id("identificador")} className={cls.label}>
          CPF ou CNPJ
        </label>
        <input
          id={id("identificador")}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={valor.identificador}
          maxLength={18}
          disabled={desabilitado}
          onChange={(e) => set("identificador", e.target.value.replace(/[^\d./-]/g, ""))}
          onBlur={() => set("identificador", formatarDocumento(valor.identificador))}
          placeholder="Somente números"
          aria-invalid={!!erros.identificador}
          aria-describedby={erros.identificador ? id("identificador-erro") : id("identificador-ajuda")}
          className={cls.input}
        />
        {erroDe("identificador") ?? (
          <p id={id("identificador-ajuda")} className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-ink-400">
            <Lock size={12} aria-hidden="true" /> Não aparece no seu perfil.
          </p>
        )}
      </div>
    </div>
  );
}
