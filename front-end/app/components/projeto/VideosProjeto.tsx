"use client";

import { useState } from "react";
import { Film, Loader2, Trash2, Upload, X } from "lucide-react";
import GaleriaVideos from "../GaleriaVideos";
import SeletorVideos from "../SeletorVideos";
import { cls } from "../ui/estilos";
import { useFeedback } from "../ui/FeedbackProvider";
import { mensagemErro } from "../../lib/api";
import { videosDaGaleria } from "../../lib/video";
import { removerVideosProjeto, substituirVideosProjeto } from "../../services/projeto.service";
import { Projeto } from "../../types/Projeto";

/** Seção "Vídeos" do projeto (PUT/DELETE /projeto/{id}/videos — vinculados ao projeto ou ADMIN). */
export default function VideosProjeto({
  projeto,
  podeGerenciar,
  onAtualizado,
}: {
  projeto: Projeto;
  podeGerenciar: boolean;
  onAtualizado: (projeto: Projeto) => void;
}) {
  const { notificar, confirmar } = useFeedback();
  const [gerenciando, setGerenciando] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const videos = videosDaGaleria(projeto.videos, projeto.urlVideoProjeto);

  if (videos.length === 0 && !podeGerenciar) return null;

  async function enviar() {
    if (arquivos.length === 0) return;
    setSalvando(true);
    try {
      const atualizado = await substituirVideosProjeto(projeto.idProjeto, arquivos);
      if (atualizado) onAtualizado({ ...projeto, videos: atualizado.videos, urlVideoProjeto: atualizado.urlVideoProjeto });
      setArquivos([]);
      setGerenciando(false);
      notificar("Vídeos atualizados.", "sucesso");
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível enviar os vídeos."));
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!(await confirmar("Remover todos os vídeos deste projeto?", { titulo: "Remover vídeos", confirmarLabel: "Remover", perigo: true }))) return;
    setSalvando(true);
    try {
      await removerVideosProjeto(projeto.idProjeto);
      onAtualizado({ ...projeto, videos: [], urlVideoProjeto: null });
      notificar("Vídeos removidos.", "sucesso");
    } catch (e) {
      notificar(mensagemErro(e, "Não foi possível remover os vídeos."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="mt-10 border-t border-ink-100 pt-8" aria-labelledby="titulo-videos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-videos" className={cls.eyebrow}>
          <Film size={14} aria-hidden="true" /> Vídeos
        </h2>
        {podeGerenciar && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setGerenciando((v) => !v);
                setArquivos([]);
              }}
              disabled={salvando}
              aria-expanded={gerenciando}
              className={`${cls.btnSecundario} !text-[13px]`}
            >
              {gerenciando ? <X size={15} aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
              {gerenciando ? "Cancelar" : videos.length > 0 ? "Substituir vídeos" : "Adicionar vídeos"}
            </button>
            {videos.length > 0 && !gerenciando && (
              <button type="button" onClick={remover} disabled={salvando} className={`${cls.btnPerigo} !text-[13px]`}>
                <Trash2 size={15} aria-hidden="true" /> Remover
              </button>
            )}
          </div>
        )}
      </div>

      {gerenciando && (
        <div className={`${cls.composer} mt-4`}>
          <p className="mb-3 text-[13px] text-ink-500">Os vídeos escolhidos substituem os atuais.</p>
          <SeletorVideos arquivos={arquivos} onChange={setArquivos} desabilitado={salvando} />
          <button type="button" onClick={enviar} disabled={salvando || arquivos.length === 0} className={`${cls.btnPrimario} mt-4`}>
            {salvando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
            {salvando ? "Enviando..." : "Enviar vídeos"}
          </button>
        </div>
      )}

      {videos.length > 0 ? (
        <GaleriaVideos videos={videos} titulo={projeto.nomeProjeto} className="mt-4" />
      ) : (
        !gerenciando && <p className="mt-5 text-[0.8125rem] text-ink-500">Nenhum vídeo adicionado ainda.</p>
      )}
    </section>
  );
}
