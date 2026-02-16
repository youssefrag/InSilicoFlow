const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ status: "ok", db: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
