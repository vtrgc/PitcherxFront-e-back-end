"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Camera,
  ChevronRight,
  Info,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import Alerta from "../../components/ui/Alerta";
import { cls } from "../../components/ui/estilos";
import { useFeedback } from "../../components/ui/FeedbackProvider";
import CampoFotoPerfil from "../../components/perfil/CampoFotoPerfil";
import CamposProfissional from "../../components/perfil/CamposProfissional";
import CamposEndereco from "../../components/perfil/CamposEndereco";
import { useAuth, AuthUser } from "../../context/AuthContext";
import { useDadosPerfil } from "../../hook/useDadosPerfil";
import { useAvisoAlteracoes } from "../../hook/useAvisoAlteracoes";
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
import {
  EtapaPerfil,
  mensagemErroEtapa,
  ROTULO_ETAPA,
  salvarEndereco,
  salvarFoto,
  salvarProfissional,
} from "../../services/perfilEdicao.service";
import { PerfilUsuario } from "../../types/PerfilUsuario";
import { Endereco } from "../../types/Endereco";

/**
 * Editar perfil — somente o que o backend persiste:
 *  foto (POST/DELETE /usuario/{id}/foto), informações profissionais (/perfil-usuario)
 *  e localização (/endereco). Nome, e-mail e telefone são exibidos somente para leitura
 *  (ver aviso na seção "Informações básicas").
 */
export default function EditarPerfilPage() {
  return (
    <PageShell rightRail={null}>
      <EditarPerfil />
    </PageShell>
  );
}

