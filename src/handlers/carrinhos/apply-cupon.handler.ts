import type { Context } from 'hono';
import { isLeft } from '@src/common/types/result';
import { sendDomainError, sendError } from '@src/common/utils/error-response';
import { parseBody } from '@src/common/utils/parse-body';
import { sendSuccess } from '@src/common/utils/response';
import { applyCuponUseCase } from '@src/use-cases/carrinhos/apply-cupon';

type ApplyCuponBody = {
  codigoCupom?: string;
};

export async function applyCuponHandler(c: Context) {
  const carrinhoId = c.req.param('id');

  logger.debug('Apply cupom request', { carrinhoId });

  if (!carrinhoId) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'Id do carrinho é obrigatório',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const parsed = await parseBody<ApplyCuponBody>({ ctx: c });
  if (!parsed.ok) return parsed.response;

  if (!parsed.data.codigoCupom) {
    return sendError({
      ctx: c,
      statusCode: 400,
      message: 'codigoCupom é obrigatório',
      data: { code: 'BAD_REQUEST' },
    });
  }

  const result = await applyCuponUseCase({
    carrinhoId,
    codigoCupom: parsed.data.codigoCupom,
  });

  if (isLeft(result)) {
    return sendDomainError({ ctx: c, error: result.left });
  }

  return sendSuccess({
    ctx: c,
    data: result.right,
    message: 'Cupom aplicado',
  });
}
