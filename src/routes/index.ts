import { Hono } from 'hono';
import { healthRoutes } from './health';
import { produtosRoutes } from './produtos';
import { carrinhosRoutes } from './carrinhos';
import { docsRoutes } from './docs';

/**Router único exportável, não é o padrão da documentação do huno, mas estou mais habituado a seguir
 * este padrão no express js é mais comum, pois é mais fácil de manter e de entender.  
 * Uma vantagem desta abordagem eé evitar regex para transformar lambdas em servers na aws e permite ainda
 * flexibilidade para a aplicação de middlewares e interceptors por domínio
 */
export const Router = new Hono();

Router.route('/', docsRoutes);
Router.route('/health', healthRoutes);
Router.route('/produtos', produtosRoutes);
Router.route('/carrinhos', carrinhosRoutes);
