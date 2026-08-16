import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { listProductsUseCase } from '@src/use-cases/products/list-products';

export async function listProdutosHandler(c: Context) {
  const { page, perPage, search } = c.req.query();

  logger.debug('List products request', {
    page,
    perPage,
    search,
  });

  const params = {
    page: Number(page) || 1,
    perPage: Number(perPage) || 10,
    search: (search as string) || '',
  };

  if (params.perPage > 100) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Per page must be less than 100',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await listProductsUseCase(params);

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right.data,
    meta: result.right.meta,
  });
}
