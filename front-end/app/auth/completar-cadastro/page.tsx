"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Briefcase, Camera, Check, Loader2, MapPin } from "lucide-react";
import Footer from "../../components/Footer";
import { CarregandoSessao } from "../../components/PageShell";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import CampoFotoPerfil from "../../components/perfil/CampoFotoPerfil";
import CamposProfissional from "../../components/perfil/CamposProfissional";
import CamposEndereco from "../../components/perfil/CamposEndereco";
import { useAuth } from "../../context/AuthContext";
import { useRequireAuth } from "../../hook/useRequireAuth";
import { useDadosPerfil } from "../../hook/useDadosPerfil";
import { FotoPendente, liberarFoto } from "../../lib/imagemPerfil";
import {
  CamposEnderecoValor,
  CamposProfissionalValor,
  enderecoIgual,
  enderecoInicial,
  enderecoVazio,
  ErrosEndereco,
  ErrosProfissional,
  profissionalIgual,
  profissionalInicial,
  profissionalVazio,
  validarEndereco,
  validarProfissional,
} from "../../lib/perfil";
import { mensagemErroEtapa, salvarEndereco, salvarFoto, salvarProfissional } from "../../services/perfilEdicao.service";
import { PerfilUsuario } from "../../types/PerfilUsuario";
import { Endereco } from "../../types/Endereco";

const ETAPAS = [
  { chave: "foto", titulo: "Foto", icone: Camera },
  { chave: "profissional", titulo: "Profissional", icone: Briefcase },
  { chave: "localizacao", titulo: "Localização", icone: MapPin },
] as const;

/**
 * Etapa pós-cadastro. O cadastro (`POST /usuario/cadastro-usuario`) não autentica; a
 * tela de cadastro já faz o login com as credenciais digitadas e só então chega aqui.
 * Esta página é protegida (exige sessão) e nada nela é obrigatório: "Fazer isso depois"
 * leva ao feed sem bloquear o uso da plataforma.
 */
