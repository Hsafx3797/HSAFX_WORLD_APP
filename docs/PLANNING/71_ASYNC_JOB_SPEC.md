# ⚡ Async Job Specification

**Affected Tools:** 298-379 (FILE_CONVERTER), 446 (ASYNC_INTELLIGENCE)  
**Total Async Tools:** 83  
**Job Queue:** Redis-backed queue  
**Workers:** FastAPI Python processes  

---

## 1. Overview

This specification defines the async job system for long-running operations (file conversions, web scraping).

**Key Features:**
- Job status polling with exponential backoff (1s→2s→5s→10s)
- WebSocket real-time updates for premium users
- 3-hour result expiration
- Progress percentage tracking
- Job cancellation support
- Automatic retry on transient failures

---

## 2. Job Database Schema

```prisma
// prisma/schema.prisma

model AsyncJob {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  toolId          Int
  tool            Tool        @relation(fields: [toolId], references: [id])
  
  status          JobStatus   @default(QUEUED)
  priority        JobPriority @default(NORMAL)
  
  // Input
  inputFileKey    String?     // R2 key for file input
  parameters      Json        // Tool-specific parameters
  
  // Output
  outputFileKey   String?     // R2 key for result file
  outputFileName  String?     // Original filename for download
  resultData      Json?       // JSON result (for non-file outputs)
  
  // Progress
  progress        Int         @default(0) // 0-100
  currentStep     String?     // e.g., "Converting page 3/10"
  
  // Timing
  createdAt       DateTime    @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  expiresAt       DateTime    // 3 hours after creation
  
  // Error handling
  error           String?
  retryCount      Int         @default(0)
  maxRetries      Int         @default(3)
  
  // Metadata
  metadata        Json?       // Additional tool-specific data
  
  @@index([userId, status])
  @@index([status, priority, createdAt])
  @@index([expiresAt])
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  EXPIRED
}

enum JobPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## 3. Job Queue System

### 3.1 Redis Queue Configuration

```typescript
// packages/queue/src/config.ts

import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
});

// Define queues for different job types
export const imageQueue = new Queue('image-conversion', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 // 2s, 4s, 8s
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 1000
    },
    removeOnFail: {
      age: 86400 // 24 hours
    }
  }
});

export const pdfQueue = new Queue('pdf-conversion', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 3600,
      count: 1000
    },
    removeOnFail: {
      age: 86400
    }
  }
});

export const documentQueue = new Queue('document-conversion', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 3600,
      count: 1000
    },
    removeOnFail: {
      age: 86400
    }
  }
});

export const scrapingQueue = new Queue('web-scraping', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5, // More retries for scraping (network issues)
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 10s, 20s, 40s, 80s
    },
    removeOnComplete: {
      age: 3600,
      count: 1000
    },
    removeOnFail: {
      age: 86400
    }
  }
});

// Queue scheduler for delayed jobs
export const queueScheduler = new QueueScheduler('image-conversion', { connection: redis });
```

---

### 3.2 Job Submission

```typescript
// packages/api/src/services/job-service.ts

import { db } from '@/lib/db';
import { imageQueue, pdfQueue, documentQueue, scrapingQueue } from '@/queue';
import type { Queue } from 'bullmq';

export class JobService {
  async submitJob(params: {
    userId: string;
    toolId: number;
    inputFileKey?: string;
    parameters: Record<string, unknown>;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }) {
    const { userId, toolId, inputFileKey, parameters, priority = 'NORMAL' } = params;
    
    // Create job in database
    const job = await db.asyncJob.create({
      data: {
        userId,
        toolId,
        inputFileKey,
        parameters,
        status: 'QUEUED',
        priority,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
        maxRetries: 3
      }
    });
    
    // Add to appropriate queue
    const queue = this.getQueueForTool(toolId);
    
    await queue.add(
      `job-${job.id}`,
      {
        jobId: job.id,
        userId,
        toolId,
        inputFileKey,
        parameters
      },
      {
        jobId: job.id,
        priority: this.getPriorityValue(priority)
      }
    );
    
    return job;
  }
  
