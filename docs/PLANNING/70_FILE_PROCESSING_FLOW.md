# 📁 File Processing Flow Specification

**Affected Tools:** 298-379 (82 FILE_CONVERTER tools)  
**Storage:** Cloudflare R2  
**Upload Service:** Uploadthing  
**Processing:** FastAPI Python backend  

---

## 1. Overview

This specification defines the complete file upload, virus scan, processing, and download flow for all 82 FILE_CONVERTER tools.

**Flow Stages:**
1. **Client Upload** → Uploadthing (virus scan)
2. **Temporary Storage** → R2 (24-hour TTL)
3. **Job Submission** → FastAPI creates async job
4. **Processing** → Python workers convert files
5. **Result Storage** → R2 (3-hour TTL)
6. **Download** → Signed URL with expiration

---

## 2. File Upload Flow

### 2.1 Uploadthing Configuration

```typescript
// packages/uploadthing/src/config.ts

import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/lib/auth';

const f = createUploadthing();

export const uploadRouter = {
  // Image files (Tools 298-320)
  imageUploader: f({
    image: {
      maxFileSize: '10MB',
      maxFileCount: 1
    }
  })
    .middleware(async ({ req }) => {
      const user = await auth.getUser(req);
      
      // Check permissions
      if (!user) throw new Error('Unauthorized');
      
      // Check coins balance for premium conversions
      const toolId = req.headers.get('x-tool-id');
      const tool = await db.tool.findUnique({ where: { id: Number(toolId) } });
      
      if (tool?.coinCost > 0 && user.coins < tool.coinCost) {
        throw new Error('Insufficient coins');
      }
      
      return { userId: user.id, toolId: tool?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete:', file.url);
      
      // Store file metadata in database
      await db.uploadedFile.create({
        data: {
          userId: metadata.userId,
          toolId: metadata.toolId,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      return { fileKey: file.key };
    }),
  
  // PDF files (Tools 330-345)
  pdfUploader: f({
    pdf: {
      maxFileSize: '50MB',
      maxFileCount: 1
    }
  })
    .middleware(async ({ req }) => {
      const user = await auth.getUser(req);
      if (!user) throw new Error('Unauthorized');
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.uploadedFile.create({
        data: {
          userId: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      
      return { fileKey: file.key };
    }),
  
  // Document files (Tools 350-365)
  documentUploader: f({
    blob: {
      maxFileSize: '100MB',
      maxFileCount: 1
    }
  })
    .middleware(async ({ req }) => {
      const user = await auth.getUser(req);
      if (!user) throw new Error('Unauthorized');
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.uploadedFile.create({
        data: {
          userId: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      
      return { fileKey: file.key };
    }),
  
  // Audio files (Tools 366-370)
  audioUploader: f({
    audio: {
      maxFileSize: '200MB',
      maxFileCount: 1
    }
  })
    .middleware(async ({ req }) => {
      const user = await auth.getUser(req);
      if (!user) throw new Error('Unauthorized');
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.uploadedFile.create({
        data: {
          userId: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      
      return { fileKey: file.key };
    }),
  
  // Video files (Tools 371-375)
  videoUploader: f({
    video: {
      maxFileSize: '500MB',
      maxFileCount: 1
    }
  })
    .middleware(async ({ req }) => {
      const user = await auth.getUser(req);
      if (!user) throw new Error('Unauthorized');
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.uploadedFile.create({
        data: {
          userId: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      
      return { fileKey: file.key };
    })
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
```

**Virus Scanning:** Uploadthing automatically scans files with ClamAV. Infected files are rejected with 400 error.

---

### 2.2 Client Upload Component

```tsx
// packages/ui-components/FileUploadWithProgress.tsx

import { useUploadThing } from '@/lib/uploadthing';
import { useState } from 'react';
import { FileUploader } from './FileUploader';
import { ProgressIndicator } from './ProgressIndicator';

interface FileUploadWithProgressProps {
  endpoint: 'imageUploader' | 'pdfUploader' | 'documentUploader' | 'audioUploader' | 'videoUploader';
  toolId: number;
  onUploadComplete: (fileKey: string) => void;
  onError: (error: string) => void;
}

export function FileUploadWithProgress({
  endpoint,
  toolId,
  onUploadComplete,
  onError
}: FileUploadWithProgressProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { startUpload } = useUploadThing(endpoint, {
    headers: {
      'x-tool-id': String(toolId)
    },
    onClientUploadComplete: (res) => {
      setUploading(false);
      setProgress(100);
      
      if (res[0]?.serverData?.fileKey) {
        onUploadComplete(res[0].serverData.fileKey);
      }
    },
    onUploadError: (error) => {
      setUploading(false);
      setProgress(0);
      onError(error.message);
    },
    onUploadProgress: (p) => {
      setProgress(p);
    }
  });
  
  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    
    await startUpload([file]);
  };
  
  return (
    <div className="space-y-4">
      <FileUploader onUpload={handleUpload} disabled={uploading} />
      
      {uploading && (
        <ProgressIndicator
          status="processing"
          progress={progress}
          message={`Uploading... ${progress}%`}
        />
      )}
    </div>
  );
}
```

