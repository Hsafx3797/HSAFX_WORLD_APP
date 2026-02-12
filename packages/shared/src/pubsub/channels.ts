/**
 * Pub/Sub Channel Definitions
 *
 * Central registry of all event channels used across the platform.
 * Channels follow the pattern: {domain}:{event-type}
 *
 * Reference: docs/PLANNING/26_ADMIN_PANEL_SPECIFICATION.md §12
 * Reference: docs/PLANNING/10_SYSTEM_ARCHITECTURE.md §Pub/Sub
 */

/** All available pub/sub channels */
export const PubSubChannels = {
  // Admin real-time dashboard
  ADMIN_ERRORS: 'admin:errors',
  ADMIN_ALERTS: 'admin:alerts',
  ADMIN_METRICS: 'admin:metrics',
  ADMIN_JOBS: 'admin:jobs',
  ADMIN_WEBHOOKS: 'admin:webhooks',

  // Cache invalidation (cross-instance)
  CACHE_INVALIDATION: 'channel:cache:invalidation',

  // Job progress (per-job channels constructed dynamically)
  JOB_PROGRESS: 'job:progress',
} as const;

export type PubSubChannel = (typeof PubSubChannels)[keyof typeof PubSubChannels];

/** Build a job-specific progress channel */
export function jobProgressChannel(jobId: string): string {
  return `${PubSubChannels.JOB_PROGRESS}:${jobId}`;
}
