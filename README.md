# brt-api

API do teste técnico (carrinho de compras) — TypeScript + Hono + Drizzle ORM + PostgreSQL.

Este README descreve **o que já está implementado**. Novas seções entram conforme o projeto evoluir.

## Pré-requisitos

Na máquina local:

- **Node.js 20+** (`node -v`)
- **npm** (vem com o Node)
- **Docker** e **Docker Compose** (banco Postgres)

## Subir o banco

Na raiz do projeto (`btr/`), o compose sobe o Postgres:

```bash
cd ..   # se estiver em brt-api/
docker compose up -d
```

| item | valor |
|------|--------|
| container | `brt-be-pg` |
| porta host | `5433` |
| database | `brt-be` |
| user / senha | `postgres` / `docker` |

Connection string padrão:

```
postgresql://postgres:docker@localhost:5433/brt-be
```

## Configuração

```bash
cd brt-api
cp .env.example .env   # se ainda não tiver .env
npm install
```

Variáveis em `.env`:

| variável | descrição | exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do Postgres | ver acima |
| `PORT` | porta do server local | `3001` |
| `CORS_ORIGIN` | origin liberada no CORS | `*` (local) |
| `LOG_LEVEL` | `DEBUG` \| `INFO` \| `ERROR` | `INFO` |

## Banco: schema, migration e seed

Tabelas: `produtos`, `cupons`, `carrinhos`, `itens_carrinho`.

Schema Drizzle fatiado em `src/db/schemas/*.schema.ts`, barrel em `schemas/index.ts`.

- `precoLiquido`: **integer (centavos)** — ex.: `34990` = R$ 349,90  
- `percentualDesconto`: **integer** — ex.: `10` = 10% (não é dinheiro)

Helpers: `common/utils/money.ts` (`toCents` / `fromCents`) para a borda da API.

Seed a partir de `data/produtos.json` e `data/cupons.json` (10 produtos; cupons `10OFF` e `15OFF`).

```bash
npm run db:generate   # gera SQL a partir do schema Drizzle
npm run db:migrate    # aplica migrations
npm run db:seed       # insere produtos e cupons (idempotente no id)
```

Atalho (generate + migrate + seed):

```bash
npm run db:setup
```

## Rodar a API (local)

O app HTTP é **Hono** (`src/app.ts`). Localmente sobe com `@hono/node-server` — o mesmo `createApp()` usado na Lambda.

```bash
npm run dev
```

Sem watch: `npm run dev:once`.

### Rotas atuais

| método | path | descrição |
|--------|------|-----------|
| `GET` | `/health` | health + ping no Postgres |

```bash
curl http://localhost:3001/health
```

`/health` com DB ok:

```json
{ "ok": true, "service": "brt-api", "database": "up", "port": 3001 }
```

## Build Lambda (webpack)

Mesmo padrão do lambda Silaba: **um arquivo** `dist/index.js` (CommonJS), entry `src/index.ts` → `export const handler`.

```bash
npm run build        # production
npm run build:dev    # com source-map
```

### Testar o bundle com SAM (local invoke)

Requer Docker + SAM CLI. O Postgres precisa estar no ar (`docker compose up -d` na raiz). O invoke entra na rede `btr_default` e usa `env.sam.json` (`brt-be-pg:5432`).

```bash
npm run build
npm run sam:invoke:health     # GET /health
npm run sam:invoke:produtos   # GET /produtos?page=1&perPage=2
```

- Local (`src/local/server.ts`) **não** é entry do webpack.
- App Hono fino (CORS + `Router`); domínios em `src/routes/`.

## Estrutura atual

```
brt-api/
├── data/
├── drizzle.config.ts
├── webpack.config.js
├── src/
│   ├── index.ts              # entry Lambda (handler export)
│   ├── app.ts                # CORS + app.route('/', Router)
│   ├── routes/               # paths primários → handlers
│   │   ├── index.ts
│   │   └── health.ts
│   ├── handlers/             # controllers de rota (nome “handler” = Lambda)
│   │   └── health.handler.ts
│   ├── models/
│   │   └── api-response.ts
│   ├── common/utils/         # logger, parseBody, sendSuccess, sendError
│   │   ├── logger.ts
│   │   ├── parse-body.ts
│   │   ├── response.ts
│   │   └── error-response.ts
│   ├── config/env.ts
│   ├── db/
│   ├── local/server.ts
│   └── scripts/
└── package.json
```

Convenção: **`handlers/`** = controllers HTTP de domínio. Utilitários cross-cutting ficam em **`common/utils/`** (não misturar com handler de rota).

Envelope de resposta (sucesso e erro):

```json
{ "statusCode": 200, "message": "OK", "data": {} }
```

## Decisões até aqui

- Valores monetários: **centavos `integer`** no banco e no domínio; `fromCents` na serialização da API se precisar exibir reais.
- HTTP: **Hono** — `app` só pluga o `Router`; paths primários em `routes/index.ts`.
- Respostas via `sendSuccess` / `sendError`; body tipado com `ApiResponse<T>`.
- Local = `@hono/node-server`; prod = `hono/aws-lambda`.
- Webpack: bundle único para Lambda (`pg-native` ignorado).
- Sem auth; CORS via `CORS_ORIGIN`.
- **Estoque no checkout:** o `POST /carrinhos/:id/checkout` **não** decrementa `quantidadeEstoque` dos produtos. O desafio pede finalizar o carrinho (`ABERTO` → `FINALIZADO`) e validar estoque nas mutações de itens; **não** pede baixa de inventário na finalização. Por isso o checkout só altera o status — evita escopo extra (transaction, concorrência, inventário) fora do enunciado. Estoque continua sendo teto nas adições/atualizações de qty (`INSUFFICIENT_STOCK`).
- **Lint/format:** ESLint 9 (flat) + Prettier — regras adaptadas de `prototipo/` (singleQuote, printWidth 120, `import/no-default-export`, etc.). Scripts: `npm run lint` / `npm run format`.

## Pendências (próximas entregas)

Deploy API Gateway / Lambda e front (`brt-web`), se forem parte da entrega.
