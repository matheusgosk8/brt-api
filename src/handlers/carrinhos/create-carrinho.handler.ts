import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { createCarrinhoUseCase } from '@src/use-cases/carrinhos/create-carrinhos';

export async function createCarrinhoHandler(c: Context) {
  logger.debug('Create carrinho request');

  const result = await createCarrinhoUseCase();

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
    message: 'Carrinho criado',
    statusCode: 201,
  });
}
