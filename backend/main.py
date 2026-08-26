from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery_worker import analyze_documents_task

app = FastAPI(title="PaperLens Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisJobRequest(BaseModel):
    job_id: str
    documents: list[dict] # { documentId: str, fileUrl: str }

class ExtractRequest(BaseModel):
    file_url: str
    filename: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "paperlens-backend"}

@app.post("/api/v1/jobs/analyze")
def trigger_analysis_job(request: AnalysisJobRequest, background_tasks: BackgroundTasks):
    try:
        # We use Celery for actual distributed queueing.
        # Calling .delay() queues the task in Redis for the worker to pick up.
        task = analyze_documents_task.delay(request.job_id, request.documents)
        return {"status": "accepted", "message": "Bulk analysis job queued.", "task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/extract")
def extract_text(request: ExtractRequest):
    try:
        from document_processor import extract_document_content
        content = extract_document_content(request.file_url, request.filename)
        return {"status": "success", "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
