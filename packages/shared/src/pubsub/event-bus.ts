/**
 * In-process Event Bus
 *
 * Lightweight pub/sub backbone powered by Node.js EventEmitter.
 * Works immediately on single-instance VPS. When scaling to multiple
 * instances, bridge to Redis pub/sub via `enableRedisBridge()`.
 *
 * This is the single source of truth for real-time events within
 * a Node.js process. SSE and WebSocket handlers subscribe here.
 */

import { EventEmitter } from 'events';
import type { PubSubChannel } from './channels';
import type { PubSubEvent, ChannelEventMap } from './types';

const MAX_LISTENERS = 500; // Support many concurrent SSE/WS connections

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(MAX_LISTENERS);
  }

  /**
   * Publish an event to a channel.
   * All in-process subscribers receive it immediately.
   */
  publish<C extends keyof ChannelEventMap>(
    channel: C,
    data: ChannelEventMap[C],
    source = 'system',
  ): void {
    const event: PubSubEvent<ChannelEventMap[C]> = {
      channel,
      timestamp: new Date().toISOString(),
      source,
      data,
    };
    this.emitter.emit(channel, event);
  }

  /**
   * Publish to a dynamic channel (e.g. job-specific progress).
   */
  publishRaw(channel: string, data: unknown, source = 'system'): void {
    const event: PubSubEvent = {
      channel,
      timestamp: new Date().toISOString(),
      source,
      data,
    };
    this.emitter.emit(channel, event);
  }

  /**
   * Subscribe to a typed channel.
   * Returns an unsubscribe function.
   */
  subscribe<C extends keyof ChannelEventMap>(
    channel: C,
    handler: (event: PubSubEvent<ChannelEventMap[C]>) => void,
  ): () => void {
    this.emitter.on(channel, handler);
    return () => {
      this.emitter.off(channel, handler);
    };
  }

  /**
   * Subscribe to a dynamic channel (e.g. job progress).
   */
  subscribeRaw(
    channel: string,
    handler: (event: PubSubEvent) => void,
  ): () => void {
    this.emitter.on(channel, handler);
    return () => {
      this.emitter.off(channel, handler);
    };
  }

  /** Number of active listeners across all channels */
  get listenerCount(): number {
    return this.emitter.eventNames().reduce(
      (sum, name) => sum + this.emitter.listenerCount(name),
      0,
    );
  }
}

/** Singleton event bus */
let _bus: EventBus | undefined;

export function getEventBus(): EventBus {
  if (!_bus) {
    _bus = new EventBus();
  }
  return _bus;
}

export { EventBus };
