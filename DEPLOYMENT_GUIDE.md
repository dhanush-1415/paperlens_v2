# PaperLens v2.1 Complete Deployment Guide

This guide outlines the exact, step-by-step process to deploy the full PaperLens v2.1 stack, including the Next.js frontend, the FastAPI backend, the Celery background worker, and the Redis broker.

---

## Phase 1: Deploy Redis (Message Broker for Celery)
Your background worker needs a Redis database to queue and manage analysis jobs.

1. Go to [Upstash.com](https://upstash.com/) and log in.
2. Click **Create Database** (Serverless Redis). Name it something like `paperlens-redis`.
3. Once created, scroll down to the **Connect** section.
4. Select the **Node/Python** tab.
5. Copy the raw connection string. It will look like this: `rediss://default:password@endpoint.upstash.io:6379`.
6. Save this URL somewhere safe; you will need it for the next phase.

---

## Phase 2: Deploy Python Backend (FastAPI) & Worker (Celery)
We recommend using [Render.com](https://render.com) because it natively supports running a web API and a background worker side-by-side easily.

### Step A: Deploy the FastAPI Web Service
1. Go to your Render Dashboard and click **New > Web Service**.
2. Connect your GitHub account and select the `paperlens-v2.1` repository.
3. In the setup screen, configure the following:
   - **Branch:** `feat/fastapi-rag-migration` (or `main` if you merge it).
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables**:
   - `GEMINI_API_KEY` = *[Your Gemini API Key]*
   - `REDIS_URL` = *[The Upstash rediss:// URL from Phase 1]*
   - `CELERY_BROKER_URL` = *[The Upstash rediss:// URL from Phase 1]*
   - `NEXT_PUBLIC_APP_URL` = *https://paperlens.vercel.app (We will update this in Phase 4 once we know the final Vercel URL)*
5. Click **Create Web Service**. 

### Step B: Deploy the Celery Background Worker
1. Go back to your Render Dashboard and click **New > Background Worker**.
2. Connect the same repository and branch.
3. Configure the following:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `celery -A celery_worker.celery_app worker --loglevel=info`
4. Add the exact same **Environment Variables** you added in Step A.
5. Click **Create Background Worker**.

---

## Phase 3: Deploy Next.js Frontend
We will deploy the main web application to [Vercel](https://vercel.com).

1. Go to your Vercel Dashboard and click **Add New > Project**.
2. Import the `paperlens-v2.1` repository from GitHub.
3. Ensure the Framework Preset is set to **Next.js**.
4. Open the **Environment Variables** section and copy everything from your local `.env` file, specifically:
   - `NEXT_PUBLIC_SUPABASE_URL` = *[Your Supabase URL]*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *[Your Supabase Anon Key]*
   - `SUPABASE_SERVICE_ROLE_KEY` = *[Your Supabase Service Role Key]*
   - `DATABASE_URL` = *[Your Supabase Postgres Connection String]*
   - `NEXT_PUBLIC_FASTAPI_URL` = *[The URL Render generated for your Web Service in Phase 2A, e.g., https://paperlens-api.onrender.com]*
5. Click **Deploy**. Vercel will build and deploy your Next.js application.
6. Once finished, copy your new live Vercel URL (e.g., `https://paperlens-v2.vercel.app`).

---

## Phase 4: Final Wiring (The Webhook Handshake)
To ensure the Celery background worker can successfully send "Job Complete" signals back to your Next.js application, we must finalize the URLs.

1. Go back to **Render.com**.
2. Open your **Web Service** Settings > Environment Variables.
3. Update `NEXT_PUBLIC_APP_URL` to the exact live URL you got from Vercel in Phase 3.
4. Save the changes (Render will automatically redeploy).
5. Open your **Background Worker** Settings > Environment Variables.
6. Update `NEXT_PUBLIC_APP_URL` to the exact live Vercel URL as well.
7. Save the changes.

## Phase 5: Verification
1. Open your live Vercel application in your browser.
2. Sign in.
3. Go to the scanner and upload a **single document**. Wait for it to process; it should navigate you directly to the detailed `/document/[id]` report.
4. Go back to the scanner and upload **two or more documents** at once. It should queue the job, redirect you to `/vault`, and a few minutes later, your Executive Report will be visible.

**Congratulations! Your distributed PaperLens architecture is officially live in production.**
