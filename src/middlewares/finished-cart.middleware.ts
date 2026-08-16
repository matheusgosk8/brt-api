import { sendDomainError } from '@src/common/utils/error-response';
import { domainError } from '@src/domain/errors';
import { getCarrinhoRepository } from '@src/repositories/carrinho.repository';
import { MiddlewareHandler } from 'hono';

export const finishedCartMiddleware: MiddlewareHandler = async (c, next) => {
  const id = c.req.param('id');

  if (!id) {
    return next();
  }

  const carrinhoRepository = getCarrinhoRepository();

  const carrinho = await carrinhoRepository.findById(id);

  if (carrinho?.status === 'FINALIZADO') {
    return sendDomainError({
      ctx: c,
      error: domainError('CART_ALREADY_FINALIZED', 'Carrinho já finalizado'),
    });
  }

  return next();
};
