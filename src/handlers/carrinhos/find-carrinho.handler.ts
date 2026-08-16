import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { findCarrinhoUseCase } from '@src/use-cases/carrinhos/find-carrinhos';

export async function findCarrinhoHandler(c: Context) {
  const id = c.req.param('id');

  logger.debug('Find carrinho request', { id });

  if (!id) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho é obrigatório',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await findCarrinhoUseCase({ id });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
  });
}
