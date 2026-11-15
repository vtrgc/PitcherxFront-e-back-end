"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera, ImageUp, Loader2 } from "lucide-react";
import AuthAlert from "./AuthAlert";
import { mensagemErro } from "../../lib/api";
import { ACCEPT_FOTO, validarArquivoFoto } from "../../lib/imagemPerfil";
import { LIMITE_TENTATIVAS_IDENTIDADE, enviarFotoVerificacaoSemLogin } from "../../services/usuario.service";

/**
 * Envio da foto de verificação de identidade por quem ainda não consegue entrar (conta nova
 * aguardando aprovação ou reprovada). Usa o e-mail e a senha que a pessoa acabou de digitar;
 * a administração vê a foto em "Análise de identidade" antes de aprovar a conta.
 */
export default function EnvioFotoVerificacao({ email, senha, introducao }: { email: string; senha: string; introducao?: string }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState<{ tentativas: number } | null>(null);

  const previa = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo]);
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa);
    },
    [previa]
  );

  function escolher(f: File | undefined) {
    setErro("");
    setEnviada(null);
    if (!f) return;
    const invalido = validarArquivoFoto(f);
    if (invalido) {
      setArquivo(null);
      setErro(invalido);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setArquivo(f);
  }

  async function enviar() {
    if (!arquivo) {
      setErro("Escolha uma foto antes de enviar.");
      return;
    }
    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha da sua conta para enviar a foto.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const r = await enviarFotoVerificacaoSemLogin(email, senha, arquivo);
      setEnviada({ tentativas: r?.tentativasIdentidade ?? 1 });
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível enviar a foto. Tente novamente."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="ax-foto" aria-labelledby={`${inputId}-titulo`}>
      <h2 id={`${inputId}-titulo`} className="ax-foto__titulo">
        <Camera size={18} aria-hidden="true" /> Foto para verificação de identidade
      </h2>
      {introducao && <p className="ax-foto__texto ax-foto__intro">{introducao}</p>}
      <p className="ax-foto__texto">
        Envie uma foto nítida do seu rosto junto a um documento com foto. Para empresas, um documento que comprove a posse da empresa. A
        administração confere essa foto antes de liberar a conta.
      </p>

      {erro && <AuthAlert>{erro}</AuthAlert>}
      {enviada && (
        <AuthAlert variant="success">
          Foto enviada! A administração vai analisar sua identidade e você receberá um e-mail com o resultado (envio{" "}
          {enviada.tentativas} de até {LIMITE_TENTATIVAS_IDENTIDADE}).
        </AuthAlert>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_FOTO}
        className="sr-only"
        onChange={(e) => escolher(e.target.files?.[0])}
      />

      {previa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previa} alt="Prévia da foto escolhida" className="ax-foto__previa" />
      ) : (
        !enviada && (
          <label htmlFor={inputId} className="ax-foto__vazio">
            <ImageUp size={22} aria-hidden="true" />
            <span>Escolher foto (JPG, PNG ou WEBP, até 10 MB)</span>
          </label>
        )
      )}

      <div className="ax-foto__acoes">
        {(previa || enviada) && (
          <label htmlFor={inputId} className="ax-foto__trocar">
            {enviada ? "Enviar outra foto" : "Trocar foto"}
          </label>
        )}
        {arquivo && (
          <button type="button" className="ax-btn ax-foto__enviar" onClick={enviar} disabled={enviando}>
            {enviando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            {enviando ? "Enviando..." : "Enviar foto"}
          </button>
        )}
      </div>
    </section>
  );
}
