import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { checkoutUseCase } from '@src/use-cases/carrinhos/checkout';

export async function checkoutHandler(c: Context) {
  const carrinhoId = c.req.param('id');

  logger.debug('Checkout request', { carrinhoId });

  if (!carrinhoId) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho é obrigatório',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await checkoutUseCase({ carrinhoId });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    message: 'Checkout realizado',
    statusCode: 200,
  });
}
