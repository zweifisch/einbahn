import {Client, Event} from './client';

export class Channel {
  private clients = new Set<Client>();

  add(client: Client) {
    this.clients.add(client);
  }

  remove(client: Client) {
    this.clients.delete(client);
  }

  /**
   * send message to all clients in current channel
   */
  send(event: Event) {
    this.clients.forEach(client => client.send(event));
  }

  /**
   * get the number of clients subscripbed to channel
   */
  get size(): number {
    return this.clients.size;
  }
}
