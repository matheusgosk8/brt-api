import { Hono } from 'hono';
import { listCarrinhosHandler } from '@src/handlers/carrinhos/list-carrinhos.handler';
import { createCarrinhoHandler } from '@src/handlers/carrinhos/create-carrinho.handler';
import { findCarrinhoHandler } from '@src/handlers/carrinhos/find-carrinho.handler';
import { addCarrinhoItemHandler } from '@src/handlers/carrinhos/add-carrinho-item.handler';
import { removeCarrinhoItemHandler } from '@src/handlers/carrinhos/remove-carrinho-item.handler';
import { updateCarrinhoItemHandler } from '@src/handlers/carrinhos/update-carrinho-item.handler';
import { applyCuponHandler } from '@src/handlers/carrinhos/apply-cupon.handler';
import { removeCuponHandler } from '@src/handlers/carrinhos/remove-cupon.handler';
import { checkoutHandler } from '@src/handlers/carrinhos/checkout.handler';
import { finishedCartMiddleware } from '@src/middlewares/finished-cart.middleware';

export const carrinhosRoutes = new Hono();

carrinhosRoutes.get('/', listCarrinhosHandler);
carrinhosRoutes.post('/', createCarrinhoHandler);
carrinhosRoutes.get('/:id', findCarrinhoHandler);

// middleware antes do handler — a cadeia roda na ordem dos argumentos
carrinhosRoutes.post('/:id/itens', finishedCartMiddleware, addCarrinhoItemHandler);
carrinhosRoutes.put('/:id/itens/:produtoId', finishedCartMiddleware, updateCarrinhoItemHandler);
carrinhosRoutes.delete('/:id/itens/:produtoId', finishedCartMiddleware, removeCarrinhoItemHandler);
carrinhosRoutes.post('/:id/cupom', finishedCartMiddleware, applyCuponHandler);
carrinhosRoutes.delete('/:id/cupom', finishedCartMiddleware, removeCuponHandler);
carrinhosRoutes.post('/:id/checkout', finishedCartMiddleware, checkoutHandler);
