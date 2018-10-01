import {SSE} from './server';

/**
 * returns a middleware to be used with connect/express
 *
 * ``` js
 * const { SSE, connectMiddleware } = require('ssec')
 *
 * const sse = new SSE()
 * app.use(connectMiddleware(sse))
 * sse.on('connection', client => {
 *     client.send({event: 'hello', data: 'new connection'})
 * })
 * ```
 */
export function connectMiddleware(sse: SSE) {
  return function SseMiddleware(req, res, next) {
    if (req.headers.accept === 'text/event-stream') {
      sse.handleRequest(req, res);
    } else {
      next();
    }
  };
}

/**
 * returns a middleware to be used with koa
 *
 * ``` js
 * const { SSE, koaMiddleware } = require('ssec')
 *
 * const sse = new SSE()
 * app.use(koaMiddleware(sse))
 * sse.on('connection', client => {
 *     client.join('room1')
 *     client.all({event: 'new-user' data: 'new user joined room1'})
 *     client.to('room1', {event: 'new-user' data: 'new user joined'})
 * })
 * ```
 */
export function koaMiddleware(sse: SSE) {
  return async function SseMiddleware({req, res, headers}, next) {
    if (headers.accept === 'text/event-stream') {
      await sse.handleRequest(req, res);
    } else {
      await next();
    }
  };
}
