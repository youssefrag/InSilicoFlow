import express, { Request, Response } from "express";
import { Pool } from "pg";

const app = express();
app.use(express.json());

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ status: "ok", db: r.rows[0].ok === 1 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unkown_error";
    res.status(500).json({ status: "error", error: message });
  }
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`API is listening on ${port} ✅`);
});
