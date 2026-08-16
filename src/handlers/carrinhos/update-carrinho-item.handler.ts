import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { parseBody } from '@src/common/utils/parse-body';
import { sendSuccess } from '@src/common/utils/response';
import { updateCarrinhoItemUseCase } from '@src/use-cases/carrinhos/update-carrinho-item';

type UpdateItemBody = {
  quantidade?: number;
};

/**
 * PUT /carrinhos/:id/itens/:produtoId
 * Body: `{ "quantidade": number }` — 0 remove a linha.
 */
export async function updateCarrinhoItemHandler(c: Context) {
  const carrinhoId = c.req.param('id');
  const produtoId = c.req.param('produtoId');

  logger.debug('Update item carrinho request', { carrinhoId, produtoId });

  if (!carrinhoId || !produtoId) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho e produtoId são obrigatórios',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const parsed = await parseBody<UpdateItemBody>({ ctx: c });
  if (!parsed.ok) return parsed.response;

  if (parsed.data.quantidade === undefined || parsed.data.quantidade === null) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'quantidade é obrigatória',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const quantidade = Number(parsed.data.quantidade);

  const result = await updateCarrinhoItemUseCase({
    carrinhoId,
    produtoId,
    quantidade,
  });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
    message: quantidade === 0 ? 'Item removido do carrinho' : 'Quantidade do item atualizada',
  });
}
