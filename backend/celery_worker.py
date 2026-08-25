import os
from celery import Celery, chord
import json
from pydantic import BaseModel, Field
import requests
from dotenv import load_dotenv
from document_processor import extract_document_content
from agent_rag import run_agent_analysis

load_dotenv()

# Initialize Celery app
# Defaults to localhost Redis, but can be overridden in env
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "paperlens_tasks",
    broker=redis_url,
    backend=redis_url
)

# Apply task throttling / rate limiting to avoid LLM API 429s
celery_app.conf.update(
    task_annotations={
        'celery_worker.analyze_single_document_task': {'rate_limit': '5/s'}
    }
)

class ExecutiveReport(BaseModel):
    summary: str = Field(description="High level summary of all analyzed documents")
    top_entities: list[str] = Field(description="List of top key terms, companies, or technologies found across all documents")
    risk_assessment: str = Field(description="Overall risk assessment based on aggregated findings")

@celery_app.task(bind=True)
def generate_executive_report_task(self, map_results: list, job_id: str):
    """
    REDUCE STEP: Consolidates the results of all Map tasks.
    Programmatically extracts insights and uses LLM to format the final report.
    """
    print(f"[Worker] Reduce phase started for job {job_id} with {len(map_results)} results.")
    
    # 1. Programmatic Consolidation (Rank/Score)
    successful_docs = [r for r in map_results if r.get("status") == "success"]
    failed_docs = [r for r in map_results if r.get("status") == "error"]
    
    combined_summaries = "\\n---\\n".join([
        f"Doc {r.get('document_id')}: {r.get('agent_summary', '')}" 
        for r in successful_docs[:20] # Limit to top 20 to avoid context window explosion
    ])
    
    # 2. Final LLM Pass for Executive Report
    # We use Google GenAI directly to adhere to the Pydantic schema
    from langchain_google_genai import ChatGoogleGenerativeAI
    import os
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro", 
        temperature=0.1, 
        google_api_key=os.getenv("GEMINI_API_KEY")
    ).with_structured_output(ExecutiveReport)
    
    prompt = f"Analyze the following document summaries and generate a cohesive executive report.\\n\\nSummaries:\\n{combined_summaries}"
    
    try:
        if combined_summaries:
            report_obj = llm.invoke(prompt)
            final_report = report_obj.model_dump()
        else:
            final_report = {"summary": "No data extracted.", "top_entities": [], "risk_assessment": "Unknown"}
    except Exception as e:
        print(f"[Worker] Error generating executive report: {e}")
        final_report = {"error": str(e)}
        
    print(f"[Worker] Final report generated for job {job_id}")
    
    # Notify Next.js Webhook to save report and mark complete
    next_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    try:
        requests.post(f"{next_url}/api/webhooks/jobs/complete", json={
            "jobId": job_id,
            "executiveReport": final_report
        })
    except Exception as webhook_err:
        print(f"[Worker] Error hitting complete webhook: {webhook_err}")
    
    return {
        "job_id": job_id,
        "total_processed": len(map_results),
        "success_count": len(successful_docs),
        "error_count": len(failed_docs),
        "executive_report": final_report
    }

@celery_app.task(bind=True, max_retries=3)
def analyze_single_document_task(self, document_id: str, file_url: str, filename: str, job_id: str):
    """
    MAP STEP: Analyzes a single document in parallel and increments progress.
    """
    print(f"[Worker] Processing single document: {filename}")
    try:
        content = extract_document_content(file_url, filename)
        
        agent_result = "No text extracted."
        if content["type"] == "text" and content.get("text"):
            # Map Step: Run Agentic RAG on the document text
            agent_result = run_agent_analysis(content["text"])
        elif content["type"] == "vision":
            # For Vision, we would send the images to Gemini Vision model
            # For this MVP phase, we just mock the vision fallback
            agent_result = "Vision analysis completed for scanned document."
            
        return {
            "document_id": document_id,
            "status": "success",
            "content_type": content["type"],
            "length": len(content.get("text", "")),
            "images_count": len(content.get("images", [])),
            "agent_summary": agent_result
        }
    except Exception as e:
        print(f"[Worker] Error processing {filename}: {e}")
        result = {
            "document_id": document_id,
            "status": "error",
            "error": str(e)
        }
    finally:
        # Increment job progress in Next.js backend
        next_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
        try:
            requests.post(f"{next_url}/api/webhooks/jobs/increment", json={"jobId": job_id})
        except Exception as webhook_err:
            print(f"[Worker] Error hitting increment webhook: {webhook_err}")
            
    return result

@celery_app.task(bind=True, max_retries=3)
def analyze_documents_task(self, job_id: str, documents: list):
    """
    Background worker that handles the two-step Map-Reduce pipeline.
    """
    print(f"Starting bulk analysis job {job_id} for {len(documents)} documents.")
    
    # Trigger Map tasks in parallel, followed by Reduce task
    map_tasks = [
        analyze_single_document_task.s(doc['documentId'], doc['fileUrl'], doc['filename'], job_id) 
        for doc in documents
    ]
    
    reduce_task = generate_executive_report_task.s(job_id)
    
    workflow = chord(map_tasks)(reduce_task)
    
    return f"Job {job_id} Map-Reduce workflow queued. Chord ID: {workflow.id}"
