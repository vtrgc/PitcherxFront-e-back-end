# PitcherX — Front-end

Interface web do PitcherX (Next.js 16 / React 19 / TypeScript / Tailwind CSS 3), que consome a API REST do
**PitcherX-BackEnd** (Spring Boot, autenticação JWT).

## Requisitos

- Node.js 20.9 ou superior (testado com Node 22)
- npm 10+
- PitcherX-BackEnd em execução (padrão: `http://localhost:8080`)

## 1. Instalar dependências

```bash
npm ci
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL base do backend, sem barra final. É embutida no build: gere o build de novo ao alterá-la. |

## 3. Executar

```bash
npm run dev          # desenvolvimento em http://localhost:3000
npm run build        # build de produção
npm run start        # serve o build (porta 3000)
```

## 4. Conectar ao backend original

O backend libera CORS apenas para a origem definida na variável `FRONTEND_URL_1` do `.env` dele
(`cors.originPatterns`). Para rodar o front em `http://localhost:3000`, o `.env` do backend deve conter:

```
FRONTEND_URL_1=http://localhost:3000
```

Outros pontos do backend que afetam o front:

- **Uploads de foto** (`POST /usuario/{id}/foto`): configure `UPLOAD_DIR`, `UPLOAD_BASE_PATH` e `UPLOAD_BASE_URL`.
  Se `UPLOAD_BASE_URL` for relativo (ex.: `/uploads`), o front prefixa a URL da API automaticamente.
- **Recuperação de senha**: exige as variáveis `MAIL_*` do backend (o código é enviado por e-mail).
- **Usuário administrador inicial**: `adm@gmail.com` / `adm1234567` (criado pelo `DataInitializer` do backend).
- Os IDs de roles, tipos de vínculo e tipos de conteúdo usados pelo front (`ROLE_ID_MAP`, `TIPO_VINCULO_ID`,
  `TIPO_CONTEUDO`) seguem a ordem em que o `DataInitializer` os cria em um banco vazio.

## 5. Verificações e testes

```bash
npm run typecheck    # TypeScript (modo strict)
npm run lint         # ESLint (eslint-config-next)
npm run test         # testes unitários (Vitest) — lib/api, datas, validações, contratos de serviços
npm run check        # tudo acima + build de produção
```

## Estrutura

```
app/
  (rotas)            páginas do App Router (feed, explorar, projetos, propostas, contratos, perfil, admin...)
  components/        componentes compartilhados (PageShell, Sidebar, MobileNav, PostCard, formulários...)
  components/ui/     base visual: estilos, Alerta, Avatar, FeedbackProvider (toasts e diálogo de confirmação)
  context/           AuthContext (sessão JWT)
  hook/              useRequireAuth, useRequireAdmin, useUsuario, useCurtida, useComentarios
  lib/               api (fetch + erros + sessão), date, image (URLs seguras), validacao
  services/          uma função por endpoint do backend
  types/             tipos espelhando os DTOs do backend
tests/               testes unitários (Vitest)
```

O relatório completo da auditoria está em `RELATORIO_TECNICO.md`; as correções de perfil estão em
`RELATORIO_PERFIL.md` e as da auditoria mais recente (limites do banco, exclusões seguras, testes E2E) em
`RELATORIO_CORRECOES.md`.
