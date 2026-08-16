import { handle } from 'hono/aws-lambda';
import { createApp } from './app';

const app = createApp();

/** Entry da Lambda (API Gateway proxy {proxy+}). */
export const handler = handle(app);
