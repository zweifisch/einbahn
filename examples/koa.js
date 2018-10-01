const Koa = require('koa')
const {SSE, koaMiddleware} = require('ssec')
const app = new Koa()
const sse = new SSE()
sse.on('connection', client => {
  client.send({event: 'welcome', data: 'message from server'})
})
app.use(koaMiddleware(sse))
app.use((ctx, next) => {
  ctx.body = `\
<html>
<meta charset='utf8'/>
<script>
  let es = new EventSource('/')
  es.addEventListener('welcome', ({ data }) => {
    alert(JSON.parse(data))
  })
</script>
</html>`
})
app.listen(3000, err => console.log(err ? err : 'listen on http://localhost:3000'))
