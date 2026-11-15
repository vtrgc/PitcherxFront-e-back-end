#!/usr/bin/env python3
"""
Auditoria da API do PitcherX: fluxos reais + regras de permissão.

Uso (com backend e front rodando):
    ADMIN_EMAIL=... ADMIN_SENHA=... MAILS_LOG=/caminho/mails.log python3 e2e/api_auditoria.py

- BASE_URL (padrão http://localhost:3000/backend) passa pelo proxy do Next, como o navegador.
- MAILS_LOG (opcional): arquivo onde um SMTP de teste grava as mensagens; com ele, os fluxos que
  dependem de código por e-mail (verificar conta, redefinir senha) também são testados.
Os dados criados usam e-mails aleatórios e não apagam nada que já exista no banco.
"""
import base64, datetime, email, json, os, quopri, re, struct, sys, urllib.error, urllib.request, uuid, zlib

BASE = os.environ.get("BASE_URL", "http://localhost:3000/backend").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_SENHA = os.environ.get("ADMIN_SENHA")
MAILS_LOG = os.environ.get("MAILS_LOG")
if not ADMIN_EMAIL or not ADMIN_SENHA:
    sys.exit("Defina ADMIN_EMAIL e ADMIN_SENHA.")

resultados = []  # (secao, nome, status, detalhe)
secao_atual = ""


def secao(nome):
    global secao_atual
    secao_atual = nome
    print(f"\n== {nome}")


def chk(nome, cond, detalhe=""):
    st = "APROVADO" if cond else "REPROVADO"
    resultados.append((secao_atual, nome, st, "" if cond else str(detalhe)[:300]))
    print(("  ok   " if cond else "  FAIL ") + nome + ("" if cond else f"  -> {str(detalhe)[:300]}"))
    return cond


def nao_testado(nome, motivo):
    resultados.append((secao_atual, nome, "NÃO TESTADO", motivo))
    print(f"  --   {nome} (não testado: {motivo})")


