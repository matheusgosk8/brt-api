import { Hono } from 'hono';
import { healthCheck } from '../handlers/health.handler';

export const healthRoutes = new Hono();

healthRoutes.get('/', healthCheck);
