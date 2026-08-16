import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { removeCuponUseCase } from '@src/use-cases/carrinhos/remove-cupons';

export async function removeCuponHandler(c: Context) {
  const carrinhoId = c.req.param('id');

  logger.debug('Remove cupom request', { carrinhoId });

  if (!carrinhoId) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho é obrigatório',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await removeCuponUseCase({ carrinhoId });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
    message: 'Cupom removido do carrinho',
  });
}
