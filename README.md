# einbahn

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Node.js Version][node-version-image]][node-version-url]

Server-Sent Events with Namespaces and Channels

- tested with http1, http2, koa and express
- namespaces(like namespaces in socket.io or rabbitmq)
- channels(like rooms in socket.io)
- automatic keepalive
- payload is json encoded

## getting started

a minimal working example using koa

``` js
const Koa = require('koa')
const {SSE, koaMiddleware} = require('einbahn')
const app = new Koa()
const sse = new SSE()
sse.on('connection', client => {
  client.send({event: 'welcome', data: 'message from server'})
})
app.use(koaMiddleware(sse))
app.use((ctx, next) => {
  ctx.body = `<html><meta charset='utf8'/><script>
  let es = new EventSource('/')
  es.addEventListener('welcome', ({ data }) => {
    alert(JSON.parse(data))
  })
</script></html>`
})
app.listen(3000, err => console.log(err ? err : 'listen on http://localhost:3000'))
```

### namespaces

by default all client are connected to the `/` namespace:

``` js
new EventSource('/')
```

to connect to a specific namespace:

``` js
new EventSource('/namespace1')
```

server side code

``` js
const ns1 = sse.of('/namespace1')
// send event to all client within the namespace
ns1.send({event: 'time', data: new Date()})
```

### channels(rooms)

a namespace can have multiple channels, to join client to a channel:

``` js
sse.on('connection', (client, lastId, query) => {
  client.join('chan1')
  sse.to('chan1').send({data: new Date()})
})
```

[documentation](https://zweifisch.github.io/einbahn/)

[npm-image]: https://img.shields.io/npm/v/einbahn.svg?style=flat
[npm-url]: https://npmjs.org/package/einbahn
[travis-image]: https://img.shields.io/travis/zweifisch/einbahn.svg?style=flat
[travis-url]: https://travis-ci.org/zweifisch/einbahn
[node-version-image]: https://img.shields.io/node/v/einbahn.svg
[node-version-url]: https://nodejs.org/en/download/
