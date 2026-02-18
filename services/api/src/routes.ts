import { Router } from "express";
import { pool } from "./db";

export const router = Router();

// GET health
router.get("/health", async (_req, res) => {
  try {
    const r = await pool.query<{ ok: number }>("SELECT 1 as ok");
    res.json({ status: "ok", db: r.rows[0].ok === 1 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    res.status(500).json({ status: "error", error: msg });
  }
});

// POST /jobs

// GET /jobs

// GET /jobs/:id

// GET /jobs/:id/result
