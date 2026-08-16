# API Architecture

> SDD completo (SPEC/PLAN/RULES/ADR): [`../../docs/`](../../docs/) — esp. [`platform/architecture.md`](../../docs/platform/architecture.md).

API no modelo hexagonal reduzido (camadas claras, sem over-engineering).

## Analogia Nest → este projeto

| Nest | Aqui | pasta |
|------|------|--------|
| Controller | Handler | `handlers/` |
| Service / UseCase | Use case | `use-cases/` |
| Domain / Entity rules | Domain puro | `domain/` |
| Repository **interface** (abstract) | **Port** | `repositories/ports/` |
| TypeORM/Prisma repository | Impl Drizzle | `repositories/*.repository.ts` |
| Mapper / transformer | Mapper | `repositories/mappers/` |
| DTO | Models | `models/` |

## Pastas

```
src/
├── handlers/              # HTTP (controllers) — Hono Context in/out
├── routes/                # monta paths → handlers
├── use-cases/             # orquestra ports + domain → Either
├── domain/                # regras puras (sem DB/HTTP)
├── models/                # shapes de aplicação / API (DTOs)
├── repositories/
│   ├── ports/             # contratos (interfaces) — use case depende daqui
│   ├── mappers/           # row Drizzle → model
│   ├── products.repository.ts   # impl + factory/singleton
│   └── carrinho.repository.ts
├── common/
│   ├── types/             # Either, Pagination
│   └── utils/             # logger, sendSuccess, pg-error, …
├── db/                    # schema Drizzle + Database singleton
├── config/
├── local/
└── index.ts
```

## Fluxo

```
routes → handlers → use-cases → ports ←── impl Drizzle (repositories/)
                      ↓              mappers (row → model)
                   domain
                      ↓
              Either Left | Right
                      ↓
   handler: isLeft → sendDomainError | sendSuccess
```

## Ports vs repositories

- **Port** (`*.port.ts`): só o contrato — o que o use case precisa.
- **Repository** (`*.repository.ts`): SQL/Drizzle + `getXRepository()` singleton.
- **Mapper**: conversão de persistência → model (datas ISO, etc.).

Não misturar interface + mapper + SQL no mesmo bloco gigante — mas também não criar pasta `presenter` HTTP; shape de resposta fica no handler/`sendSuccess`.

## Either

```ts
return left(domainError('INSUFFICIENT_STOCK', '...'));
return right(payload);
// handler:
if (isLeft(result)) return sendDomainError({ ctx: c, error: result.left });
return sendSuccess({ ctx: c, data: result.right });
```

## Erros → HTTP

| code | status | FE |
|------|--------|-----|
| `INSUFFICIENT_STOCK` | 400 | toast + refetch catálogo |
| `INVALID_QUANTITY` / `CART_CLOSED` | 400 | toast / travar UI |
| `*_NOT_FOUND` | 404 | toast |
| `INTERNAL` | 500 | toast genérico |

Envelope: `{ statusCode, message, data, meta? }`.