---

## 3. R2 Storage Configuration

### 3.1 R2 Client Setup

```typescript
// packages/storage/src/r2-client.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!, // https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!; // 'productivity-app-files'

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  expirationHours: number = 24
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: {
        'expiration-hours': String(expirationHours),
        'uploaded-at': new Date().toISOString()
      }
    })
  );
  
  return key;
}

export async function getFromR2(key: string): Promise<ReadableStream> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })
  );
  
  if (!response.Body) {
    throw new Error('File not found');
  }
  
  return response.Body as ReadableStream;
}

export async function getSignedDownloadUrl(
  key: string,
  expirationSeconds: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  return await getSignedUrl(r2Client, command, { expiresIn: expirationSeconds });
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })
  );
}
```

---

### 3.2 File Naming Convention

```typescript
// packages/storage/src/utils.ts

import { nanoid } from 'nanoid';

export function generateFileKey(
  userId: string,
  toolId: number,
  originalFilename: string,
  type: 'input' | 'output'
): string {
  const ext = originalFilename.split('.').pop();
  const timestamp = Date.now();
  const random = nanoid(10);
  
  return `${type}/${userId}/${toolId}/${timestamp}-${random}.${ext}`;
}

// Example: "input/user_123/298/1704201600000-abc123defg.png"
// Example: "output/user_123/298/1704201700000-xyz789hijk.webp"
```

---

## 4. Job Submission & Processing

### 4.1 tRPC Job Submission Procedure

```typescript
// packages/api/src/routers/file-tools.ts

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { imageConverterSchema } from '@/validators';
import { TRPCError } from '@trpc/server';

export const fileToolsRouter = router({
  convertImage: protectedProcedure
    .input(imageConverterSchema)
    .mutation(async ({ input, ctx }) => {
      const { fileKey, targetFormat, quality, resize, rotate, flip } = input;
      
      // Verify file exists and belongs to user
      const file = await ctx.db.uploadedFile.findFirst({
        where: {
          fileKey,
          userId: ctx.user.id,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found or expired'
        });
      }
      
      // Check tool permissions and coins
      const tool = await ctx.db.tool.findUnique({ where: { id: file.toolId! } });
      
      if (tool?.coinCost > 0) {
        if (ctx.user.coins < tool.coinCost) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient coins'
          });
        }
        
        // Deduct coins
        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { coins: { decrement: tool.coinCost } }
        });
      }
      
      // Create job in database
      const job = await ctx.db.asyncJob.create({
        data: {
          userId: ctx.user.id,
          toolId: file.toolId!,
          status: 'queued',
          inputFileKey: fileKey,
          parameters: JSON.stringify({ targetFormat, quality, resize, rotate, flip }),
          expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
        }
      });
      
      // Send job to FastAPI backend
      const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/jobs/image-convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FASTAPI_API_KEY}`
        },
        body: JSON.stringify({
          jobId: job.id,
          inputFileKey: fileKey,
          targetFormat,
          quality,
          resize,
          rotate,
          flip
        })
      });
      
      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit job to processing backend'
        });
      }
      
      return {
        jobId: job.id,
        status: 'queued',
        message: 'Job submitted successfully'
      };
    })
});
```

---

### 4.2 FastAPI Job Processing

```python
# fastapi_backend/app/routers/jobs.py

from fastapi import APIRouter, HTTPException, Depends
from app.services.image_service import ImageConversionService
from app.services.r2_service import R2Service
from app.models.job import JobSubmission
from app.database import db
import asyncio

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])

@router.post("/image-convert")
async def submit_image_conversion(
    job: JobSubmission,
    auth_token: str = Depends(verify_api_key)
):
    """Submit image conversion job to processing queue."""
    
    # Add job to processing queue
    await job_queue.enqueue(
        process_image_conversion,
        job_id=job.jobId,
        input_key=job.inputFileKey,
        target_format=job.targetFormat,
        quality=job.quality,
        resize=job.resize,
        rotate=job.rotate,
        flip=job.flip
    )
    
    return {"status": "queued", "jobId": job.jobId}


