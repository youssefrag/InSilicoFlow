CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE jobs (
  id UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type     TEXT NOT NULL, -- 'qsar' | 'docking'
  status       TEXT NOT NULL DEFAULT 'queued', -- queued | running | done
  input JSONB  NOT NULL DEFAULT '{}'::jsonb, -- what the user submitted
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,

  CONSTRAINT jobs_type_check
    CHECK (job_type IN ('qsar', 'docking')),

  CONSTRAINT jobs_status_check
    CHECK (status IN ('queued', 'running', 'done'))
);

CREATE INDEX jobs_status_created_at_idx ON jobs(status, created_at DESC);

CREATE TABLE results (
  job_id UUID   PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  output JSONB  NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);