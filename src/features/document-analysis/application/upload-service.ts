import { createBrowserSupabaseClient } from '@/shared/contexts/auth-context';
import { uuid } from '@/shared/utils/id';

export interface UploadBatchResult {
  jobId: string;
  documents: { documentId: string; fileUrl: string; filename: string }[];
}

export async function uploadDocumentsBatch(
  files: File[],
  userId: string,
  folderId?: string
): Promise<UploadBatchResult> {
  const supabase = createBrowserSupabaseClient();
  const jobId = uuid();
  const documents = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error(`Failed to upload ${file.name}:`, await res.text());
      throw new Error(`Upload failed for ${file.name}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || `Upload failed for ${file.name}`);
    }

    // The API route creates a document record and uploads to Supabase.
    // It returns the document with storagePath. We need to construct the public URL or pass the path.
    // Assuming backend FastAPI can download via the public URL.
    const { data: urlData } = createBrowserSupabaseClient().storage
      .from('vault-documents')
      .getPublicUrl(json.document.storagePath);

    documents.push({
      documentId: json.document.id,
      fileUrl: urlData.publicUrl,
      filename: file.name,
    });
  }

  // Create the database record before triggering Celery
  try {
    await fetch('/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, totalCount: documents.length })
    });
  } catch (err) {
    console.error("Failed to create AnalysisJob record in database:", err);
  }

  return { jobId, documents };
}

export async function triggerFastApiAnalysisJob(batchResult: UploadBatchResult) {
  // Hardcoded for local dev. In production, use env var NEXT_PUBLIC_FASTAPI_URL
  const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/api/v1/jobs/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: batchResult.jobId,
      documents: batchResult.documents
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to trigger analysis job: ${err}`);
  }

  return await response.json();
}