async def process_image_conversion(
    job_id: str,
    input_key: str,
    target_format: str,
    quality: int,
    resize: dict | None,
    rotate: int,
    flip: str
):
    """Process image conversion job."""
    
    try:
        # Update job status to processing
        await db.async_job.update(
            where={"id": job_id},
            data={"status": "processing", "startedAt": datetime.now()}
        )
        
        # Download input file from R2
        r2_service = R2Service()
        input_file = await r2_service.download_file(input_key)
        
        # Process image
        image_service = ImageConversionService()
        output_bytes = await image_service.convert(
            input_bytes=input_file,
            target_format=target_format,
            quality=quality,
            resize=resize,
            rotate=rotate,
            flip=flip
        )
        
        # Upload output to R2
        output_key = f"output/{job_id}/{nanoid()}.{target_format}"
        await r2_service.upload_file(
            key=output_key,
            body=output_bytes,
            content_type=f"image/{target_format}",
            expiration_hours=3
        )
        
        # Update job with result
        await db.async_job.update(
            where={"id": job_id},
            data={
                "status": "completed",
                "outputFileKey": output_key,
                "completedAt": datetime.now(),
                "progress": 100
            }
        )
        
    except Exception as e:
        # Update job with error
        await db.async_job.update(
            where={"id": job_id},
            data={
                "status": "failed",
                "error": str(e),
                "completedAt": datetime.now()
            }
        )
        
        raise
```

---

### 4.3 Image Conversion Service

```python
# fastapi_backend/app/services/image_service.py

from PIL import Image
from io import BytesIO
import pillow_heif

class ImageConversionService:
    """Service for image format conversion and manipulation."""
    
    def __init__(self):
        # Register HEIF plugin for HEIC support
        pillow_heif.register_heif_opener()
    
    async def convert(
        self,
        input_bytes: bytes,
        target_format: str,
        quality: int = 90,
        resize: dict | None = None,
        rotate: int = 0,
        flip: str = 'none'
    ) -> bytes:
        """Convert image to target format with transformations."""
        
        # Open image
        img = Image.open(BytesIO(input_bytes))
        
        # Convert to RGB if necessary (for JPEG)
        if target_format.lower() in ['jpeg', 'jpg'] and img.mode in ['RGBA', 'P']:
            img = img.convert('RGB')
        
        # Resize
        if resize:
            img = self._resize_image(img, resize)
        
        # Rotate
        if rotate > 0:
            img = img.rotate(rotate, expand=True)
        
        # Flip
        if flip == 'horizontal':
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        elif flip == 'vertical':
            img = img.transpose(Image.FLIP_TOP_BOTTOM)
        elif flip == 'both':
            img = img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.FLIP_TOP_BOTTOM)
        
        # Save to bytes
        output = BytesIO()
        save_kwargs = {'format': target_format.upper()}
        
        if target_format.lower() in ['jpeg', 'jpg', 'webp']:
            save_kwargs['quality'] = quality
            save_kwargs['optimize'] = True
        
        if target_format.lower() == 'png':
            save_kwargs['optimize'] = True
        
        img.save(output, **save_kwargs)
        
        return output.getvalue()
    
    def _resize_image(self, img: Image.Image, resize_config: dict) -> Image.Image:
        """Resize image according to configuration."""
        
        width = resize_config.get('width')
        height = resize_config.get('height')
        fit = resize_config.get('fit', 'contain')
        
        if not width and not height:
            return img
        
        original_width, original_height = img.size
        
        # Calculate target dimensions
        if width and height:
            target_size = (width, height)
        elif width:
            ratio = width / original_width
            target_size = (width, int(original_height * ratio))
        else:  # height only
            ratio = height / original_height
            target_size = (int(original_width * ratio), height)
        
        # Apply fit strategy
        if fit == 'cover':
            img = Image.ops.fit(img, target_size, Image.LANCZOS)
        elif fit == 'contain':
            img.thumbnail(target_size, Image.LANCZOS)
        elif fit == 'fill':
            img = img.resize(target_size, Image.LANCZOS)
        
        return img
```

---

## 5. Job Status Polling

See [71_ASYNC_JOB_SPEC.md](71_ASYNC_JOB_SPEC.md) for complete polling implementation.

---

## 6. File Download

### 6.1 Generate Signed URL

```typescript
// packages/api/src/routers/file-tools.ts

export const fileToolsRouter = router({
  getDownloadUrl: protectedProcedure
    .input(z.object({
      jobId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const job = await ctx.db.asyncJob.findFirst({
        where: {
          id: input.jobId,
          userId: ctx.user.id,
          status: 'completed',
          expiresAt: { gt: new Date() }
        }
      });
      
      if (!job || !job.outputFileKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or not completed'
        });
      }
      
      // Generate signed URL (1 hour expiration)
      const downloadUrl = await getSignedDownloadUrl(job.outputFileKey, 3600);
      
      return {
        downloadUrl,
        fileName: job.outputFileName || 'download',
        expiresAt: new Date(Date.now() + 3600 * 1000)
      };
    })
});
```

---

### 6.2 Client Download Component

```tsx
// packages/ui-components/DownloadResult.tsx

