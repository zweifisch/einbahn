import {EventEmitter} from 'events';

type Payload = string|number|null|PayloadArray|{[key: string]: Payload};

interface PayloadArray extends Array<Payload> {}

export interface Event {
  event?: string;
  data?: Payload;
  id?: string|number;
}

export class Client extends EventEmitter {
  private _channels: Set<string>;
  private scheduledPing: number;
  private keepalive: number;

  constructor(private req, private res, private options: {
    origins: string,
    keepalive: number,
    retry: number,
    credentials: boolean
  }) {
    super();

    res.on('close', () => {
      clearTimeout(this.scheduledPing);
      this.channels.forEach(channel => this.leave(channel));
      this.emit('close');
    });

    this.req.socket.setNoDelay(true);
    this.res.writeHead(200, {
      'Access-Control-Allow-Origin': options.origins,
      ...options.credentials && {'Access-Control-Allow-Credentials': 'true'},
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      ...+ req.httpVersion < 2 &&
          {
            'Connection': 'keep-alive'
          }
    });
    this.res.write(`retry:${options.retry}\n\n`);

    this.keepalive = options.keepalive;
    if (this.keepalive > 0) {
      this.doKeepAlive();
    }
  }

  private doKeepAlive() {
    this.scheduledPing = +setTimeout(() => {
      this.res.write(`:\n`);
      this.doKeepAlive();
    }, this.keepalive);
  }

  get channels(): Set<string> {
    if (!this._channels) {
      this._channels = new Set<string>();
    }
    return this._channels;
  }

  join(channel: string) {
    if (!this.channels.has(channel)) {
      this.channels.add(channel);
      this.emit('join', channel);
    }
  }

  leave(channel: string) {
    if (this.channels.has(channel)) {
      this.channels.delete(channel);
      this.emit('leave', channel);
    }
  }

  send(options: Event) {
    const {event, data, id} = options;
    let fields = '';
    if (event) {
      fields = `event:${event}\n`;
    }
    if (id) {
      fields += `id:${id}\n`;
    }
    if (fields) this.res.write(fields);
    this.res.write(
        `data:${JSON.stringify(data === undefined ? null : data)} \n\n`);
  }

  close() {
    this.res.end();
  }
}
