# PitcherX — Front-end e Back-end

- `front-end/` — aplicação Next.js (porta 3000).
- `back-end/` — API Spring Boot (porta 8080, Java 25).

## Como rodar

1. Banco: em `back-end/`, `docker compose up -d` (Postgres na porta 5433, pgAdmin em http://localhost:5050).
2. Back-end: crie `back-end/.env` a partir de `back-end/.env-exemple` e rode a aplicação.
3. Front-end: em `front-end/`, `npm install` e `npm run dev`. A API padrão é `http://localhost:8080`
   (para outro endereço, defina `NEXT_PUBLIC_API_URL` em `front-end/.env.local`).
