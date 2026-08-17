# brt-api

API do teste técnico (carrinho de compras) — TypeScript + Hono + Drizzle ORM + PostgreSQL.

## OpenApi docs

Documentação da api disponível em:

    #Local : http://localhost:3001/docs
    #Production: https://goaf0062ae.execute-api.sa-east-1.amazonaws.com/Prod/docs

## Pré-requisitos

Na máquina local:

- **Node.js 22+** (`node -v`)
- **npm**
- **Docker** / **docker-compose** (Postgres e, opcionalmente, a própria API)

## Docker (API + Postgres)

Na raiz do monorepo (`btr/`):

```bash
docker-compose up -d --build
```

- Imagem da API: `brt-api/Dockerfile` (`node:22-alpine`, entry `src/local/server.ts`)
- Compose: serviço `api` + `postgres`
- Entrypoint: espera o DB → migrate → seed → sobe o server
- Docs: http://localhost:3001/docs

Só o banco (API no host com `npm run dev`):

```bash
docker-compose up -d postgres
```

| item | valor |
|------|--------|
| container | `brt-be-pg` |
| porta host | `5433` |
| database | `brt-be` |
| user / senha | `postgres` / `docker` |

Connection string no host:

```
postgresql://postgres:docker@localhost:5433/brt-be
```

Dentro da rede do compose a API usa `postgres:5432` (já configurado no `docker-compose.yml`).

> Volume Postgres antigo: o script `unaccent` em `docker/init-db.sql` só roda na **primeira** criação do volume. Se o banco já existia, rode `CREATE EXTENSION IF NOT EXISTS unaccent;` manualmente (ou `docker-compose down -v` se puder apagar os dados locais).

## Configuração (dev no host)

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
| `GET` | `/docs` | Swagger UI (OpenAPI) |
| `GET` | `/openapi.json` | Spec OpenAPI 3.0 |

```bash
curl http://localhost:3001/health
# Docs interativas no browser:
# http://localhost:3001/docs
```

`/health` com DB ok:

```json
{ "ok": true, "service": "brt-api", "database": "up", "port": 3001 }
```

## Build Lambda (webpack)

- As lambdas passam por build do webpack para serem otimizadas no ambiente lambda com dependências de produção apenas.


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


## CI/CD

- Este back end conta com estratégia de ci via github actions, foi estudada a possibilidade de codeBuild + codePipeline da AWS mas por questões de simplicidade optei por uma pipeline simples.

## Estrutura

Foi escolhida uma arquitetura hexagonal enxuta (ports & adapters): a borda HTTP e o banco são detalhes; as regras ficam no centro. Algumas nomenclaturas de pasta diferem do “padrão de livro” por costume (`handlers` ≈ controllers), sem mudar o papel da camada.
Foi utilizado apenas programação funcional aqui, sem OOP.

- **Camada HTTP** (adapters de entrada)
    - `routes/`: paths Hono → handlers (+ `/docs` OpenAPI)
    - `handlers/`: comunicação com o exterior — parse de params/body, status HTTP e envelope `{ statusCode, message, data }`. Sem regra de negócio.
    - `middlewares/`: código reutilizado em rotas específicas (ex.: bloquear mutação em carrinho `FINALIZADO`)
    - `common/utils/`: utilitários da borda — `sendSuccess`, `sendDomainError`, logger, parse de body

- **Camada de aplicação / domínio**
    - `use-cases/`: orquestra cada operação (add item, cupom, checkout…) e retorna `Either<DomainError, T>`
    - `domain/`: regras puras — estoque, quantidade, totais/cupom (`buildCarrinhoView`), `DomainError`. Sem Hono/Drizzle.
    - `repositories/ports/`: interfaces (ports) dos repositórios — o use case depende do contrato, não do driver
    - `repositories/`: implementações Drizzle/Postgres + mappers (row → modelo)

Fluxo típico: `route` → `handler` → `use-case` → `domain` + `port` → `repository` → `sendSuccess` / `sendDomainError`.

### Árvore (resumo)

