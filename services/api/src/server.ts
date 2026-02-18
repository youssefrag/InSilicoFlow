import express from "express";
import { router } from "./routes";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use(router);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API listening on ${port}`));
