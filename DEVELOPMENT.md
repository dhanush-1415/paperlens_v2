# PaperLens v2.1 Development Guide

This document outlines how to set up, run, and develop the PaperLens v2.1 platform locally. The project consists of a **Next.js** frontend/full-stack application and a **FastAPI + Celery** backend for heavy AI document processing.

## Prerequisites
- **Node.js**: v18 or later (v20+ recommended)
- **Python**: 3.10 or later
- **Docker**: Used to run Redis and local database instances.
- **Supabase CLI**: If you plan to run Supabase locally (`npm i -g supabase`).

---

## 1. Environment Setup

### Root Workspace (Next.js)
1. Copy `.env.example` to `.env.local` or `.env` in the root directory.
   ```bash
   cp .env.example .env
   ```
2. Fill in your environment variables, especially:
   - Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
   - Database URLs (`DATABASE_URL`, `DIRECT_URL` for Prisma)
   - Resend API keys for emails (`RESEND_API_KEY`)

### Backend Workspace (Python/FastAPI)
1. In the `backend` directory, create or modify the `.env` file to match the backend needs:
   - OpenAI or Anthropic API Keys (`OPENAI_API_KEY`)
   - Redis URL for Celery (`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`)
   - Supabase keys (if the worker needs to communicate directly with Supabase)

---

## 2. Infrastructure (Database & Redis)

The backend Celery workers rely on Redis to manage background tasks.
1. Navigate to the `backend` folder and start ONLY the Redis service using Docker Compose (this avoids port conflicts if you run FastAPI locally later):
   ```bash
   cd backend
   docker compose up -d redis
   ```
   *Note: Redis is mapped to port `6380` on your host machine to avoid conflicts.*
2. If you need to apply schema changes to your database, run Prisma migrations from the **root directory**:
   ```bash
   npx prisma generate
   npx prisma db push # or npx prisma migrate dev
   ```

---

## 3. Running the Next.js Application

The Next.js app serves as the main web interface, authentication handler, and API router.
From the **root directory**:
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 4. Running the FastAPI Backend & Celery Worker

The Python backend is dedicated to running LangChain/LangGraph tasks and heavy document parsing.

Open two separate terminal windows for the backend.

**Terminal A: FastAPI Server**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (On Windows use: venv\Scripts\activate)

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The FastAPI server will be available at `http://localhost:8000`.*

**Terminal B: Celery Worker**
```bash
cd backend
source venv/bin/activate
celery -A celery_worker.celery_app worker --loglevel=info
```
*This worker will pick up queued document analysis jobs off the Redis broker.*

---

## 5. Common Scripts & Workflows

### Code Quality & Testing (Root)
Ensure your frontend code is clean before committing:
```bash
npm run typecheck    # Run TypeScript compiler checks
npm run lint         # Run ESLint
npm run test         # Run Vitest test suite
npm run verify       # Run all checks (typecheck, lint, test, and build)
```

### Email Automation & Cron Jobs
- **Templates**: Found in `src/lib/emails/`. We use Resend to send HTML emails.
- **Cron Jobs**: Vercel triggers daily digests, drip campaigns, and lifecycle emails by making GET requests to `src/app/api/cron/`. They are authenticated using a `CRON_SECRET` Bearer token.

### Prisma Studio
To inspect the database locally:
```bash
npx prisma studio
```

---

## Architectural Notes
- **Server Actions**: Frontend logic fetching and mutating data should generally use Next.js Server Actions located in `src/server/actions/`.
- **Backend Handoff**: The Next.js API delegates document analysis by sending a request to the FastAPI server, which in turn enqueues a Celery job. The Celery job updates the database (or Supabase) asynchronously upon completion.
