/**
 * Envelope padrão de todas as respostas da API.
 * Listagens: `data` + `meta` no topo (não aninhado dentro de data).
 */
export type ApiResponse<T = unknown, M = unknown> = {
  statusCode: number;
  message: string;
  data: T;
  meta?: M;
};

/** Shape comum do Right de use cases paginados. */
export type PaginatedPayload<T> = {
  data: T;
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};