  private getQueueForTool(toolId: number): Queue {
    // Image tools: 298-320
    if (toolId >= 298 && toolId <= 320) return imageQueue;
    
    // PDF tools: 330-345
    if (toolId >= 330 && toolId <= 345) return pdfQueue;
    
    // Document tools: 350-365
    if (toolId >= 350 && toolId <= 365) return documentQueue;
    
    // Scraping tool: 446
    if (toolId === 446) return scrapingQueue;
    
    // Default to image queue
    return imageQueue;
  }
  
  private getPriorityValue(priority: string): number {
    const map: Record<string, number> = {
      LOW: 1,
      NORMAL: 5,
      HIGH: 10,
      URGENT: 15
    };
    return map[priority] || 5;
  }
}

export const jobService = new JobService();
```

---

## 4. Job Status Polling

### 4.1 Client Polling Hook

```typescript
// packages/ui-components/hooks/useJobPolling.ts

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

interface JobPollResult {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  progress: number;
  currentStep?: string;
  outputFileKey?: string;
  error?: string;
  isPolling: boolean;
}

export function useJobPolling(jobId: string | null): JobPollResult {
  const [result, setResult] = useState<JobPollResult>({
    status: 'queued',
    progress: 0,
    isPolling: false
  });
  
  const pollIntervalRef = useRef<number>(1000); // Start with 1 second
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const { refetch } = trpc.jobs.getStatus.useQuery(
    { jobId: jobId! },
    {
      enabled: false, // Manual refetch
      refetchOnWindowFocus: false
    }
  );
  
  useEffect(() => {
    if (!jobId) return;
    
    setResult(prev => ({ ...prev, isPolling: true }));
    
    const poll = async () => {
      const { data } = await refetch();
      
      if (data) {
        setResult({
          status: data.status,
          progress: data.progress,
          currentStep: data.currentStep,
          outputFileKey: data.outputFileKey,
          error: data.error,
          isPolling: true
        });
        
        // Stop polling if job finished
        if (['completed', 'failed', 'cancelled', 'expired'].includes(data.status)) {
          setResult(prev => ({ ...prev, isPolling: false }));
          return;
        }
        
        // Exponential backoff: 1s → 2s → 5s → 10s (max)
        if (pollIntervalRef.current < 10000) {
          if (pollIntervalRef.current === 1000) {
            pollIntervalRef.current = 2000;
          } else if (pollIntervalRef.current === 2000) {
            pollIntervalRef.current = 5000;
          } else if (pollIntervalRef.current === 5000) {
            pollIntervalRef.current = 10000;
          }
        }
        
        // Schedule next poll
        timeoutRef.current = setTimeout(poll, pollIntervalRef.current);
      }
    };
    
    // Start polling
    poll();
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setResult(prev => ({ ...prev, isPolling: false }));
    };
  }, [jobId, refetch]);
  
  return result;
}
```

---

### 4.2 tRPC Job Status Endpoint

```typescript
// packages/api/src/routers/jobs.ts

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const jobsRouter = router({
  getStatus: protectedProcedure
    .input(z.object({
      jobId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const job = await ctx.db.asyncJob.findFirst({
        where: {
          id: input.jobId,
          userId: ctx.user.id
        }
      });
      
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }
      
      // Check expiration
      if (new Date() > job.expiresAt && job.status !== 'COMPLETED') {
        await ctx.db.asyncJob.update({
          where: { id: job.id },
          data: { status: 'EXPIRED' }
        });
        
        return {
          status: 'expired' as const,
          progress: job.progress,
          error: 'Job expired after 3 hours'
        };
      }
      
      return {
        status: job.status.toLowerCase() as JobPollResult['status'],
        progress: job.progress,
        currentStep: job.currentStep,
        outputFileKey: job.outputFileKey,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt
      };
    }),
  
  cancelJob: protectedProcedure
    .input(z.object({
      jobId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await ctx.db.asyncJob.findFirst({
        where: {
          id: input.jobId,
          userId: ctx.user.id,
          status: { in: ['QUEUED', 'PROCESSING'] }
        }
      });
      
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or cannot be cancelled'
        });
      }
      
      // Remove from queue
      const queue = jobService.getQueueForTool(job.toolId);
      await queue.remove(job.id);
      
      // Update status
      await ctx.db.asyncJob.update({
        where: { id: job.id },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      });
      
      return { success: true };
    })
});
```

---

## 5. WebSocket Real-Time Updates (Premium)

### 5.1 WebSocket Server Setup

```typescript
// packages/websocket/src/server.ts