def req(method, path, token=None, body=None, files=None, raw=False):
    headers = {"Accept": "application/json"}
    data = None
    if files:
        b = uuid.uuid4().hex
        partes = []
        for nome, (fn, conteudo, tipo) in files:
            partes.append(f'--{b}\r\nContent-Disposition: form-data; name="{nome}"; filename="{fn}"\r\nContent-Type: {tipo}\r\n\r\n'.encode() + conteudo + b"\r\n")
        data = b"".join(partes) + f"--{b}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={b}"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    r = urllib.request.Request(BASE + path if path.startswith("/") else path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            t = resp.read()
            if raw:
                return resp.status, t
            t = t.decode()
            return resp.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        t = e.read().decode(errors="ignore")
        try:
            return e.code, json.loads(t)
        except Exception:
            return e.code, t


def png():
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = zlib.compress(b"\x00\x00\x00\x00")
    chunk = lambda tipo, dados: struct.pack(">I", len(dados)) + tipo + dados + struct.pack(">I", zlib.crc32(tipo + dados))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")


MP4 = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" + b"\x00" * 64


def cpf_valido(seed):
    n = [int(c) for c in f"{seed:09d}"[-9:]]
    for _ in range(2):
        s = sum(v * (len(n) + 1 - i) for i, v in enumerate(n))
        d = 11 - s % 11
        n.append(0 if d >= 10 else d)
    return "".join(map(str, n))


def codigo_no_email(destinatario, depois_de=0):
    """Procura no log do SMTP de teste o último código de 6 dígitos enviado ao destinatário."""
    if not MAILS_LOG or not os.path.exists(MAILS_LOG):
        return None
    msgs = open(MAILS_LOG, encoding="utf-8", errors="ignore").read().split("\n=====\n")[depois_de:]
    for bruto in reversed(msgs):
        if destinatario.lower() not in bruto.lower():
            continue
        m = email.message_from_string(bruto)
        textos = []
        for parte in (m.walk() if m.is_multipart() else [m]):
            payload = parte.get_payload(decode=True)
            if payload:
                textos.append(payload.decode(errors="ignore"))
        achado = re.findall(r"(?<!\d)(\d{6})(?!\d)", " ".join(textos))
        if achado:
            return achado[-1]
    return None


def qtd_emails():
    if not MAILS_LOG or not os.path.exists(MAILS_LOG):
        return 0
    return open(MAILS_LOG, encoding="utf-8", errors="ignore").read().count("\n=====\n")


def login(email_, senha):
    s, r = req("POST", "/usuario/login", body={"emailUsuario": email_, "senhaUsuario": senha})
    return (r.get("token"), r.get("idUsuario")) if s == 200 and isinstance(r, dict) else (None, None)


sufixo = uuid.uuid4().hex[:6]
SENHA = "Segura123"
hoje = datetime.date.today()
fmt = lambda d: d.strftime("%d/%m/%Y")

# ====================================================================== autenticação
secao("Cadastro e autenticação")
adm, id_adm = login(ADMIN_EMAIL, ADMIN_SENHA)
chk("login do administrador", adm is not None)
if not adm:
    sys.exit("Sem login de administrador não há como continuar.")

s, r = req("POST", "/usuario/cadastro-usuario", body={"nomeUsuario": "", "emailUsuario": "", "senhaUsuario": ""})
chk("cadastro com campos vazios -> 400 com erros por campo", s == 400 and isinstance(r, dict) and r.get("errors"), (s, r))
usuarios = {}
for chave, nome in (("criador", "Ana Criadora"), ("investidor", "Bruno Investidor"), ("terceiro", "Caio Terceiro")):
    e = f"{chave}.{sufixo}@teste.com"
    s, r = req("POST", "/usuario/cadastro-usuario", body={"nomeUsuario": nome, "emailUsuario": e, "senhaUsuario": SENHA, "telefoneUsuario": "11988887777"})
    chk(f"cadastro válido ({nome}) -> 201, conta inativa", s == 201 and r.get("active") is False, (s, r))
    usuarios[chave] = {"email": e, "id": r.get("idUsuario"), "nome": nome}
s, r = req("POST", "/usuario/cadastro-usuario", body={"nomeUsuario": "X", "emailUsuario": usuarios["criador"]["email"], "senhaUsuario": SENHA})
chk("e-mail duplicado -> 400", s == 400 and "email" in str(r).lower(), (s, r))
s, r = req("POST", "/usuario/login", body={"emailUsuario": usuarios["criador"]["email"], "senhaUsuario": SENHA})
chk("login antes da aprovação -> 400 'não foi ativada'", s == 400 and "ativad" in str(r), (s, r))

s, r = req("POST", f"/usuario/{usuarios['criador']['id']}/comprovante-identidade", adm, files=[("arquivo", ("doc.png", png(), "image/png"))])
chk("admin anexa comprovante", s == 200 and r.get("urlComprovanteIdentidade"), (s, r))
s, r = req("POST", f"/usuario/admin/analise-identidade/{usuarios['terceiro']['id']}", adm, {"status": "REPROVADA"})
chk("reprovar sem justificativa -> 400", s == 400, (s, r))
s, r = req("POST", f"/usuario/admin/analise-identidade/{usuarios['terceiro']['id']}", adm, {"status": "REPROVADA", "justificativa": "Documento ilegível"})
chk("reprovar com justificativa -> 200 (antes 500: template de e-mail inexistente)", s == 200 and r.get("statusAnaliseIdentidade") == "REPROVADA", (s, r))
for u in usuarios.values():
    s, r = req("POST", f"/usuario/admin/analise-identidade/{u['id']}", adm, {"status": "APROVADA"})
    if u is usuarios["terceiro"]:
        chk("identidade já analisada não pode ser reanalisada -> 400", s == 400, (s, r))
        s, r = req("POST", f"/usuario/{u['id']}/comprovante-identidade", adm, files=[("arquivo", ("doc.png", png(), "image/png"))])
        s, r = req("POST", f"/usuario/admin/analise-identidade/{u['id']}", adm, {"status": "APROVADA"})
    chk(f"aprovar identidade de {u['nome']} -> 200 e conta ativa (antes 500)", s == 200 and r.get("active") is True and r.get("statusAnaliseIdentidade") == "APROVADA", (s, r))

for u in usuarios.values():
    u["token"], _ = login(u["email"], SENHA)
chk("login após aprovação", all(u["token"] for u in usuarios.values()))
s, r = req("POST", "/usuario/login", body={"emailUsuario": usuarios["criador"]["email"], "senhaUsuario": "errada123"})
chk("senha incorreta -> 400", s == 400, (s, r))
s, r = req("GET", "/projeto", "token.invalido.aqui")
chk("token inválido -> 403", s == 403, s)
s, r = req("GET", "/projeto")
chk("sem token -> 403", s == 403, s)

A, B, C = usuarios["criador"], usuarios["investidor"], usuarios["terceiro"]
codigo = codigo_no_email(A["email"])
if codigo:
    s, r = req("POST", "/usuario/verificar-conta", A["token"], {"codigoVerificacao": codigo})
    chk("verificar conta com o código do e-mail -> 200", s == 200, (s, r))
    s, r = req("POST", "/usuario/verificar-conta", A["token"], {"codigoVerificacao": codigo})
    chk("reusar o código -> 400", s == 400, (s, r))
else:
    nao_testado("verificar conta pelo código", "sem log de e-mails (MAILS_LOG)")

n0 = qtd_emails()
s, r = req("POST", "/usuario/esqueci-senha", body={"usuarioEmail": f"naoexiste.{sufixo}@teste.com"})
chk("esqueci-senha com e-mail sem conta -> 204 (antes 500 e revelava contas)", s == 204, (s, r))
s, r = req("POST", "/usuario/esqueci-senha", body={"usuarioEmail": C["email"]})
chk("esqueci-senha -> 204", s == 204, (s, r))
codigo = codigo_no_email(C["email"], n0)
if codigo:
    errado = "000000" if codigo != "000000" else "111111"
    s, r = req("POST", "/usuario/validar-token", body={"emailUsuario": C["email"], "codigoRedefinicao": errado})
    chk("validar código errado -> 400 (antes sempre 204)", s == 400, (s, r))
    s, r = req("POST", "/usuario/validar-token", body={"emailUsuario": C["email"], "codigoRedefinicao": codigo})
    chk("validar código correto -> 204", s == 204, (s, r))
    s, r = req("POST", "/usuario/resetar-senha", body={"emailUsuario": C["email"], "codigoRedefinicao": codigo, "novaSenha": "Nova12345"})
    chk("redefinir senha com o código -> 204", s == 204, (s, r))
    C["token"], _ = login(C["email"], "Nova12345")
    chk("login com a nova senha", C["token"] is not None)
    s, r = req("POST", "/usuario/resetar-senha", body={"emailUsuario": C["email"], "codigoRedefinicao": codigo, "novaSenha": "Outra12345"})
    chk("código já usado -> 400", s == 400, (s, r))
    senha_c = "Nova12345"
else:
    nao_testado("redefinição de senha por e-mail", "sem log de e-mails (MAILS_LOG)")
    senha_c = SENHA
s, r = req("PUT", f"/usuario/redefinir-senha/{C['id']}", C["token"], {"senhaAtual": "errada", "novaSenha": "Troca12345"})
chk("trocar senha com a atual errada -> 400", s == 400, (s, r))
s, r = req("PUT", f"/usuario/redefinir-senha/{C['id']}", C["token"], {"senhaAtual": senha_c, "novaSenha": "Troca12345"})
chk("trocar senha -> 200 e login com a nova", s == 200 and login(C["email"], "Troca12345")[0] is not None, (s, r))
senha_c = "Troca12345"
s, r = req("PUT", f"/usuario/redefinir-senha/{A['id']}", C["token"], {"senhaAtual": "x", "novaSenha": "y12345"})
chk("trocar senha de outra pessoa -> 403", s == 403, (s, r))

# ====================================================================== usuário e perfil
secao("Usuário e perfil")
s, r = req("GET", f"/usuario/{A['id']}", B["token"])
chk("GET /usuario/{id} -> 200 (antes 500: faltava @PathVariable)", s == 200 and r.get("idUsuario") == A["id"], (s, r))
chk("dados pessoais de terceiros ocultos (telefone/comprovante)", r.get("telefoneUsuario") is None and r.get("urlComprovanteIdentidade") is None, r)
s, r = req("GET", f"/usuario/{A['id']}", A["token"])
chk("o próprio usuário vê o telefone", r.get("telefoneUsuario") == "11988887777", r)
s, r = req("PUT", f"/usuario/{A['id']}", A["token"], {"nomeUsuario": "Ana C. Criadora", "emailUsuario": A["email"], "senhaUsuario": "errada", "telefoneUsuario": "11977776666"})
chk("editar dados com senha de confirmação errada -> 400 (antes trocava a senha)", s == 400, (s, r))
s, r = req("PUT", f"/usuario/{A['id']}", A["token"], {"nomeUsuario": "Ana C. Criadora", "emailUsuario": A["email"], "senhaUsuario": SENHA, "telefoneUsuario": "11977776666"})
chk("editar nome e telefone -> 200", s == 200 and r.get("nomeUsuario") == "Ana C. Criadora", (s, r))
chk("login continua funcionando após editar (antes a senha virava texto puro)", login(A["email"], SENHA)[0] is not None)
s, r = req("PUT", f"/usuario/{A['id']}", B["token"], {"nomeUsuario": "Hack", "emailUsuario": A["email"], "senhaUsuario": SENHA})
chk("editar dados de outra pessoa -> 403", s == 403, (s, r))
s, r = req("POST", f"/usuario/{A['id']}/foto", A["token"], files=[("arquivo", ("f.png", png(), "image/png"))])
chk("enviar foto -> 200", s == 200 and r.get("urlImagemUsuario"), (s, r))
foto = r.get("urlImagemUsuario") if isinstance(r, dict) else None
s, r = req("PUT", f"/usuario/{A['id']}", A["token"], {"nomeUsuario": "Ana Criadora", "emailUsuario": A["email"], "senhaUsuario": SENHA})
chk("editar dados não apaga a foto", s == 200 and r.get("urlImagemUsuario") == foto, (s, r))
s, r = req("POST", f"/usuario/{A['id']}/foto", B["token"], files=[("arquivo", ("f.png", png(), "image/png"))])
chk("trocar a foto de outra pessoa -> 403", s == 403, (s, r))

s, esp = req("GET", "/especialidade", A["token"])
chk("especialidades semeadas pelas migrations", s == 200 and len(esp) > 0, (s, esp))
id_esp = esp[0]["idEspecialidade"]
s, r = req("POST", "/perfil-usuario", B["token"], {"linkedin": "https://linkedin.com/in/x", "identificador": cpf_valido(1234), "idEspecialidade": id_esp, "idUsuario": A["id"]})
chk("criar perfil em nome de outra pessoa -> 403", s == 403, (s, r))
perfis = {}
for i, u in enumerate((A, B, C)):
    s, r = req("POST", "/perfil-usuario", u["token"], {"linkedin": f"https://linkedin.com/in/u{i}{sufixo}", "identificador": cpf_valido(int(sufixo, 16) % 10**8 + i), "idEspecialidade": id_esp, "idUsuario": u["id"]})
    chk(f"criar o próprio perfil profissional ({u['nome']})", s == 201, (s, r))
    perfis[u["id"]] = r.get("idPerfilUsuario") if isinstance(r, dict) else None
pa = perfis[A["id"]]
s, r = req("POST", f"/perfil-usuario/{pa}/banner", A["token"], files=[("arquivo", ("b.png", png(), "image/png"))])
chk("enviar capa (banner) -> 200", s == 200 and r.get("urlBanner"), (s, r))
s, r = req("POST", f"/perfil-usuario/{pa}/video", A["token"], files=[("arquivo", ("v.mp4", MP4, "video/mp4"))])
chk("enviar vídeo de apresentação -> 200", s == 200 and r.get("urlVideoPerfil"), (s, r))
s, r = req("PUT", f"/perfil-usuario/{pa}", A["token"], {"linkedin": "https://linkedin.com/in/ana2", "identificador": cpf_valido(int(sufixo, 16) % 10**8), "idEspecialidade": id_esp, "idUsuario": A["id"]})
chk("editar perfil sem reenviar capa/vídeo não os apaga", s == 200 and r.get("urlBanner") and r.get("urlVideoPerfil"), (s, r))
s, r = req("PUT", f"/perfil-usuario/{pa}", B["token"], {"linkedin": "x", "identificador": "1", "idEspecialidade": id_esp, "idUsuario": A["id"]})
chk("editar perfil de outra pessoa -> 403", s == 403, (s, r))
s, r = req("PUT", f"/perfil-usuario/{pa}", A["token"], {"linkedin": "x", "identificador": cpf_valido(1), "idEspecialidade": id_esp, "idUsuario": B["id"]})
chk("transferir o perfil para outro usuário -> 400", s == 400, (s, r))
s, r = req("POST", f"/perfil-usuario/{pa}/banner", B["token"], files=[("arquivo", ("b.png", png(), "image/png"))])
chk("trocar capa de outra pessoa -> 403", s == 403, (s, r))

s, end = req("POST", "/endereco", A["token"], {"cep": "01001000", "uf": "SP", "bairro": "Sé", "logradouro": "Praça da Sé", "complemento": "Sala 1", "numeroCasa": 100, "usuarioId": A["id"]})
chk("cadastrar o próprio endereço -> 201", s == 201, (s, end))
s, r = req("POST", "/endereco", B["token"], {"cep": "01001000", "uf": "SP", "bairro": "x", "logradouro": "x", "complemento": "x", "numeroCasa": 1, "usuarioId": A["id"]})
chk("cadastrar endereço para outra pessoa -> 403", s == 403, (s, r))
s, r = req("GET", f"/endereco/{end['idEndereco']}", B["token"])
chk("endereço de terceiros mostra só a UF (antes expunha o endereço completo)", s == 200 and r.get("uf") == "SP" and r.get("logradouro") is None, (s, r))
s, r = req("GET", f"/endereco/{end['idEndereco']}", A["token"])
chk("o dono vê o endereço completo", r.get("logradouro") == "Praça da Sé", r)
s, r = req("PUT", f"/endereco/{end['idEndereco']}", B["token"], {"cep": "01001000", "uf": "RJ", "bairro": "x", "logradouro": "x", "complemento": "x", "numeroCasa": 1, "usuarioId": B["id"]})
chk("alterar endereço de outra pessoa -> 403", s == 403, (s, r))

s, r = req("GET", "/nivel-conta", A["token"])
chk("catálogo de níveis de conta (6)", s == 200 and len(r) == 6, (s, r))
s, r = req("PUT", f"/usuario/admin/nivel-conta/{B['id']}", adm, {"nivelId": 2})
chk("admin altera nível -> 200", s == 200 and r["nivelConta"]["nome"] == "EXPLORADOR", (s, r))
s, r = req("PUT", f"/usuario/admin/nivel-conta/{B['id']}", A["token"], {"nivelId": 6})
chk("usuário comum alterando nível -> 403", s == 403, (s, r))

# ====================================================================== catálogos (admin)
secao("Catálogos e administração")
cat = [("/area", {"nomeArea": f"Área {sufixo}", "descricaoArea": "d"}, "idArea"),
       ("/especialidade", {"nomeEspecialidade": f"Esp {sufixo}"}, "idEspecialidade"),
       ("/tipo-projeto", {"nomeTipoProjeto": f"Tipo {sufixo}", "descricaoTipoProjeto": "d"}, "idTipoProjeto"),
       ("/risco-projeto", {"nomeRisco": f"Risco {sufixo}", "descricaoRisco": "d"}, "idRiscoProjeto"),
       ("/termo-postagem", {"tituloTermoPostagem": f"Termo {sufixo}", "descricaoTermoPostagem": "d"}, "idTermoPostagem")]
ids_cat = {}
for path, corpo, campo in cat:
    s, r = req("POST", path, A["token"], corpo)
    chk(f"usuário comum criando em {path} -> 403", s == 403, (s, r))
    s, r = req("POST", path, adm, corpo)
    ok = chk(f"admin cria em {path}", s in (200, 201) and isinstance(r, dict) and r.get(campo), (s, r))
    if ok:
        ids_cat[path] = r[campo]
        s2, r2 = req("PUT", f"{path}/{r[campo]}", adm, {k: (v + " (ed)" if isinstance(v, str) else v) for k, v in corpo.items()})
        chk(f"admin edita em {path}", s2 == 200, (s2, r2))
        s2, r2 = req("GET", f"{path}/{r[campo]}", A["token"])
        chk(f"leitura em {path}/{{id}}", s2 == 200, (s2, r2))
s, r = req("POST", "/subarea", adm, {"nomeSubArea": f"Sub {sufixo}", "descricaoSubArea": "d", "idArea": ids_cat.get("/area")})
chk("admin cria subárea vinculada à área", s in (200, 201), (s, r))
if s in (200, 201):
    s, r2 = req("DELETE", f"/subarea/{r['idSubArea']}", adm)
    chk("admin exclui subárea", s == 204, (s, r2))
for path in ("/area", "/especialidade", "/termo-postagem"):
    if path in ids_cat:
        s, r = req("DELETE", f"{path}/{ids_cat[path]}", adm)
        chk(f"admin exclui em {path}", s == 204, (s, r))
s, r = req("GET", "/usuario/admin/identidade-pendentes?page=0&size=5", A["token"])
chk("usuário comum na fila de identidades -> 403", s == 403, s)
s, r = req("GET", "/denuncia/admin/pending", B["token"])
chk("usuário comum nas denúncias pendentes -> 403", s == 403, s)
s, r = req("POST", f"/usuario/alterar-role/{C['id']}/1", B["token"])
chk("usuário comum se tornando admin -> 403", s == 403, s)
s, r = req("GET", "/usuario", A["token"])
chk("listagem completa de usuários é exclusiva do admin -> 403", s == 403, (s,))
s, r = req("GET", "/usuario", adm)
chk("admin lista usuários com todos os dados", s == 200 and any(u.get("telefoneUsuario") for u in r), (s,))

# ====================================================================== projetos
secao("Projetos")
s, tipos = req("GET", "/tipo-projeto", A["token"])
s, riscos = req("GET", "/risco-projeto", A["token"])
corpo_proj = lambda nome, **extra: {"nomeProjeto": nome, "descricaoProjeto": "Placas solares em escolas", "dataInicioProjeto": fmt(hoje),
                                    "dataFimProjeto": fmt(hoje + datetime.timedelta(days=200)), "tipoProjetoId": tipos[0]["idTipoProjeto"],
                                    "metaFinanceira": 100000, "investimentoMinimo": 1000, "participacaoOferecida": 10, "usoRecursos": "Equipamentos",
                                    "riscoProjetoIds": [riscos[0]["idRiscoProjeto"]] if riscos else [], **extra}
s, r = req("POST", f"/projeto/{A['id']}", A["token"], {**corpo_proj("x"), "metaFinanceira": None, "dataInicioProjeto": "01/01/2020"})
chk("projeto inválido (sem meta, início no passado) -> 400 com erros", s == 400 and isinstance(r, dict) and r.get("errors"), (s, r))
s, r = req("POST", f"/projeto/{A['id']}", B["token"], corpo_proj("Projeto falso"))
chk("publicar projeto em nome de outra pessoa -> 403", s == 403, (s, r))
s, proj = req("POST", f"/projeto/{A['id']}", A["token"], corpo_proj(f"Energia Solar {sufixo}"))
chk("criar projeto -> 201", s == 201 and proj.get("participacaoOferecida") == 10, (s, proj))
pid = proj["idProjeto"]
s, r = req("GET", f"/projeto/{pid}", A["token"])
chk("GET /projeto/{id} pelo criador -> 200 (antes 400: expressão de segurança inválida)", s == 200, (s, r))
s, r = req("GET", f"/projeto/{pid}", C["token"])
chk("GET /projeto/{id} sem aceitar os termos -> 403", s == 403, (s, r))
s, r = req("GET", f"/projeto/{pid}", adm)
chk("GET /projeto/{id} pelo admin -> 200", s == 200, (s, r))
s, r = req("GET", f"/projeto/buscar?nome=Energia", A["token"])
chk("busca de projetos por nome", s == 200 and any(p["idProjeto"] == pid for p in r), s)
s, r = req("PUT", f"/projeto/{pid}", B["token"], corpo_proj("Sequestrado"))
chk("editar projeto de outra pessoa -> 403 (antes era permitido)", s == 403, (s, r))
s, r = req("PUT", f"/projeto/{pid}", A["token"], corpo_proj(f"Energia Solar {sufixo} (editado)"))
chk("editar o próprio projeto", s == 200 and r["nomeProjeto"].endswith("(editado)"), (s, r))
s, r = req("PATCH", f"/projeto/{pid}/valor-arrecadado", B["token"], 999999)
chk("alterar valor arrecadado de outro projeto -> 403", s == 403, (s, r))
s, r = req("PATCH", f"/projeto/{pid}/meta-financeira", A["token"], 150000)
chk("alterar a própria meta", s == 200 and r == 150000, (s, r))
s, r = req("PATCH", f"/projeto/{pid}/meta-financeira", A["token"], -5)
chk("meta negativa -> 400", s == 400, (s, r))
s, r = req("PUT", f"/projeto/{pid}/imagens", A["token"], files=[("arquivos", ("a.png", png(), "image/png"))])
chk("enviar imagem do projeto", s == 200 and len(r.get("imagens") or []) == 1, (s, r))
s, r = req("PUT", f"/projeto/{pid}/videos", A["token"], files=[("arquivos", ("v.mp4", MP4, "video/mp4"))])
chk("enviar vídeo do projeto", s == 200 and len(r.get("videos") or []) == 1, (s, r))
s, r = req("PUT", f"/projeto/{pid}/imagens", A["token"], files=[("arquivos", ("a.txt", b"texto", "text/plain"))])
chk("arquivo que não é imagem -> 400", s == 400, (s, r))
s, r = req("PUT", f"/projeto/{pid}/imagens", C["token"], files=[("arquivos", ("a.png", png(), "image/png"))])
chk("alterar imagens de projeto sem vínculo -> 403", s == 403, (s, r))

s, t1 = req("POST", f"/termo-vinculo/projeto/{pid}", A["token"], {"tituloTermoVinculo": "Confidencialidade", "descricaoTermoVinculo": "Não divulgar", "obrigatorio": True})
chk("criador cadastra termo de vínculo", s == 201, (s, t1))
s, r = req("POST", f"/termo-vinculo/projeto/{pid}", B["token"], {"tituloTermoVinculo": "Falso", "descricaoTermoVinculo": "x"})
chk("termo de vínculo em projeto alheio -> 403 (antes era permitido)", s == 403, (s, r))
s, proj2 = req("POST", f"/projeto/{B['id']}", B["token"], corpo_proj(f"Projeto do Bruno {sufixo}"))
s, r = req("POST", f"/termo-vinculo/projeto/{proj2['idProjeto']}", B["token"], {"tituloTermoVinculo": "Confidencialidade", "descricaoTermoVinculo": "y"})
chk("mesmo título de termo em outro projeto -> 201 (antes 500: título único global)", s == 201, (s, r))
s, r = req("POST", f"/termo-vinculo/projeto/{pid}/aceitar?termoIds={t1['idTermoVinculo']}", C["token"])
chk("aceitar os termos libera o acesso", s == 201 and req("GET", f"/projeto/{pid}", C["token"])[0] == 200, (s, r))
s1, _ = req("POST", f"/projeto/{pid}/visualizar", C["token"])
s2, _ = req("POST", f"/projeto/{pid}/visualizar", C["token"])
chk("visualizar duas vezes -> 200 nas duas (antes a 2ª dava 500)", s1 == 200 and s2 == 200, (s1, s2))
s, r = req("POST", f"/projeto/{pid}/seguir", A["token"])
chk("seguir o próprio projeto -> 400", s == 400, (s, r))
s, r = req("POST", f"/projeto/{pid}/seguir", C["token"])
chk("seguir projeto", s == 200, (s, r))
s, r = req("GET", f"/projeto/usuario/{A['id']}", B["token"])
chk("projetos de um usuário", s == 200 and any(p["idProjeto"] == pid for p in r), s)
s, r = req("GET", f"/recomendacoes/projetos/{C['id']}", C["token"])
chk("recomendações -> 200", s == 200 and isinstance(r, list), (s, r))
s, sv = req("POST", f"/solicitacao-vinculo/projeto/{pid}", C["token"], {"tipoVinculoDesejadoId": 3})
chk("pedir participação como investidor", s in (200, 201), (s, sv))
s, r = req("PUT", f"/solicitacao-vinculo/{sv.get('idSolicitacaoVinculo')}/aprovar?usuarioIdCriador={A['id']}", B["token"])
chk("aprovar solicitação fingindo ser o criador -> recusado (antes era aceito)", s in (400, 403), (s, r))
s, r = req("PUT", f"/solicitacao-vinculo/{sv.get('idSolicitacaoVinculo')}/aprovar", A["token"])
chk("criador aprova a solicitação", s == 200, (s, r))
s, desc = req("POST", f"/projeto/{A['id']}", A["token"], corpo_proj(f"Descartável {sufixo}"))
s, r = req("DELETE", f"/projeto/{desc['idProjeto']}", B["token"])
chk("excluir projeto de outra pessoa -> 403 (antes era permitido)", s == 403, (s, r))
s, r = req("DELETE", f"/projeto/{desc['idProjeto']}", A["token"])
chk("excluir o próprio projeto -> 204", s == 204, (s, r))

# ====================================================================== propostas e contrapropostas
secao("Propostas e contrapropostas")
s, r = req("POST", "/proposta", A["token"], {"descricaoProposta": "minha", "valorProposta": 10, "projetoId": pid})
chk("proposta para o próprio projeto -> 400", s == 400, (s, r))
s, r = req("POST", "/proposta", B["token"], {"descricaoProposta": "sem projeto", "valorProposta": 10})
chk("proposta sem projeto -> 400 (antes 500)", s == 400, (s, r))
s, p1 = req("POST", "/proposta", B["token"], {"descricaoProposta": "Aporte de 20 mil", "valorProposta": 20000, "projetoId": pid})
chk("enviar proposta -> 201 com id, projeto e autor (antes id/projeto nulos)", s == 201 and p1.get("idProposta") and p1.get("projetoId") == pid and p1.get("usuarioId") == B["id"], (s, p1))
prid = p1.get("idProposta")
s, r = req("POST", "/proposta", B["token"], {"descricaoProposta": "outra", "valorProposta": 1, "projetoId": pid})
chk("segunda proposta em aberto no mesmo projeto -> 400", s == 400, (s, r))
s, r = req("GET", f"/proposta/projeto/{pid}", A["token"])
chk("criador vê as propostas do projeto com autor", s == 200 and any(x["idProposta"] == prid and x.get("usuarioNome") == B["nome"] for x in r), (s, r))
s, r = req("PUT", f"/proposta/aceitar/{prid}", B["token"])
chk("autor tentando aceitar a própria proposta -> 400", s == 400, (s, r))
s, c1 = req("POST", "/contra-proposta", A["token"], {"descricaoContraProposta": "Topo 25 mil", "valorContraProposta": 25000, "idProposta": prid})
chk("criador envia contraproposta", s == 201 and c1.get("status") == "PENDENTE", (s, c1))
s, r = req("POST", "/contra-proposta", A["token"], {"descricaoContraProposta": "outra", "valorContraProposta": 1, "idProposta": prid})
chk("segunda contraproposta pendente -> 400 (antes era aceita)", s == 400, (s, r))
s, r = req("POST", "/contra-proposta", B["token"], {"descricaoContraProposta": "x", "idProposta": prid})
chk("contraproposta de quem não é o criador -> 400", s == 400, (s, r))
s, r = req("PUT", f"/proposta/aceitar/{prid}", A["token"])
chk("aceitar proposta com contraproposta pendente -> 400 (antes era aceito)", s == 400, (s, r))
s, r = req("PUT", f"/proposta/{prid}", B["token"], {"descricaoProposta": "edit", "valorProposta": 1, "projetoId": pid})
chk("editar proposta com contraproposta pendente -> 400", s == 400, (s, r))
s, r = req("PUT", f"/contra-proposta/{c1['idContraProposta']}/rejeitar", B["token"], {"status": "REJEITADA"})
chk("rejeitar sem justificativa -> 400", s == 400, (s, r))
s, r = req("PUT", f"/contra-proposta/{c1['idContraProposta']}/rejeitar", C["token"], {"status": "REJEITADA", "justificativa": "x"})
chk("terceiro decidindo contraproposta -> 400", s == 400, (s, r))
s, r = req("PUT", f"/contra-proposta/{c1['idContraProposta']}/rejeitar", B["token"], {"status": "REJEITADA", "justificativa": "Prefiro 20 mil"})
chk("autor rejeita com justificativa (agora salva na contraproposta)", s == 200 and r.get("status") == "REJEITADA" and r.get("justificativaDecisao") == "Prefiro 20 mil", (s, r))
s, c2 = req("POST", "/contra-proposta", A["token"], {"descricaoContraProposta": "Fechamos em 22 mil", "valorContraProposta": 22000, "idProposta": prid})
chk("nova contraproposta após a rejeição", s == 201, (s, c2))
s, r = req("PUT", f"/contra-proposta/{c2['idContraProposta']}", A["token"], {"descricaoContraProposta": "Fechamos em 22 mil (ajuste)", "valorContraProposta": 22000, "idProposta": prid})
chk("criador edita contraproposta pendente", s == 200, (s, r))
s, r = req("PUT", f"/contra-proposta/{c2['idContraProposta']}/aceitar", B["token"], {"status": "ACEITA"})
chk("autor aceita a contraproposta", s == 200 and r.get("status") == "ACEITA", (s, r))
s, r = req("GET", f"/proposta/{prid}", B["token"])
chk("valor da proposta passa a ser o acordado (22 mil)", s == 200 and r.get("valorProposta") == 22000, (s, r))
s, r = req("GET", "/contra-proposta/me/recebidas", B["token"])
chk("contrapropostas recebidas pelo autor", s == 200 and len([x for x in r if x["propostaId"] == prid]) == 2, (s, r))
s, r = req("GET", "/contra-proposta/me/criadas", A["token"])
chk("contrapropostas criadas pelo criador", s == 200 and len([x for x in r if x["propostaId"] == prid]) == 2, (s,))

agora = datetime.datetime.now().replace(microsecond=0)
contrato = lambda prop, proj, ini=agora, fim=agora + datetime.timedelta(days=30): {
    "tituloContrato": "Aporte", "descricaoContrato": "Aporte acordado", "dataInicioContrato": ini.isoformat(),
    "dataFimContrato": fim.isoformat(), "projetoId": proj, "propostaId": prop}
s, r = req("POST", "/contrato", B["token"], contrato(prid, pid))
chk("contrato criado por quem não é o criador -> 403", s == 403, (s, r))
s, r = req("POST", "/contrato", A["token"], contrato(prid, pid, agora, agora - datetime.timedelta(days=1)))
chk("contrato com término antes do início -> 400", s == 400, (s, r))
s, r = req("POST", "/contrato", A["token"], contrato(prid, proj2["idProjeto"]))
chk("contrato com proposta de outro projeto -> 403/400", s in (400, 403), (s, r))
s, ct = req("POST", "/contrato", A["token"], contrato(prid, pid))
chk("criador formaliza contrato (PENDENTE, com propostaId)", s == 201 and ct.get("statusContrato") == "PENDENTE" and ct.get("propostaId") == prid, (s, ct))
s, r = req("POST", "/contrato", A["token"], contrato(prid, pid))
chk("segundo contrato pendente para a mesma proposta -> 400", s == 400, (s, r))
s, r = req("GET", f"/contrato/{ct['idContrato']}", C["token"])
chk("investidor do projeto (C) vê o contrato", s == 200, (s, r))
s, outsider_tok = None, None
s, r = req("PUT", f"/contrato/{ct['idContrato']}/aceitar", C["token"])
chk("quem não é o autor da proposta não aceita o contrato -> 403", s == 403, (s, r))
s, r = req("PUT", f"/proposta/aceitar/{prid}", A["token"])
chk("aceitar proposta com contrato pendente -> 400", s == 400, (s, r))
s, r = req("PUT", f"/contrato/{ct['idContrato']}/aceitar", B["token"])
chk("autor da proposta aceita o contrato", s == 200 and r.get("statusContrato") == "ACEITE", (s, r))
s, r = req("PUT", f"/proposta/aceitar/{prid}", A["token"])
chk("criador aceita a proposta", s == 200 and r.get("statusProposta") == "ACEITA", (s, r))
s, projetos = req("GET", "/projeto", A["token"])
arrecadado = next(p for p in projetos if p["idProjeto"] == pid)["valorArrecadado"]
chk("valor arrecadado = 22 mil (antes contava em dobro: contrato + proposta)", arrecadado == 22000, arrecadado)
s, vinc = req("GET", f"/projeto-usuario/projeto/{pid}", A["token"])
chk("autor virou SÓCIO", any(v["usuarioId"] == B["id"] and v["nomeTipoVinculo"] == "SOCIO" for v in vinc), vinc)
s, r = req("DELETE", f"/proposta/{prid}", B["token"])
chk("cancelar proposta aceita -> 400", s == 400, (s, r))
s, termo = req("POST", "/termo", adm, {"tituloTermo": "Cláusula 1", "descricaoTermo": "Prazo", "contratoId": ct["idContrato"]})
chk("admin adiciona termo ao contrato", s == 201, (s, termo))
s, r = req("GET", f"/termo/contrato/{ct['idContrato']}", A["token"])
chk("termos do contrato", s == 200 and len(r) == 1, (s, r))
s, p2 = req("POST", "/proposta", C["token"], {"descricaoProposta": "Pequeno aporte", "valorProposta": 500, "projetoId": pid})
s, r = req("PUT", f"/proposta/recusar/{p2['idProposta']}", B["token"])
chk("só o criador recusa -> 400 para outra conta", s == 400, (s, r))
s, r = req("PUT", f"/proposta/recusar/{p2['idProposta']}", A["token"])
chk("criador recusa proposta", s == 200 and r.get("statusProposta") == "RECUSADA", (s, r))
s, r = req("POST", "/contra-proposta", A["token"], {"descricaoContraProposta": "x", "idProposta": p2["idProposta"]})
chk("contraproposta em proposta já decidida -> 400", s == 400, (s, r))
s, p3 = req("POST", "/proposta", C["token"], {"descricaoProposta": "Vou cancelar", "valorProposta": 100, "projetoId": pid})
s, r = req("DELETE", f"/proposta/{p3['idProposta']}", A["token"])
chk("cancelar proposta de outra pessoa -> 400", s == 400, (s, r))
s, r = req("DELETE", f"/proposta/{p3['idProposta']}", C["token"])
chk("autor cancela a própria proposta pendente -> 204", s == 204, (s, r))

# ====================================================================== feed
secao("Publicações, curtidas e comentários")
s, r = req("POST", "/postagem", B["token"], {"tituloPostagem": "Falsa", "textoPostagem": "x", "dataPostagem": fmt(hoje), "usuarioId": A["id"]})
chk("publicar em nome de outra pessoa -> 403 (antes era permitido)", s == 403, (s, r))
s, post = req("POST", "/postagem", A["token"], {"tituloPostagem": "Novidade", "textoPostagem": "Lançamos o projeto", "dataPostagem": fmt(hoje), "usuarioId": A["id"]})
chk("publicar", s == 201, (s, post))
poid = post["idPostagem"]
s, r = req("PUT", f"/postagem/{poid}", B["token"], {"tituloPostagem": "Hack", "textoPostagem": "x", "dataPostagem": fmt(hoje), "usuarioId": B["id"]})
chk("editar publicação de outra pessoa -> 403 (antes era permitido)", s == 403, (s, r))
s, r = req("PUT", f"/postagem/{poid}", A["token"], {"tituloPostagem": "Novidade!", "textoPostagem": "Lançamos", "dataPostagem": fmt(hoje), "usuarioId": A["id"]})
chk("editar a própria publicação", s == 200 and r["tituloPostagem"] == "Novidade!", (s, r))
s, r = req("PUT", f"/postagem/{poid}/imagens", A["token"], files=[("arquivos", ("a.png", png(), "image/png"))])
chk("imagem na publicação", s == 200 and r.get("imagens"), (s, r))
s, r = req("PUT", f"/postagem/{poid}/videos", A["token"], files=[("arquivos", ("v.mp4", MP4, "video/mp4"))])
chk("vídeo na publicação", s == 200 and r.get("videos"), (s, r))
s, r = req("POST", f"/curtida/{A['id']}/1/{poid}", B["token"])
chk("curtir em nome de outra pessoa -> 403", s == 403, (s, r))
s, r = req("POST", f"/curtida/{B['id']}/1/{poid}", B["token"])
chk("curtir", s in (200, 201), (s, r))
s, r = req("GET", f"/curtida/contar-curtidas/1/{poid}", A["token"])
chk("contagem de curtidas = 1", s == 200 and r == 1, (s, r))
s, r = req("GET", f"/curtida/status/{B['id']}/1/{poid}", B["token"])
chk("status da curtida", s == 200 and isinstance(r, dict) and (r.get("curtido") or r.get("curtiu") or True), (s, r))
s, r = req("DELETE", f"/curtida/{B['id']}/1/{poid}", B["token"])
chk("descurtir", s in (200, 204), (s, r))
s, r = req("DELETE", f"/curtida/{B['id']}/1/{poid}", B["token"])
chk("descurtir de novo -> 404 (antes 500)", s == 404, (s, r))
s, r = req("POST", "/comentario", B["token"], {"textoComentario": "x", "postagemId": poid, "usuarioId": A["id"]})
chk("comentar em nome de outra pessoa -> 403", s == 403, (s, r))
s, com = req("POST", "/comentario", B["token"], {"textoComentario": "Parabéns!", "postagemId": poid, "usuarioId": B["id"]})
chk("comentar", s == 201, (s, com))
s, r = req("PUT", f"/comentario/{com['idComentario']}", A["token"], {"textoComentario": "editado por outro", "postagemId": poid, "usuarioId": A["id"]})
chk("editar comentário de outra pessoa -> 403", s == 403, (s, r))
s, r = req("PUT", f"/comentario/{com['idComentario']}", B["token"], {"textoComentario": "Parabéns, equipe!", "postagemId": poid, "usuarioId": B["id"]})
chk("editar o próprio comentário", s == 200, (s, r))
s, sub = req("POST", "/sub-comentario", A["token"], {"textoSubComentario": "Obrigada!", "comentarioId": com["idComentario"], "usuarioId": A["id"]})
chk("responder comentário", s == 201, (s, sub))
s, r = req("DELETE", f"/sub-comentario/{sub['idSubComentario']}", B["token"])
chk("excluir resposta de outra pessoa -> 403", s == 403, (s, r))
s, r = req("DELETE", f"/sub-comentario/{sub['idSubComentario']}", A["token"])
chk("excluir a própria resposta", s == 204, (s, r))
s, r = req("DELETE", f"/comentario/{com['idComentario']}", C["token"])
chk("excluir comentário de outra pessoa -> 403 (antes era permitido)", s == 403, (s, r))
s, r = req("DELETE", f"/comentario/{com['idComentario']}", adm)
chk("admin exclui comentário", s == 204, (s, r))
s, r = req("GET", "/postagem", C["token"])
chk("feed lista publicações", s == 200 and any(p["idPostagem"] == poid for p in r), s)

# ====================================================================== conexões e notificações
secao("Conexões e notificações")
s, cx = req("POST", f"/conexao/solicitar/{A['id']}", C["token"])
chk("pedir conexão", s in (200, 201), (s, cx))
s, r = req("POST", f"/conexao/solicitar/{A['id']}", C["token"])
chk("pedido duplicado -> recusado", s in (400, 409), (s, r))
s, r = req("PUT", f"/conexao/{cx['idConexao']}/aceitar", B["token"])
chk("aceitar pedido endereçado a outra pessoa -> recusado", s in (400, 403), (s, r))
s, r = req("PUT", f"/conexao/{cx['idConexao']}/aceitar", A["token"])
chk("aceitar conexão", s == 200 and r.get("status") == "ACEITO", (s, r))
s, r = req("GET", f"/conexao/contar-seguidores/{A['id']}", C["token"])
chk("contador de seguidores", s == 200 and (r.get("quantidade") or 0) >= 1, (s, r))
s, r = req("GET", f"/conexao/status/{C['id']}/{A['id']}", C["token"])
chk("status da conexão", s == 200 and r.get("isSeguidor") is True, (s, r))
s, n = req("GET", "/conexao/notificacoes?page=0&size=50", B["token"])
tipos_b = [x["tipo"] for x in (n.get("content", []) if isinstance(n, dict) else n)]
chk("notificações do autor: contraproposta recebida", "CONTRAPROPOSTA_RECEBIDA" in tipos_b, tipos_b)
s, r = req("GET", "/conexao/notificacoes/nao-lidas", B["token"])
chk("contador de não lidas", s == 200, (s, r))
s, r = req("PUT", "/conexao/notificacoes/ler-todas", B["token"])
chk("marcar todas como lidas", s in (200, 204), (s, r))
s, r = req("DELETE", f"/conexao/{cx['idConexao']}", B["token"])
chk("desfazer conexão de outras pessoas -> recusado", s in (400, 403), (s, r))
s, r = req("DELETE", f"/conexao/{cx['idConexao']}", C["token"])
chk("desfazer a própria conexão", s in (200, 204), (s, r))

# ====================================================================== denúncias
secao("Denúncias e moderação")
s, cats = req("GET", "/denuncia/categorias", B["token"])
chk("categorias de denúncia", s == 200 and len(cats) == 12, (s, cats))
s, d = req("POST", "/denuncia", B["token"], {"tipoDenuncia": "POSTAGEM", "alvoId": poid, "categoria": "SPAM", "descricao": "Propaganda"})
chk("denunciar publicação -> 201 (antes 500 em banco criado pelas migrations)", s == 201, (s, d))
s, r = req("POST", "/denuncia", B["token"], {"tipoDenuncia": "POSTAGEM", "alvoId": poid, "categoria": "SPAM"})
chk("denúncia duplicada -> 400", s == 400, (s, r))
s, r = req("POST", "/denuncia", B["token"], {"tipoDenuncia": "PERFIL", "alvoId": B["id"], "categoria": "SPAM"})
chk("denunciar o próprio perfil -> 400", s == 400, (s, r))
s, r = req("GET", f"/denuncia/admin/{d['idDenuncia']}", C["token"])
chk("ver denúncia de outra pessoa -> recusado", s in (400, 403), (s, r))
s, r = req("PUT", f"/denuncia/admin/{d['idDenuncia']}/decisao", adm, {"status": "ACEITA", "decisaoAdmin": "Confirmado", "acaoTomada": "OCULTO"})
chk("admin decide a denúncia", s == 200 and r["status"] == "ACEITA", (s, r))
s, r = req("POST", f"/denuncia/{d['idDenuncia']}/apelacao", A["token"], {"justificativa": "Não é spam"})
chk("apelação", s == 200 and r.get("apelacaoSolicitada"), (s, r))
s, r = req("PUT", f"/denuncia/admin/{d['idDenuncia']}/apelacao/decisao", adm, {"status": "REJEITADA", "decisaoAdmin": "Revisto", "acaoTomada": "NENHUMA"})
chk("admin decide a apelação", s == 200, (s, r))
s, r = req("GET", "/denuncia/me", B["token"])
chk("minhas denúncias", s == 200 and any(x["idDenuncia"] == d["idDenuncia"] for x in r), s)

# ====================================================================== conta desativada
secao("Sessão e conta desativada")
s, r = req("PUT", f"/usuario/ativar-desativar/{C['id']}", B["token"])
chk("desativar a conta de outra pessoa -> 403", s == 403, (s, r))
s, r = req("PUT", f"/usuario/ativar-desativar/{C['id']}", adm)
chk("admin desativa a conta", s == 200 and r.get("active") is False, (s, r))
s, r = req("GET", "/projeto", C["token"])
chk("token de conta desativada deixa de valer -> 403 (antes valia por 365 dias)", s == 403, s)
req("PUT", f"/usuario/ativar-desativar/{C['id']}", adm)
s, r = req("GET", "/projeto", C["token"])
chk("reativada, o mesmo token volta a valer", s == 200, s)

# ====================================================================== resumo
print("\n" + "=" * 60)
total = len(resultados)
aprov = sum(1 for r in resultados if r[2] == "APROVADO")
reprov = [r for r in resultados if r[2] == "REPROVADO"]
nt = [r for r in resultados if r[2] == "NÃO TESTADO"]
print(f"{aprov}/{total - len(nt)} verificações aprovadas · {len(reprov)} reprovadas · {len(nt)} não testadas")
for r in reprov:
    print(f"  REPROVADO [{r[0]}] {r[1]}: {r[3]}")
saida = os.environ.get("RESULTADO_JSON")
if saida:
    json.dump([dict(zip(("secao", "nome", "status", "detalhe"), r)) for r in resultados], open(saida, "w"), ensure_ascii=False, indent=1)
sys.exit(1 if reprov else 0)
