import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { sendSuccess } from '@src/common/utils/response';
import { parseBody } from '@src/common/utils/parse-body';
import { addCarrinhoItemUseCase } from '@src/use-cases/carrinhos/add-carrinho-item';

type AddItemBody = {
  produtoId?: string;
  quantidade?: number;
};

export async function addCarrinhoItemHandler(c: Context) {
  const carrinhoId = c.req.param('id');

  logger.debug('Add item carrinho request', { carrinhoId });

  if (!carrinhoId) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho é obrigatório',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const parsed = await parseBody<AddItemBody>({ ctx: c });
  if (!parsed.ok) return parsed.response;

  const { produtoId, quantidade } = parsed.data;

  if (!produtoId || quantidade === undefined) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'produtoId e quantidade são obrigatórios',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await addCarrinhoItemUseCase({
    carrinhoId,
    produtoId,
    quantidade: Number(quantidade),
  });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
    message: 'Item adicionado ao carrinho',
    statusCode: 201,
  });
}
