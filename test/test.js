const sleep = time => new Promise(resolve => setTimeout(resolve, time))

function testUrl(baseUrl) {
    it('should connect', done => {
        let es = new EventSource(`${baseUrl}`)
        es.addEventListener('connected', ({ data }) => {
            es.close()
            expect(JSON.parse(data)).to.equal('hello: new connection')
            done()
        })
    })

    it('should send message', done => {
        let es = new EventSource(`${baseUrl}`)
        es.addEventListener('message', ({ data }) => {
            es.close()
            expect(JSON.parse(data)).to.equal('msg')
            done()
        })
    })

    it('should send multi-lined string', done => {
        let es = new EventSource(`${baseUrl}`)
        es.addEventListener('multi-lined', ({ data }) => {
            es.close()
            expect(JSON.parse(data)).to.equal('line1\n\nline2')
            done()
        })
    })

    it('should handle empty data', done => {
        let es = new EventSource(`${baseUrl}`)
        es.addEventListener('empty', ({ data }) => {
            es.close()
            expect(JSON.parse(data)).to.equal(null)
            done()
        })
    })

    it('should handle object', done => {
        let es = new EventSource(`${baseUrl}`)
        es.addEventListener('object', ({ data }) => {
            es.close()
            expect(JSON.parse(data)).to.deep.equal({key: ['value']})
            done()
        })
    })

    it('should seperate clients by channels', done => {
        let es1 = new EventSource(`${baseUrl}?channel=chan1`)
        let es2 = new EventSource(`${baseUrl}?channel=chan1`)
        let es3 = new EventSource(`${baseUrl}`)
        let result = {
            es1: [],
            es2: [],
            es3: [],
        }
        es1.addEventListener('channel', ({ data }) => {
            result.es1.push(JSON.parse(data))
        })
        es2.addEventListener('channel', ({ data }) => {
            result.es2.push(JSON.parse(data))
        })
        es3.addEventListener('channel', ({ data }) => {
            result.es3.push(JSON.parse(data))
        })
        setTimeout(()=> {
            es1.close()
            es2.close()
            es3.close()
            expect(result).to.deep.equal({
                es1: [{users: 1}, {users: 2}],
                es2: [{users: 2}],
                es3: [],
            })
            done()
        }, 300)
    })

    it('should seperate clients by namespaces', done => {
        let es1 = new EventSource(`${baseUrl}?channel=chan1`)
        let es2 = new EventSource(`${baseUrl}?channel=chan1`)
        let es3 = new EventSource(`${baseUrl}/ns1?channel=chan1`)
        let result = {
            es1: [],
            es2: [],
            es3: [],
        }
        es1.addEventListener('channel', ({ data }) => {
            result.es1.push(JSON.parse(data))
        })
        es2.addEventListener('channel', ({ data }) => {
            result.es2.push(JSON.parse(data))
        })
        es3.addEventListener('channel', ({ data }) => {
            result.es3.push(JSON.parse(data))
        })
        setTimeout(()=> {
            es1.close()
            es2.close()
            es3.close()
            expect(result).to.deep.equal({
                es1: [{users: 1}, {users: 2}],
                es2: [{users: 2}],
                es3: [{users: 1, ns: '/ns1'}],
            })
            done()
        }, 300)
    })

    it('should track clients count', done => {
        let es = new EventSource(`${baseUrl}`)
        es.addEventListener('open', async () => {
            try {
                let result = await fetch(`${baseUrl}/stats`)
                expect(await result.json()).to.deep.equal({namespaces: 2, clients: 1})
                es.close()
                await sleep(200)
                result = await fetch(`${baseUrl}/stats`)
                expect(await result.json()).to.deep.equal({namespaces: 2, clients: 0})
            } catch (e) {
                done(e)
            }
            done()
        })
    }).timeout(3000)
}

describe('SSE http1', () => testUrl('http://localhost:9091'))

describe('SSE http2', () => testUrl('https://localhost:9092'))

describe('SSE koa', () => testUrl('http://localhost:9093'))

describe('SSE express', () => testUrl('http://localhost:9094'))
