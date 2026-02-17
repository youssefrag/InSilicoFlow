# 🧠 InSilicoFlow — Project Architecture (Microservices)

InSilicoFlow is a microservices-style virtual screening platform. Users upload a **molecule library** and a **target protein**, then run **QSAR** (fast scoring) and/or **Molecular Docking** (slow, compute-heavy simulation). Work is executed **asynchronously** using a Postgres-backed task queue.

---

## 🧩 Components

### 1) Frontend (optional, later)

- Upload molecules + protein
- Start a job (QSAR / Docking / Both)
- View progress + results table (ranked hits)

---

### 2) API Service — Node.js (Express) _(HTTP Edge)_

**Responsibilities**

- Exposes REST endpoints
- Validates and stores uploads (or generates upload URLs)
- Creates jobs + batches tasks
- Serves job status/progress
- Serves paginated results

**Key Endpoints**

- `POST /uploads/molecules`  
  Upload molecule library (CSV/SMILES/SDF) → returns `molecules_ref`
- `POST /uploads/protein`  
  Upload target protein (PDB) → returns `protein_ref`
- `POST /jobs`  
  Create job `{ mode: "QSAR" | "DOCK" | "BOTH", molecules_ref, protein_ref }` → returns `job_id`
- `GET /jobs/:id`  
  Returns job status + progress counters
- `GET /jobs/:id/results?limit=100&cursor=...`  
  Returns paginated results

---

### 3) Worker Service — Go _(Async Compute + Task Execution)_

**Responsibilities**

- Polls a Postgres-backed task queue
- Claims tasks safely using row locking (`FOR UPDATE SKIP LOCKED`)
- Executes simulated compute:
  - **QSAR_BATCH**: fast scoring for large batches
  - **DOCK_BATCH**: slower scoring per molecule / smaller batches
- Writes results + updates task status
- Supports retries + idempotency

**Worker Task Types**

- `QSAR_BATCH`  
  Input: list of molecules (IDs + SMILES)  
  Output: `qsar_score` per molecule
- `DOCK_BATCH`  
  Input: list of molecules + protein ref  
  Output: `docking_score` per molecule (+ optional pose artifact ref)

---

## 🗄️ Storage

### Postgres (System of Record + Task Queue)

Stores:

- **jobs**: job metadata + overall state
- **tasks**: queue items + retries + errors
- **results**: per-molecule scores (+ optional ranking)

### Object Storage (S3/MinIO) _(optional but recommended)_

Stores:

- raw upload files (molecules, proteins)
- optional artifacts (e.g., docking “poses”)
- batch outputs / logs

---

## 🔁 Execution Flow

### Step 1 — Upload Inputs

1. User uploads molecule library → `molecules_ref`
2. User uploads target protein (PDB) → `protein_ref`

### Step 2 — Create Job (Async)

1. Client calls `POST /jobs` with `{ mode, molecules_ref, protein_ref }`
2. Node API:
   - Inserts a `jobs` row (`status=QUEUED`)
   - Parses the molecule file (or reads IDs)
   - Splits into batches
   - Inserts `tasks` rows (`status=PENDING`)
3. API returns immediately with `job_id`

### Step 3 — Workers Process Tasks

1. Go worker claims a task atomically (DB locking)
2. Worker sets task to `RUNNING`
3. Worker executes:
   - QSAR: deterministic hash-based score (fast)
   - Docking: slower simulation (sleep/CPU burn) + score
4. Worker writes to `results` and sets task to `SUCCEEDED`
5. On failure: increments attempts, retries, or sets `FAILED`

### Step 4 — Progress + Results

- `GET /jobs/:id` returns:
  - job status
  - tasks completed / total
  - qsar_done / dock_done
- `GET /jobs/:id/results` returns paginated results

---

## 🧭 Job & Task States

### Job states

- `QUEUED` → tasks created, waiting for workers
- `RUNNING` → at least one task running
- `SUCCEEDED` → all tasks succeeded
- `FAILED` → unrecoverable failure after retries

### Task states

- `PENDING` → available to claim
- `RUNNING` → claimed by a worker
- `SUCCEEDED` → completed
- `FAILED` → exhausted retries / unrecoverable error

---

## 📊 Result Model

Each molecule may have:

- `qsar_score` (0–1 probability-like)
- `docking_score` (negative values, e.g. -4 to -12)
- `combined_score` (optional; computed for ranking)

Example ranking (demo):

- normalize docking score → 0–1
- `combined = 0.6 * qsar + 0.4 * docking_norm`

---