```
brt-api/
├── data/                     # seed (produtos.json, cupons.json)
├── src/
│   ├── index.ts              # entry Lambda (export handler)
│   ├── app.ts                # CORS + Router
│   ├── routes/               # paths → handlers (+ /docs OpenAPI)
│   ├── handlers/             # controllers HTTP por domínio
│   ├── middlewares/          # ex.: carrinho FINALIZADO
│   ├── use-cases/            # casos de uso
│   ├── domain/               # regras + DomainError
│   ├── repositories/
│   │   ├── ports/            # interfaces (ports)
│   │   └── mappers/          # row Drizzle → modelo
│   ├── models/               # tipos de API / domínio de borda
│   ├── db/                   # schema Drizzle, pool, migrations
│   ├── docs/openapi.json     # Spec OpenAPI (Swagger em /docs)
│   ├── common/utils/         # sendSuccess, sendDomainError, logger…
│   ├── config/env.ts
│   ├── local/server.ts       # dev local (não vai no webpack)
│   └── scripts/              # migrate, seed
├── webpack.config.js         # bundle único → dist/index.js
└── package.json
```

Convenção: **`handlers/`** = borda HTTP. Utilitários cross-cutting ficam em **`common/utils/`** — não misturar com handler de rota.

Envelope de resposta (sucesso e erro):

```json
{ "statusCode": 200, "message": "OK", "data": {} }
```

## ARQUITETURA

- Valores monetários: **centavos `integer`** no banco e no domínio; `fromCents` na serialização da API se precisar exibir reais.
- HTTP: **Hono** — `app` só pluga o `Router`; paths primários em `routes/index.ts`.
- Respostas via `sendSuccess` / `sendError`; body tipado com `ApiResponse<T>`.
- Local = `@hono/node-server`; prod = `hono/aws-lambda`.
- Webpack: bundle único para Lambda (`pg-native` ignorado).
- Sem auth; CORS via `CORS_ORIGIN`.
- **Estoque no checkout:** o `POST /carrinhos/:id/checkout` **não** decrementa `quantidadeEstoque` dos produtos. O desafio pede finalizar o carrinho (`ABERTO` → `FINALIZADO`) e validar estoque nas mutações de itens; **não** pede baixa de inventário na finalização. Por isso o checkout só altera o status — evita escopo extra (transaction, concorrência, inventário) fora do enunciado. Estoque continua sendo teto nas adições/atualizações de qty (`INSUFFICIENT_STOCK`).
- **Lint/format:** ESLint 9 (flat) + Prettier — regras adaptadas de `prototipo/` (singleQuote, printWidth 120, `import/no-default-export`, etc.). Scripts: `npm run lint` / `npm run format`.
- **OpenAPI:** spec estática em `src/docs/openapi.json`, UI em `GET /docs`. No `/docs` a spec vai **embutida no HTML** (Swagger usa `spec:`, não `url:`) — no API Gateway, fetch em `/openapi.json` sem o stage `/Prod` retorna 403; assim o Swagger não depende desse 2º request. `GET /openapi.json` continua disponível com o prefixo certo (`/Prod/openapi.json`).
- **Docker:** imagem da API (`Dockerfile`) + serviço `api` no `docker-compose` da raiz. Deploy em prod continua sendo **zip → Lambda** (não imagem ECR); o container serve o diferencial local / parity de runtime.

## Anotações

### Docker / compose (local) vs produção

- O `Dockerfile` + serviço `api` no `docker-compose` da raiz existem para **ambiente local e demonstração do desafio**: API HTTP (`src/local/server.ts`) e Postgres lado a lado, com um `docker-compose up -d --build`.
- **Em produção** a API sobe como **AWS Lambda** (bundle webpack → zip → `update-function-code` na CI). O banco de prod é o **Neon** (ou outro Postgres gerenciado), **não** o container `postgres` do compose.
- Este Dockerfile **não** é a imagem de deploy da Lambda. Um deploy Lambda *via container* seria outro artefato (base `public.ecr.aws/lambda/nodejs:…` + handler), distinto deste. Aqui o objetivo do diferencial é containerizar o runtime HTTP local, não trocar o modelo de deploy.
- O Postgres no compose é **só critério de teste/desafio** (e dev no dia a dia). Para “zerar” o banco local e subir tudo de novo: `docker-compose down -v && docker-compose up -d --build` (o `-v` apaga o volume; sem isso o volume antigo permanece).

### Entrypoint e init do banco

- `docker/entrypoint.sh`: espera o Postgres aceitar conexão (`nc`), roda **migrate + seed** e só então sobe o app — evita race no `compose up` quando API e DB sobem juntos.
- `docker/init-db.sql`: cria a extensão `unaccent` (busca de produtos). Roda só na **primeira** criação do volume Postgres (`docker-entrypoint-initdb.d`). Volume antigo sem a extensão → `CREATE EXTENSION IF NOT EXISTS unaccent;` manual ou `down -v`.
- `RUN_DB_SETUP=false` no serviço `api` desliga migrate/seed no boot, se precisar.