import { WebSocketServer } from 'ws';
import { verifyJWT } from '@/lib/auth';
import { redis } from '@/lib/redis';

const wss = new WebSocketServer({ port: 8080 });

interface Connection {
  ws: WebSocket;
  userId: string;
  subscribedJobs: Set<string>;
}

const connections = new Map<string, Connection>();

wss.on('connection', async (ws, req) => {
  // Verify JWT from query param
  const url = new URL(req.url!, 'ws://localhost');
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(4001, 'Missing token');
    return;
  }
  
  try {
    const payload = await verifyJWT(token);
    const userId = payload.userId;
    
    // Check if user is premium
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.isPremium) {
      ws.close(4003, 'Premium subscription required');
      return;
    }
    
    // Store connection
    const connectionId = `${userId}-${Date.now()}`;
    connections.set(connectionId, {
      ws,
      userId,
      subscribedJobs: new Set()
    });
    
    // Handle messages
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'subscribe') {
        const conn = connections.get(connectionId);
        conn?.subscribedJobs.add(message.jobId);
      }
      
      if (message.type === 'unsubscribe') {
        const conn = connections.get(connectionId);
        conn?.subscribedJobs.delete(message.jobId);
      }
    });
    
    // Handle disconnect
    ws.on('close', () => {
      connections.delete(connectionId);
    });
    
    // Send connection success
    ws.send(JSON.stringify({
      type: 'connected',
      userId
    }));
    
  } catch (error) {
    ws.close(4002, 'Invalid token');
  }
});

// Redis subscription for job updates
const subscriber = redis.duplicate();

subscriber.subscribe('job-updates', (err) => {
  if (err) console.error('Redis subscribe error:', err);
});

subscriber.on('message', (channel, message) => {
  if (channel !== 'job-updates') return;
  
  const update = JSON.parse(message);
  const { jobId, userId, status, progress, currentStep } = update;
  
  // Send update to subscribed connections
  for (const [_, conn] of connections) {
    if (conn.userId === userId && conn.subscribedJobs.has(jobId)) {
      conn.ws.send(JSON.stringify({
        type: 'job-update',
        jobId,
        status,
        progress,
        currentStep
      }));
    }
  }
});
```

---

### 5.2 Client WebSocket Hook

```typescript
// packages/ui-components/hooks/useJobWebSocket.ts

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';

interface JobUpdate {
  status: string;
  progress: number;
  currentStep?: string;
}

export function useJobWebSocket(jobId: string | null) {
  const { user, token } = useAuth();
  const [update, setUpdate] = useState<JobUpdate | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    if (!jobId || !user?.isPremium || !token) return;
    
    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      // Subscribe to job updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        jobId
      }));
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'job-update' && message.jobId === jobId) {
        setUpdate({
          status: message.status,
          progress: message.progress,
          currentStep: message.currentStep
        });
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    // Cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'unsubscribe',
          jobId
        }));
        ws.close();
      }
    };
  }, [jobId, user?.isPremium, token]);
  
  return update;
}
```

---

## 6. Worker Progress Reporting

### 6.1 FastAPI Progress Updates

```python
# fastapi_backend/app/services/progress_service.py

from redis import Redis
import json
from datetime import datetime

redis_client = Redis(
    host=os.getenv('REDIS_HOST'),
    port=int(os.getenv('REDIS_PORT')),
    password=os.getenv('REDIS_PASSWORD'),
    decode_responses=True
)

class ProgressReporter:
    """Report job progress to database and WebSocket clients."""
    
    def __init__(self, job_id: str, user_id: str):
        self.job_id = job_id
        self.user_id = user_id
    
    async def update(
        self,
        progress: int,
        current_step: str | None = None,
        status: str | None = None
    ):
        """Update job progress."""
        
        # Update database
        update_data = {'progress': progress}
        if current_step:
            update_data['currentStep'] = current_step
        if status:
            update_data['status'] = status
        
        await db.async_job.update(
            where={'id': self.job_id},
            data=update_data
        )
        
        # Publish to Redis for WebSocket
        redis_client.publish('job-updates', json.dumps({
            'jobId': self.job_id,
            'userId': self.user_id,
            'status': status,
            'progress': progress,
            'currentStep': current_step,
            'timestamp': datetime.now().isoformat()
        }))