export default function CompletarCadastroPage() {
  const router = useRouter();
  const { pronto, usuario } = useRequireAuth("usuario");
  const dados = useDadosPerfil(pronto ? usuario?.idUsuario : null);
  const verificado = useRef(false);

  // Quem já tem perfil profissional completa/edita pela página de edição.
  useEffect(() => {
    if (!pronto || dados.carregando || verificado.current) return;
    verificado.current = true;
    if (dados.perfil && !dados.erro) router.replace("/perfil/editar");
  }, [pronto, dados.carregando, dados.perfil, dados.erro, router]);

  if (!pronto || !usuario || dados.carregando || (dados.perfil && !dados.erro)) return <CarregandoSessao />;

  return (
    <>
      <header className="border-b border-ink-100 bg-white/[0.82] backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient">
              <Image src="/logo.png" alt="" width={17} height={17} className="rounded-full" />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight text-ink-900">
              Pitcher<span className="text-brand-300">X</span>
            </span>
          </span>
          <Link href="/feed" className="text-[13.5px] font-semibold text-ink-500 hover:text-ink-900">
            Fazer isso depois
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-3xl">
          {dados.erro || dados.erroEndereco ? (
            <Alerta titulo="Não foi possível carregar seus dados" onTentarNovamente={dados.recarregar}>
              {dados.erro || dados.erroEndereco} Você pode tentar novamente ou{" "}
              <Link href="/feed" className="font-semibold underline">
                continuar para a plataforma
              </Link>
              .
            </Alerta>
          ) : (
            <Assistente perfilInicial={dados.perfil} enderecoInicialApi={dados.endereco} />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

function Assistente({ perfilInicial, enderecoInicialApi }: { perfilInicial: PerfilUsuario | null; enderecoInicialApi: Endereco | null }) {
  const router = useRouter();
  const { usuario, atualizarUsuarioLocal, recarregarUsuario } = useAuth();

  const [etapa, setEtapa] = useState(0);
  const [concluidas, setConcluidas] = useState<Set<number>>(new Set());
  const [algoSalvo, setAlgoSalvo] = useState(false);

  const [foto, setFoto] = useState<FotoPendente>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(perfilInicial);
  const [prof, setProf] = useState<CamposProfissionalValor>(() => profissionalInicial(perfilInicial));
  const [endereco, setEndereco] = useState<Endereco | null>(enderecoInicialApi);
  const [end, setEnd] = useState<CamposEnderecoValor>(() => enderecoInicial(enderecoInicialApi));

  const [errosProf, setErrosProf] = useState<ErrosProfissional>({});
  const [errosEnd, setErrosEnd] = useState<ErrosEndereco>({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const fotoRef = useRef<FotoPendente>(null);
  useEffect(() => {
    fotoRef.current = foto;
  }, [foto]);
  useEffect(() => () => liberarFoto(fotoRef.current), []);

  if (!usuario) return null;
  const idUsuario = usuario.idUsuario;
  const ultima = etapa === ETAPAS.length - 1;

  function irPara(indice: number) {
    setErro("");
    setEtapa(indice);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.requestAnimationFrame(() => tituloRef.current?.focus());
  }

  function concluirFluxo(salvouAlgo: boolean) {
    recarregarUsuario().catch(() => undefined);
    router.replace(salvouAlgo ? "/perfil?salvo=completo" : "/feed");
  }

  /** O que a etapa atual vai enviar (null = nada preenchido, apenas avança). */
  function etapaTemDados(): boolean {
    if (etapa === 0) return foto?.tipo === "nova";
    // Dados já salvos e não alterados (ex.: voltou uma etapa) não são reenviados.
    if (etapa === 1) return !profissionalVazio(prof) && !(perfil && profissionalIgual(prof, profissionalInicial(perfil)));
    return !enderecoVazio(end) && !(endereco && enderecoIgual(end, enderecoInicial(endereco)));
  }

  async function salvarEContinuar() {
    if (salvandoRef.current) return;
    setErro("");

    if (!etapaTemDados()) {
      if (ultima) concluirFluxo(algoSalvo);
      else irPara(etapa + 1);
      return;
    }

    // Validação da etapa atual antes de enviar.
    if (etapa === 1) {
      const e = validarProfissional(prof);
      setErrosProf(e);
      if (Object.keys(e).length > 0) {
        setErro("Para salvar suas informações profissionais, preencha os três campos. Se preferir, deixe todos em branco e continue.");
        return;
      }
    }
    if (etapa === 2) {
      const e = validarEndereco(end);
      setErrosEnd(e);
      if (Object.keys(e).length > 0) {
        setErro("Para salvar sua localização, preencha todos os campos. Se preferir, deixe todos em branco e conclua.");
        return;
      }
    }

    salvandoRef.current = true;
    setSalvando(true);
    try {
      if (etapa === 0 && foto?.tipo === "nova") {
        const url = await salvarFoto(idUsuario, foto);
        atualizarUsuarioLocal({ urlImagemUsuario: url });
        liberarFoto(foto);
        setFoto(null);
      } else if (etapa === 1) {
        const salvo = await salvarProfissional(idUsuario, perfil, prof);
        setPerfil(salvo);
        setProf(profissionalInicial(salvo));
      } else if (etapa === 2) {
        const salvo = await salvarEndereco(idUsuario, endereco, end);
        setEndereco(salvo);
        setEnd(enderecoInicial(salvo));
      }
      setAlgoSalvo(true);
      setConcluidas((c) => new Set(c).add(etapa));
      if (ultima) concluirFluxo(true);
      else irPara(etapa + 1);
    } catch (error) {
      const chave = etapa === 0 ? "foto" : etapa === 1 ? "profissional" : "endereco";
      setErro(mensagemErroEtapa(chave, error));
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  }

  const rotuloPrincipal = etapaTemDados()
    ? ultima
      ? "Salvar e concluir"
      : "Salvar e continuar"
    : ultima
    ? "Concluir"
    : "Continuar sem preencher";

  return (
    <div>
      <div className="text-center">
        <p className={cls.eyebrow}>Olá, {usuario.nomeUsuario.split(" ")[0]}! Sua conta foi criada</p>
        <h1 className="font-display mt-2 text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[2.1rem]">
          Vamos completar seu perfil
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[0.9375rem] leading-[1.65] text-ink-600">
          Conte um pouco mais sobre você e deixe seu perfil pronto para criar conexões, compartilhar ideias e encontrar novas
          oportunidades.
        </p>
      </div>

      {/* Progresso */}
      <ol className="mx-auto mt-8 flex max-w-lg items-center" aria-label="Etapas">
        {ETAPAS.map(({ chave, titulo, icone: Icone }, i) => {
          const atual = i === etapa;
          const feita = concluidas.has(i);
          return (
            <li key={chave} className="flex flex-1 items-center last:flex-none" aria-current={atual ? "step" : undefined}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    atual
                      ? "border-brand-600 bg-brand-600 text-white shadow-glow"
                      : feita
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-400"
                  }`}
                >
                  {feita && !atual ? <Check size={17} aria-hidden="true" /> : <Icone size={17} aria-hidden="true" />}
                </span>
                <span className={`text-[12px] font-semibold ${atual ? "text-ink-900" : "text-ink-500"}`}>
                  {titulo}
                  <span className="sr-only">{feita ? " (concluída)" : atual ? " (etapa atual)" : ""}</span>
                </span>
              </div>
              {i < ETAPAS.length - 1 && (
                <span className={`mx-2 mb-6 h-0.5 flex-1 rounded-full ${i < etapa ? "bg-brand-400" : "bg-ink-200"}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-[12.5px] text-ink-400" aria-live="polite">
        Etapa {etapa + 1} de {ETAPAS.length} · tudo aqui é opcional
      </p>

      <form
        noValidate
        className={`${cls.card} mt-6 p-5 sm:p-8`}
        onSubmit={(e) => {
          e.preventDefault();
          salvarEContinuar();
        }}
      >
        {etapa === 0 && (
          <>
            <h2 ref={tituloRef} tabIndex={-1} className={`${cls.h2} outline-none`}>
              Adicione uma foto de perfil
            </h2>
            <p className={`${cls.textoSuave} mb-5 mt-1`}>Perfis com foto transmitem mais confiança e são reconhecidos no feed.</p>
            <CampoFotoPerfil
              urlAtual={usuario.urlImagemUsuario}
              nome={usuario.nomeUsuario}
              pendente={foto}
              onChange={setFoto}
              desabilitado={salvando}
              permitirRemover={false}
            />
          </>
        )}

        {etapa === 1 && (
          <>
            <h2 ref={tituloRef} tabIndex={-1} className={`${cls.h2} outline-none`}>
              Informações profissionais
            </h2>
            <p className={`${cls.textoSuave} mb-5 mt-1`}>
              Mostre sua área de atuação e seu LinkedIn para quem procura parceiros e investidores. Para salvar, o servidor
              exige os três campos juntos.
            </p>
            <CamposProfissional valor={prof} onChange={setProf} erros={errosProf} desabilitado={salvando} prefixoId="cc-prof" />
          </>
        )}

        {etapa === 2 && (
          <>
            <h2 ref={tituloRef} tabIndex={-1} className={`${cls.h2} outline-none`}>
              Onde você está?
            </h2>
            <p className={`${cls.textoSuave} mb-5 mt-1`}>
              No seu perfil aparece apenas o estado. O endereço completo não é exibido.
            </p>
            <CamposEndereco valor={end} onChange={setEnd} erros={errosEnd} desabilitado={salvando} prefixoId="cc-end" />
          </>
        )}

        {erro && <Alerta className="mt-6">{erro}</Alerta>}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {etapa > 0 ? (
            <button type="button" onClick={() => irPara(etapa - 1)} disabled={salvando} className={cls.btnContorno}>
              <ArrowLeft size={16} aria-hidden="true" /> Voltar
            </button>
          ) : (
            <Link href="/feed" className={`${cls.btnContorno} sm:!border-transparent sm:!bg-transparent`}>
              Fazer isso depois
            </Link>
          )}
          <button type="submit" disabled={salvando} className={cls.btnPrimario}>
            {salvando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            {salvando ? "Salvando…" : rotuloPrincipal}
            {!salvando && !ultima && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </form>
    </div>
  );
}
