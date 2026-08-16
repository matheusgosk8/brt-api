import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { listCarrinhosUseCase } from '@src/use-cases/carrinhos/list-carrinhos';

export async function listCarrinhosHandler(c: Context) {
  const { page, perPage } = c.req.query();

  logger.debug('List carrinhos request', {
    page,
    perPage,
  });

  const params = {
    page: Number(page) || 1,
    perPage: Number(perPage) || 10,
  };

  if (params.perPage > 100) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Per page must be less than 100',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await listCarrinhosUseCase(params);

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right.data,
    meta: result.right.meta,
  });
}
