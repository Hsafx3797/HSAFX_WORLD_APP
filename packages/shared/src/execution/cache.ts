/**
 * Tool Execution Result Caching
 * HSAFX WORLD - Caching strategy for tool execution results
 */

// Cache entry
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
  size: number;
  toolId: string;
  inputHash: string;
}

// Cache statistics
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number; // Maximum total size in bytes
  maxEntries: number;
  defaultTTL: number; // Default time-to-live in milliseconds
  cleanupInterval: number;
}

// Default cache config
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 1000,
  defaultTTL: 3600000, // 1 hour
  cleanupInterval: 300000, // 5 minutes
};

// Tool-specific TTL overrides
export const TOOL_CACHE_TTL: Record<string, number> = {
  // Never cache (0 = no caching)
  'random-string-generator': 0,
  'uuid-generator': 0,
  'password-generator': 0,
  'lorem-ipsum-generator': 0,
  
  // Short cache (5 minutes)
  'timezone-converter': 300000,
  'age-calculator': 300000,
  
  // Medium cache (1 hour - default)
  'calculator-basic': 3600000,
  'text-case-converter': 3600000,
  'json-formatter': 3600000,
  'base64-encoder': 3600000,
  
  // Long cache (24 hours)
  'hash-generator': 86400000,
  'minify-javascript': 86400000,
  'minify-css': 86400000,
  
  // Very long cache (7 days)
  'qr-code-generator': 604800000,
  'barcode-generator': 604800000,
};

/**
 * Generate cache key from tool ID and input
 */
export function generateCacheKey(toolId: string, input: unknown): string {
  const inputStr = typeof input === 'string' 
    ? input 
    : JSON.stringify(input, Object.keys(input as object).sort());
  
  return `tool:${toolId}:${hashString(inputStr)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate approximate size of a value
 */
export function calculateSize(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') return value.length * 2; // UTF-16
  if (typeof value === 'number') return 8;
  if (typeof value === 'boolean') return 4;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + calculateSize(item), 0);
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce(
      (sum, [key, val]) => sum + key.length * 2 + calculateSize(val),
      0
    );
  }
  return 0;
}

/**
 * Check if a tool result should be cached
 */
export function shouldCache(toolId: string): boolean {
  return TOOL_CACHE_TTL[toolId] !== 0;
}

/**
 * Get TTL for a specific tool
 */
export function getToolTTL(toolId: string): number {
  return TOOL_CACHE_TTL[toolId] ?? DEFAULT_CACHE_CONFIG.defaultTTL;
}

/**
 * Create cache entry
 */
export function createCacheEntry<T>(
  toolId: string,
  input: unknown,
  value: T
): CacheEntry<T> {
  const inputHash = hashString(
    typeof input === 'string' ? input : JSON.stringify(input)
  );
  
  return {
    key: generateCacheKey(toolId, input),
    value,
    createdAt: Date.now(),
    expiresAt: Date.now() + getToolTTL(toolId),
    hits: 0,
    size: calculateSize(value),
    toolId,
    inputHash,
  };
}

/**
 * Check if cache entry is expired
 */
export function isExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAt;
}

/**
 * Check if cache entry should be evicted (LRU-like)
 */
export function shouldEvict(
  entry: CacheEntry,
  stats: CacheStats,
  config: CacheConfig
): boolean {
  // Evict if total size exceeds limit
  if (stats.totalSize > config.maxSize) return true;
  
  // Evict if total entries exceeds limit
  if (stats.totalEntries > config.maxEntries) return true;
  
  // Evict expired entries
  if (isExpired(entry)) return true;
  
  return false;
}

/**
 * Redis key patterns for distributed caching
 */
export const CACHE_REDIS_KEYS = {
  toolResult: (toolId: string, hash: string) => `cache:tool:${toolId}:${hash}`,
  toolStats: (toolId: string) => `cache:stats:${toolId}`,
  globalStats: () => 'cache:stats:global',
  lockKey: (key: string) => `cache:lock:${key}`,
};
