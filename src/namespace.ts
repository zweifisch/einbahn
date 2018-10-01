import {EventEmitter} from 'events';
import {ServerRequest, ServerResponse} from 'http';

import {Channel} from './channel';
import {Client, Event} from './client';

export class ChannelNotExistsError extends Error {
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class Namespace extends EventEmitter {
  private clients = new Set<Client>();
  private _channels: Map<string, Channel>;

  constructor(private ns: string, private options: {
    origins: string,
    keepalive: number,
    retry: number,
    credentials: boolean
  }) {
    super();
  }

  handleRequest(req: ServerRequest, res: ServerResponse, query: object):
      Promise<undefined> {
    let done;
    const ret = new Promise<undefined>((resolve, reject) => done = resolve);
    const client = new Client(req, res, this.options);
    client.once('close', () => {
      this.clients.delete(client);
      done();
    });
    client.on('join', channel => {
      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Channel());
      }
      this.channels.get(channel).add(client);
    });
    client.on('leave', channel => {
      if (!this.channels.has(channel)) {
        throw new ChannelNotExistsError('Channel ${channel} not exists');
      }
      this.channels.get(channel).remove(client);
    });
    this.clients.add(client);
    this.emit('connection', client, req.headers['last-event-id'], query);
    return ret;
  }

  /**
   * send event to all clients within current namespace
   */
  send(event: Event) {
    this.clients.forEach(client => client.send(event));
  }

  /**
   * send event to all clients within a channel
   */
  to(channel: string): Channel {
    if (!this.channels.has(channel)) {
      throw new ChannelNotExistsError('Channel ${channel} not exists');
    }
    return this.channels.get(channel);
  }

  /**
   * get the number of connected clients
   */
  get size(): number {
    return this.clients.size;
  }

  get channels(): Map<string, Channel> {
    this._channels =
        this._channels ? this._channels : new Map<string, Channel>();
    return this._channels;
  }
}
