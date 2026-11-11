"use client";

import { useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import GaleriaVideos from "../GaleriaVideos";
import SeletorVideos from "../SeletorVideos";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import { atualizarVideoPerfil, removerVideoPerfil } from "../../services/perfilUsuario.service";
import { PerfilUsuario } from "../../types/PerfilUsuario";

/** Vídeo de apresentação do perfil (POST/DELETE /perfil-usuario/{id}/video) — salvo na hora. */
export default function VideoPerfil({ perfil, onAtualizado }: { perfil: PerfilUsuario; onAtualizado: (p: PerfilUsuario) => void }) {
  const { notificar, confirmar } = useFeedback();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
    if (arquivos.length === 0) return;
    setSalvando(true);
    try {
      const atualizado = await atualizarVideoPerfil(perfil.idPerfilUsuario, arquivos[0]);
      onAtualizado({ ...perfil, urlVideoPerfil: atualizado?.urlVideoPerfil ?? perfil.urlVideoPerfil });
      setArquivos([]);
      notificar("Vídeo de apresentação salvo.", "sucesso");
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível enviar o vídeo."));
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!(await confirmar("Remover o vídeo de apresentação?", { titulo: "Remover vídeo", confirmarLabel: "Remover", perigo: true }))) return;
    setSalvando(true);
    try {
      await removerVideoPerfil(perfil.idPerfilUsuario);
      onAtualizado({ ...perfil, urlVideoPerfil: null });
      notificar("Vídeo removido.", "sucesso");
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível remover o vídeo."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      {perfil.urlVideoPerfil && <GaleriaVideos videos={[perfil.urlVideoPerfil]} titulo="Seu vídeo de apresentação" />}
      <SeletorVideos
        arquivos={arquivos}
        onChange={setArquivos}
        maximo={1}
        rotulo={perfil.urlVideoPerfil ? "Escolher outro vídeo" : "Escolher vídeo"}
        desabilitado={salvando}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={enviar} disabled={salvando || arquivos.length === 0} className={`${cls.btnPrimario} !text-[13px]`}>
          {salvando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
          {salvando ? "Enviando..." : "Enviar vídeo"}
        </button>
        {perfil.urlVideoPerfil && (
          <button type="button" onClick={remover} disabled={salvando} className={`${cls.btnPerigo} !text-[13px]`}>
            <Trash2 size={15} aria-hidden="true" /> Remover vídeo
          </button>
        )}
      </div>
    </div>
  );
}
