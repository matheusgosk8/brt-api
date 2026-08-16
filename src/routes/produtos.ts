import { Hono } from 'hono';
import { listProdutosHandler } from '@src/handlers/produtos/list-produtos.handler';

export const produtosRoutes = new Hono();

produtosRoutes.get('/', listProdutosHandler);
