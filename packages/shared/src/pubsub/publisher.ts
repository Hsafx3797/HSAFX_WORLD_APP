/**
 * Publisher Helper Functions
 *
 * Convenience functions for publishing typed events from application code.
 * These are used by API routes, middleware, and background jobs to emit
 * real-time events to the admin dashboard.
 *
 * All publishers go through the in-process EventBus.
 */

import { PubSubChannels, jobProgressChannel } from './channels';
import { getEventBus } from './event-bus';
import type {
  AdminErrorEvent,
  AdminAlertEvent,
  AdminMetricsEvent,
  AdminJobEvent,
  AdminWebhookEvent,
  CacheInvalidationEvent,
  JobProgressEvent,
} from './types';

export function publishAdminError(data: AdminErrorEvent, source?: string): void {
  getEventBus().publish(PubSubChannels.ADMIN_ERRORS, data, source);
}

export function publishAdminAlert(data: AdminAlertEvent, source?: string): void {
  getEventBus().publish(PubSubChannels.ADMIN_ALERTS, data, source);
}

export function publishAdminMetrics(data: AdminMetricsEvent, source?: string): void {
  getEventBus().publish(PubSubChannels.ADMIN_METRICS, data, source);
}

export function publishAdminJob(data: AdminJobEvent, source?: string): void {
  getEventBus().publish(PubSubChannels.ADMIN_JOBS, data, source);
}

export function publishAdminWebhook(data: AdminWebhookEvent, source?: string): void {
  getEventBus().publish(PubSubChannels.ADMIN_WEBHOOKS, data, source);
}

export function publishCacheInvalidation(data: CacheInvalidationEvent, source?: string): void {
  getEventBus().publish(PubSubChannels.CACHE_INVALIDATION, data, source);
}

export function publishJobProgress(jobId: string, data: JobProgressEvent, source?: string): void {
  getEventBus().publishRaw(jobProgressChannel(jobId), data, source);
}