import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface DownloadResultProps {
  jobId: string;
}

export function DownloadResult({ jobId }: DownloadResultProps) {
  const { data, isLoading } = trpc.fileTools.getDownloadUrl.useQuery({ jobId });
  
  const handleDownload = () => {
    if (!data?.downloadUrl) return;
    
    // Trigger download
    const a = document.createElement('a');
    a.href = data.downloadUrl;
    a.download = data.fileName;
    a.click();
  };
  
  const handleOpenInNewTab = () => {
    if (!data?.downloadUrl) return;
    window.open(data.downloadUrl, '_blank');
  };
  
  if (isLoading) {
    return <div>Loading download link...</div>;
  }
  
  if (!data) {
    return <div>Download not available</div>;
  }
  
  return (
    <div className="flex gap-2">
      <Button onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
      
      <Button variant="outline" onClick={handleOpenInNewTab}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Open
      </Button>
      
      <p className="text-xs text-muted-foreground mt-2">
        Link expires in 1 hour
      </p>
    </div>
  );
}
```

---

## 7. Cleanup & Expiration

### 7.1 Automated Cleanup Cron Job

```typescript
// packages/api/src/cron/cleanup-files.ts

import { db } from '@/lib/db';
import { deleteFromR2 } from '@/lib/r2-client';

export async function cleanupExpiredFiles() {
  console.log('Starting file cleanup...');
  
  // Find expired uploaded files
  const expiredUploads = await db.uploadedFile.findMany({
    where: {
      expiresAt: { lt: new Date() }
    },
    select: { fileKey: true, id: true }
  });
  
  // Delete from R2
  for (const file of expiredUploads) {
    try {
      await deleteFromR2(file.fileKey);
      console.log(`Deleted expired upload: ${file.fileKey}`);
    } catch (error) {
      console.error(`Failed to delete ${file.fileKey}:`, error);
    }
  }
  
  // Delete from database
  await db.uploadedFile.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  
  // Find expired async jobs
  const expiredJobs = await db.asyncJob.findMany({
    where: {
      expiresAt: { lt: new Date() },
      outputFileKey: { not: null }
    },
    select: { outputFileKey: true, id: true }
  });
  
  // Delete output files from R2
  for (const job of expiredJobs) {
    try {
      if (job.outputFileKey) {
        await deleteFromR2(job.outputFileKey);
        console.log(`Deleted expired output: ${job.outputFileKey}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${job.outputFileKey}:`, error);
    }
  }
  
  // Delete expired jobs from database
  await db.asyncJob.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  
  console.log(`Cleanup complete: ${expiredUploads.length} uploads, ${expiredJobs.length} outputs deleted`);
}

// Run every hour
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);
```

---

## 8. Error Handling

### 8.1 Upload Errors

```typescript
// Common upload errors and handling

const uploadErrorMessages: Record<string, string> = {
  'FILE_TOO_LARGE': 'File exceeds maximum size limit',
  'INVALID_FILE_TYPE': 'File type not supported for this tool',
  'VIRUS_DETECTED': 'File contains malicious content and was rejected',
  'UPLOAD_FAILED': 'Upload failed. Please try again',
  'INSUFFICIENT_COINS': 'Not enough coins for this conversion',
  'UNAUTHORIZED': 'Please sign in to upload files'
};

function handleUploadError(error: Error): string {
  const errorCode = error.message.toUpperCase().replace(/\s+/g, '_');
  return uploadErrorMessages[errorCode] || error.message;
}
```

### 8.2 Processing Errors

```python
# fastapi_backend/app/services/error_handler.py

class ProcessingError(Exception):
    """Base class for processing errors."""
    pass

class UnsupportedFormatError(ProcessingError):
    """File format not supported."""
    pass

class CorruptFileError(ProcessingError):
    """File is corrupted or invalid."""
    pass

class ConversionFailedError(ProcessingError):
    """Conversion operation failed."""
    pass

def handle_processing_error(error: Exception) -> dict:
    """Convert exception to user-friendly error response."""
    
    error_map = {
        UnsupportedFormatError: "File format not supported for this conversion",
        CorruptFileError: "File is corrupted or cannot be read",
        ConversionFailedError: "Conversion failed. Please try with a different file",
        FileNotFoundError: "File not found or expired",
        PermissionError: "Insufficient permissions for this operation"
    }
    
    error_type = type(error)
    message = error_map.get(error_type, str(error))
    
    return {
        "error": message,
        "error_code": error_type.__name__,
        "details": str(error)
    }
```

---

**This specification defines the complete file processing pipeline from upload through conversion to download for all 82 FILE_CONVERTER tools.**
