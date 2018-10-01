import {EventEmitter} from 'events';
import {ServerRequest, ServerResponse} from 'http';
import * as url from 'url';

import {Channel} from './channel';
import {Event} from './client';
import {Namespace} from './namespace';

export class SSE extends EventEmitter {
  private options:
      {origins: string, keepalive: number, retry: number, credentials: boolean};
  private namespaces = new Map<string, Namespace>();

  /**
   *
   * @param options.origins - the Access-Control-Allow-Origin header, default is
   * '*'
   * @param options.keepalive - interval in milliseconds for server to ping
   * client in order to prevent the connection be dropped by some proxy, default
   * is 15000
   * @param options.retry - how long in milliseconds client should wait before
   * reconnecting when connection is dropped, default is 3000
   *
   */
  constructor(options?: {
    origins?: string,
    keepalive?: number,
    retry?: number,
    credentials?: boolean
  }) {
    super();
    const {origins, keepalive, retry, credentials} = {
      origins: '*',
      keepalive: 15000,
      retry: 3000,
      credentials: false,
      ...options
    };
    this.options = {origins, keepalive, retry, credentials};
    this.of('/').on(
        'connection', (...args) => this.emit('connection', ...args));
  }

  handleRequest(req: ServerRequest, res: ServerResponse): Promise<undefined> {
    const {query, pathname} = url.parse(req.url, true);
    return this.of(pathname).handleRequest(req, res, query);
  }

  /**
   * get namespace
   */
  of(ns: string): Namespace {
    if (!this.namespaces.has(ns)) {
      this.namespaces.set(ns, new Namespace(ns, this.options));
    }
    return this.namespaces.get(ns);
  }

  /**
   * send event to all clients within default namespace
   */
  send(event: Event) {
    return this.of('/').send(event);
  }

  /**
   * send event to all clients within a channel of the default namespace
   */
  to(channel: string): Channel {
    return this.of('/').to(channel);
  }

  /**
   * all channels of the default namespace
   */
  get channels(): Map<string, Channel> {
    return this.of('/').channels;
  }

  /**
   * count clients of the default namespace
   */
  get size() {
    return this.of('/').size;
  }

  get stats() {
    const namespaces = [...this.namespaces.values()];
    return {
      namespaces: namespaces.length,
      clients: namespaces.reduce((total, ns) => total + ns.size, 0)
    };
  }
}
