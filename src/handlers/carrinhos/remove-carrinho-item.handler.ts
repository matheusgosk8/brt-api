import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { removeCarrinhoItemUseCase } from '@src/use-cases/carrinhos/remove-carrinho-item';

export async function removeCarrinhoItemHandler(c: Context) {
  const carrinhoId = c.req.param('id');
  const produtoId = c.req.param('produtoId');

  logger.debug('Remove item carrinho request', { carrinhoId, produtoId });

  if (!carrinhoId || !produtoId) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho e produtoId são obrigatórios',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await removeCarrinhoItemUseCase({
    carrinhoId,
    produtoId,
  });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
    message: 'Item removido do carrinho',
    statusCode: 200,
  });
}