function EditarPerfil() {
  const { usuario } = useAuth();
  const dados = useDadosPerfil(usuario?.idUsuario);

  if (!usuario) return null;

  const erroCarga = dados.erro || dados.erroEndereco;

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft size={15} aria-hidden="true" />
        Meu perfil
      </Link>
      <div className="mt-3">
        <h1 className={cls.h1}>Editar perfil</h1>
        <p className={`${cls.textoSuave} mt-1`}>Atualize sua foto e as informações que aparecem para a comunidade.</p>
      </div>

      {dados.carregando ? (
        <div className="mt-8 space-y-5" aria-busy="true" aria-label="Carregando seus dados">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${cls.card} space-y-3 p-6`}>
              <div className={`${cls.skeleton} h-5 w-44 rounded-md`} />
              <div className={`${cls.skeleton} h-11 w-full rounded-lg`} />
              <div className={`${cls.skeleton} h-11 w-2/3 rounded-lg`} />
            </div>
          ))}
        </div>
      ) : erroCarga ? (
        // Sem saber se já existe perfil/endereço, salvar poderia criar registros duplicados.
        <Alerta className="mt-8" titulo="Não foi possível carregar seus dados" onTentarNovamente={dados.recarregar}>
          {erroCarga}
        </Alerta>
      ) : (
        <FormularioPerfil usuario={usuario} perfilInicial={dados.perfil} enderecoInicialApi={dados.endereco} />
      )}
    </div>
  );
}

type Falha = { etapa: EtapaPerfil; mensagem: string };

function FormularioPerfil({
  usuario,
  perfilInicial,
  enderecoInicialApi,
}: {
  usuario: AuthUser;
  perfilInicial: PerfilUsuario | null;
  enderecoInicialApi: Endereco | null;
}) {
  const router = useRouter();
  const { isAdmin, atualizarUsuarioLocal, recarregarUsuario } = useAuth();
  const { notificar, confirmar } = useFeedback();

  // Registros atuais no servidor (mudam após cada salvamento bem-sucedido).
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(perfilInicial);
  const [endereco, setEndereco] = useState<Endereco | null>(enderecoInicialApi);

  // Valores de referência (o que está salvo) e valores do formulário.
  const [baseProf, setBaseProf] = useState<CamposProfissionalValor>(() => profissionalInicial(perfilInicial));
  const [prof, setProf] = useState<CamposProfissionalValor>(baseProf);
  const [baseEnd, setBaseEnd] = useState<CamposEnderecoValor>(() => enderecoInicial(enderecoInicialApi));
  const [end, setEnd] = useState<CamposEnderecoValor>(baseEnd);
  const [removerEndereco, setRemoverEndereco] = useState(false);
  const [foto, setFoto] = useState<FotoPendente>(null);

  const [errosProf, setErrosProf] = useState<ErrosProfissional>({});
  const [errosEnd, setErrosEnd] = useState<ErrosEndereco>({});
  const [erroGeral, setErroGeral] = useState("");
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [sucessos, setSucessos] = useState<EtapaPerfil[]>([]);
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  const mostrarProfissional = !isAdmin;
  const mostrarEndereco = !isAdmin;

  const sujo = useMemo(
    () => ({
      foto: foto !== null,
      profissional: mostrarProfissional && !profissionalIgual(prof, baseProf),
      endereco: mostrarEndereco && (removerEndereco || !enderecoIgual(end, baseEnd)),
    }),
    [foto, prof, baseProf, end, baseEnd, removerEndereco, mostrarProfissional, mostrarEndereco]
  );
  const temAlteracoes = sujo.foto || sujo.profissional || sujo.endereco;

  const confirmarDescarte = useCallback(
    () =>
      confirmar("Você tem alterações que ainda não foram salvas. Deseja sair e descartá-las?", {
        titulo: "Descartar alterações?",
        confirmarLabel: "Descartar",
        cancelarLabel: "Continuar editando",
        perigo: true,
      }),
    [confirmar]
  );
  const aviso = useAvisoAlteracoes(temAlteracoes && !salvando, confirmarDescarte);

  // Libera a prévia local da foto ao sair da página.
  const fotoRef = useRef<FotoPendente>(null);
  useEffect(() => {
    fotoRef.current = foto;
  }, [foto]);
  useEffect(() => () => liberarFoto(fotoRef.current), []);

  // Rola até a seção pedida na URL (ex.: /perfil/editar#foto a partir do perfil).
  useEffect(() => {
    const alvo = window.location.hash.slice(1);
    if (alvo) document.getElementById(alvo)?.scrollIntoView({ block: "start" });
  }, []);

  async function cancelar() {
    if (temAlteracoes && !(await confirmarDescarte())) return;
    aviso.liberar();
    liberarFoto(foto);
    router.push("/perfil");
  }

  function focarPrimeiroErro() {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    });
  }

  async function salvar() {
    if (salvandoRef.current) return; // evita envio duplicado (duplo clique / Enter)
    setFalhas([]);
    setSucessos([]);
    setErroGeral("");

    if (!temAlteracoes) {
      notificar("Não há alterações para salvar.", "info");
      return;
    }

    // 1) Validação de tudo que será enviado, antes de qualquer requisição.
    const eProf = sujo.profissional ? validarProfissional(prof) : {};
    const eEnd = sujo.endereco && !removerEndereco ? validarEndereco(end) : {};
    setErrosProf(eProf);
    setErrosEnd(eEnd);
    if (Object.keys(eProf).length > 0 || Object.keys(eEnd).length > 0) {
      setErroGeral(
        Object.keys(eProf).length > 0 && !perfil && !profissionalVazio(prof)
          ? "Revise os campos destacados. Para salvar as informações profissionais, informe a área de atuação e o CPF/CNPJ (o LinkedIn é opcional)."
          : "Revise os campos destacados."
      );
      focarPrimeiroErro();
      return;
    }

    // 2) Envio, parte por parte, com os endpoints existentes.
    salvandoRef.current = true;
    setSalvando(true);
    const novasFalhas: Falha[] = [];
    const salvas: EtapaPerfil[] = [];

    if (sujo.foto && foto) {
      try {
        const url = await salvarFoto(usuario.idUsuario, foto);
        atualizarUsuarioLocal({ urlImagemUsuario: url });
        liberarFoto(foto);
        setFoto(null);
        salvas.push("foto");
      } catch (error) {
        novasFalhas.push({ etapa: "foto", mensagem: mensagemErroEtapa("foto", error) });
      }
    }

    if (sujo.profissional) {
      try {
        const salvo = await salvarProfissional(usuario.idUsuario, perfil, prof);
        const base = profissionalInicial(salvo);
        setPerfil(salvo);
        setBaseProf(base);
        setProf(base);
        salvas.push("profissional");
      } catch (error) {
        novasFalhas.push({ etapa: "profissional", mensagem: mensagemErroEtapa("profissional", error) });
      }
    }

    if (sujo.endereco) {
      try {
        const salvo = await salvarEndereco(usuario.idUsuario, endereco, removerEndereco ? null : end);
        const base = enderecoInicial(salvo);
        setEndereco(salvo);
        setBaseEnd(base);
        setEnd(base);
        setRemoverEndereco(false);
        salvas.push("endereco");
      } catch (error) {
        novasFalhas.push({ etapa: "endereco", mensagem: mensagemErroEtapa("endereco", error) });
      }
    }

    salvandoRef.current = false;
    setSalvando(false);

    // Revalida os dados do usuário logado com o servidor (foto, nome...).
    recarregarUsuario().catch(() => undefined);

    if (novasFalhas.length === 0) {
      aviso.liberar();
      router.push("/perfil?salvo=1");
      return;
    }
    setFalhas(novasFalhas);
    setSucessos(salvas);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const secoes = [
    { id: "foto", rotulo: "Foto de perfil", icone: Camera, visivel: true },
    { id: "basicas", rotulo: "Informações básicas", icone: UserRound, visivel: true },
    { id: "profissional", rotulo: "Informações profissionais", icone: Briefcase, visivel: mostrarProfissional },
    { id: "localizacao", rotulo: "Localização", icone: MapPin, visivel: mostrarEndereco },
  ].filter((s) => s.visivel);

  return (
    <form
      noValidate
      className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <nav aria-label="Seções" className="hidden lg:block">
        <ul className="sticky top-8 space-y-0.5">
          {secoes.map(({ id, rotulo, icone: Icone }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-600 hover:bg-white hover:text-ink-900"
              >
                <Icone size={16} aria-hidden="true" className="text-ink-400" />
                {rotulo}
              </a>
            </li>
          ))}
          <li className="mt-2 border-t border-ink-100 pt-2">
            <Link
              href="/configuracoes"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-600 hover:bg-white hover:text-ink-900"
            >
              <ShieldCheck size={16} aria-hidden="true" className="text-ink-400" />
              Senha e segurança
            </Link>
          </li>
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">
        {falhas.length > 0 && (
          <Alerta titulo="Algumas alterações não foram salvas">
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {falhas.map((f) => (
                <li key={f.etapa}>
                  <strong>{ROTULO_ETAPA[f.etapa]}:</strong> {f.mensagem}
                </li>
              ))}
            </ul>
            {sucessos.length > 0 && (
              <p className="mt-2">
                Salvo com sucesso: {sucessos.map((e) => ROTULO_ETAPA[e].toLowerCase()).join(", ")}.
              </p>
            )}
            <p className="mt-2">Seus dados continuam no formulário. Corrija e clique em “Salvar alterações” para tentar de novo.</p>
          </Alerta>
        )}
        {erroGeral && <Alerta>{erroGeral}</Alerta>}

        {/* ----------------------------------------------------------- foto */}
        <Secao id="foto" titulo="Foto de perfil" descricao="Aparece no seu perfil, no feed, nos comentários e em Explorar.">
          <CampoFotoPerfil
            urlAtual={usuario.urlImagemUsuario}
            nome={usuario.nomeUsuario}
            pendente={foto}
            onChange={setFoto}
            desabilitado={salvando}
          />
        </Secao>

        {/* -------------------------------------------------------- básicas */}
        <Secao id="basicas" titulo="Informações básicas">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoLeitura id="basica-nome" rotulo="Nome" valor={usuario.nomeUsuario} className="sm:col-span-2" />
            <CampoLeitura id="basica-email" rotulo="E-mail" valor={usuario.emailUsuario} />
            <CampoLeitura id="basica-telefone" rotulo="Telefone" valor={usuario.telefoneUsuario || ""} placeholder="Não informado" />
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-ink-25 px-3.5 py-3 text-[13px] leading-5 text-ink-600">
            <Info size={16} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
            <span>
              Por uma limitação temporária do servidor, nome, e-mail e telefone ainda não podem ser alterados por aqui. As
              demais informações desta página são salvas normalmente.
            </span>
          </p>
        </Secao>

        {/* --------------------------------------------------- profissional */}
        {mostrarProfissional && (
          <Secao
            id="profissional"
            titulo="Informações profissionais"
            descricao={
              perfil
                ? "Sua área de atuação (e o LinkedIn, se informado) aparecem no perfil e em Explorar."
                : "Opcional. Para salvar, informe a área de atuação e o CPF/CNPJ — o LinkedIn não é obrigatório."
            }
          >
            <CamposProfissional valor={prof} onChange={setProf} erros={errosProf} desabilitado={salvando} />
          </Secao>
        )}

        {/* ------------------------------------------------------ endereço */}
        {mostrarEndereco && (
          <Secao
            id="localizacao"
            titulo="Localização"
            descricao="Opcional. No perfil aparece apenas o seu estado — o endereço completo não é exibido."
            acao={
              endereco &&
              (removerEndereco ? (
                <button type="button" onClick={() => setRemoverEndereco(false)} disabled={salvando} className={cls.btnSecundario}>
                  <RotateCcw size={15} aria-hidden="true" /> Manter localização
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRemoverEndereco(true);
                    setErrosEnd({});
                  }}
                  disabled={salvando}
                  className={cls.btnPerigo}
                >
                  <Trash2 size={15} aria-hidden="true" /> Remover
                </button>
              ))
            }
          >
            {removerEndereco ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                Sua localização será removida quando você salvar as alterações.
              </p>
            ) : (
              <>
                <CamposEndereco valor={end} onChange={setEnd} erros={errosEnd} desabilitado={salvando} />
                {!endereco && !enderecoVazio(end) && (
                  <p className="mt-3 text-[12.5px] text-ink-400">Todos os campos são obrigatórios para salvar a localização.</p>
                )}
              </>
            )}
          </Secao>
        )}

        <Link
          href="/configuracoes"
          className={`${cls.card} flex items-center justify-between gap-3 px-5 py-4 text-[14px] font-medium text-ink-800 hover:border-brand-200 lg:hidden`}
        >
          <span className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-brand-600" aria-hidden="true" /> Senha e segurança
          </span>
          <ChevronRight size={17} className="text-ink-400" aria-hidden="true" />
        </Link>

        {/* ------------------------------------------------------- ações */}
        <div className="sticky bottom-24 z-30 lg:bottom-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white/95 p-3 shadow-popover backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:pl-5">
            <p className="text-[13px] text-ink-500" aria-live="polite">
              {salvando ? "Salvando suas alterações…" : temAlteracoes ? "Você tem alterações não salvas." : "Nenhuma alteração pendente."}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button type="button" onClick={cancelar} disabled={salvando} className={cls.btnContorno}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando} aria-disabled={salvando} className={cls.btnPrimario}>
                {salvando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                {salvando ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function Secao({
  id,
  titulo,
  descricao,
  acao,
  children,
}: {
  id: string;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${cls.card} scroll-mt-6 p-5 sm:p-6`} aria-labelledby={`${id}-titulo`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-titulo`} className={cls.h2}>
            {titulo}
          </h2>
          {descricao && <p className={`${cls.textoSuave} mt-0.5`}>{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

function CampoLeitura({
  id,
  rotulo,
  valor,
  placeholder,
  className = "",
}: {
  id: string;
  rotulo: string;
  valor: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={cls.label}>
        {rotulo}
      </label>
      <input id={id} value={valor} placeholder={placeholder} readOnly disabled className={cls.input} />
    </div>
  );
}
