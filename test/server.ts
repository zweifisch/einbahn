import * as Express from 'express';
import * as fs from 'fs';
import {createServer} from 'http';
import {createSecureServer} from 'http2';
import * as Koa from 'koa';

import {connectMiddleware, koaMiddleware, SSE} from '../src';

const html = fs.readFileSync(`${__dirname}/debug.html`, 'utf8');

const options = {
  key: fs.readFileSync(`${__dirname}/key.pem`),
  cert: fs.readFileSync(`${__dirname}/cert.pem`)
};

function getSse() {
  const sse = new SSE();

  const ns1 = sse.of('/ns1');
  ns1.on('connection', (client, lastId, {channel}) => {
    if (channel) {
      client.join(channel);
      ns1.to(channel).send({
        event: 'channel',
        data: {users: ns1.channels.get(channel).size, ns: '/ns1'}
      });
    }
  });

  sse.on('connection', (client, lastId, {channel}) => {
    if (channel) {
      client.join(channel);
      sse.to(channel).send(
          {event: 'channel', data: {users: sse.channels.get(channel).size}});
    }
    const events = [
      {id: 1, event: 'connected', data: 'hello: new connection'},
      {id: 2, event: 'multi-lined', data: 'line1\n\nline2'},
      {id: 3, event: 'object', data: {key: ['value']}},
      {id: 4, data: 'msg'},
      {id: 5, event: 'empty'},
    ];
    events.forEach(x => {
      if (!lastId || +lastId < x.id) {
        client.send(x);
      }
    });
  });

  return sse;
}

function getHandler(sse) {
  return function handler(req, res) {
    if (req.headers.accept === 'text/event-stream') {
      sse.handleRequest(req, res);
    } else if (req.url === '/stats') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
      });
      res.write(JSON.stringify(sse.stats));
      res.end();
    } else {
      res.write(html);
      res.end();
    }
  };
}

createServer(getHandler(getSse()))
    .listen(
        9091, err => console.log(err ? err : 'http1 server listen on 9091'));
createSecureServer(options, getHandler(getSse()))
    .listen(
        9092, err => console.log(err ? err : 'http2 server listen on 9092'));


const koa = new Koa();
const sse = getSse();
koa.use(koaMiddleware(sse));
koa.use((ctx, next) => {
  if (ctx.url === '/stats') {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.body = sse.stats;
  } else {
    ctx.body = html;
  }
});
koa.listen(9093, err => console.log(err ? err : 'koa listen on 9093'));


const express = Express();
const sse2 = getSse();
express.use(connectMiddleware(sse2));
express.get('/stats', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send(JSON.stringify(sse2.stats));
});
express.get('/', (req, res) => {
  res.send(html);
});
express.listen(9094, err => console.log(err ? err : 'express listen on 9094'));