# Usage in worker:
progress = ProgressReporter(job_id, user_id)

await progress.update(10, 'Downloading input file')
await progress.update(30, 'Converting format')
await progress.update(70, 'Optimizing output')
await progress.update(90, 'Uploading result')
await progress.update(100, 'Completed', status='COMPLETED')
```

---

## 7. Job UI Component

```tsx
// packages/ui-components/AsyncJobStatus.tsx

import { useJobPolling } from './hooks/useJobPolling';
import { useJobWebSocket } from './hooks/useJobWebSocket';
import { ProgressIndicator } from './ProgressIndicator';
import { DownloadResult } from './DownloadResult';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/lib/auth';

interface AsyncJobStatusProps {
  jobId: string;
}

export function AsyncJobStatus({ jobId }: AsyncJobStatusProps) {
  const { user } = useAuth();
  const cancelMutation = trpc.jobs.cancelJob.useMutation();
  
  // Use WebSocket for premium users, polling for free users
  const wsUpdate = useJobWebSocket(user?.isPremium ? jobId : null);
  const pollResult = useJobPolling(!user?.isPremium ? jobId : null);
  
  const status = wsUpdate?.status || pollResult.status;
  const progress = wsUpdate?.progress || pollResult.progress;
  const currentStep = wsUpdate?.currentStep || pollResult.currentStep;
  
  const handleCancel = async () => {
    await cancelMutation.mutateAsync({ jobId });
  };
  
  if (status === 'completed') {
    return (
      <div className="space-y-4">
        <ProgressIndicator
          status="completed"
          progress={100}
          message="Processing complete!"
        />
        
        <DownloadResult jobId={jobId} />
      </div>
    );
  }
  
  if (status === 'failed') {
    return (
      <ProgressIndicator
        status="failed"
        message={pollResult.error || 'Processing failed'}
      />
    );
  }
  
  if (status === 'cancelled') {
    return (
      <ProgressIndicator
        status="failed"
        message="Job was cancelled"
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <ProgressIndicator
        status={status === 'queued' ? 'queued' : 'processing'}
        progress={progress}
        message={currentStep || (status === 'queued' ? 'Waiting in queue...' : 'Processing...')}
      />
      
      {(status === 'queued' || status === 'processing') && (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={cancelMutation.isLoading}
        >
          Cancel Job
        </Button>
      )}
      
      {user?.isPremium && (
        <p className="text-xs text-muted-foreground">
          ✨ Premium: Real-time updates enabled
        </p>
      )}
    </div>
  );
}
```

---

## 8. Job Retry Logic

### 8.1 Automatic Retry

```python
# fastapi_backend/app/workers/retry_handler.py

from bullmq import Worker, Job
from app.services.progress_service import ProgressReporter

async def handle_job_failure(job: Job, error: Exception):
    """Handle job failure and determine if retry is needed."""
    
    job_data = job.data
    job_id = job_data['jobId']
    
    # Get current retry count
    db_job = await db.async_job.findUnique(where={'id': job_id})
    retry_count = db_job.retryCount + 1
    max_retries = db_job.maxRetries
    
    # Determine if error is retriable
    retriable_errors = [
        'NetworkError',
        'TimeoutError',
        'TemporaryError',
        'RateLimitError'
    ]
    
    is_retriable = any(err in str(type(error).__name__) for err in retriable_errors)
    
    if is_retriable and retry_count < max_retries:
        # Update retry count
        await db.async_job.update(
            where={'id': job_id},
            data={
                'retryCount': retry_count,
                'status': 'QUEUED'
            }
        )
        
        # Re-queue job
        raise Exception(f"Retry {retry_count}/{max_retries}")
    
    else:
        # Mark as failed
        await db.async_job.update(
            where={'id': job_id},
            data={
                'status': 'FAILED',
                'error': str(error),
                'completedAt': datetime.now()
            }
        )
        
        # Notify via WebSocket
        progress = ProgressReporter(job_id, job_data['userId'])
        await progress.update(0, status='FAILED')
```

---

**This specification defines the complete async job system with polling, WebSocket updates, progress tracking, and retry logic for all 83 async tools.**
