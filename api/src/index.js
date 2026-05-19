import express from "express";
import {
  getDatabaseTarget,
  initDatabase,
  pingDatabase,
  pool,
  waitForDatabase,
} from "./db.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "API Remind.me está funcionando.",
    service: "remind.me-api",
    mode: "docker-postgres",
  });
});

app.get("/health", async (_req, res) => {
  try {
    const connected = await pingDatabase();
    if (!connected) {
      return res.status(503).json({
        status: "error",
        database: "disconnected",
        service: "remind.me-api",
      });
    }

    return res.json({
      status: "ok",
      database: "connected",
      service: "remind.me-api",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[health] Falha ao consultar o banco:", message);
    return res.status(503).json({
      status: "error",
      database: "disconnected",
      service: "remind.me-api",
      error: message,
    });
  }
});

app.get("/tasks", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, status, due_date, created_at, updated_at
       FROM tasks
       ORDER BY created_at DESC`
    );
    return res.json({ tasks: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[tasks] GET falhou:", message);
    return res.status(500).json({ error: message });
  }
});

app.post("/tasks", async (req, res) => {
  const { title, description, status, due_date } = req.body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Campo 'title' é obrigatório." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, due_date)
       VALUES ($1, $2, COALESCE($3, 'pending'), $4)
       RETURNING id, title, description, status, due_date, created_at, updated_at`,
      [
        title.trim(),
        description?.trim() || null,
        status || null,
        due_date || null,
      ]
    );
    return res.status(201).json({ task: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[tasks] POST falhou:", message);
    return res.status(500).json({ error: message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const { title, description, status, due_date } = req.body ?? {};

  try {
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           due_date = COALESCE($5, due_date),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, description, status, due_date, created_at, updated_at`,
      [id, title?.trim() ?? null, description ?? null, status ?? null, due_date ?? null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Tarefa não encontrada." });
    }

    return res.json({ task: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[tasks] PUT falhou:", message);
    return res.status(500).json({ error: message });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }

  try {
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Tarefa não encontrada." });
    }
    return res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[tasks] DELETE falhou:", message);
    return res.status(500).json({ error: message });
  }
});

async function start() {
  console.log("[api] Iniciando Remind.me API...");
  console.log(`[api] PORT=${port}`);
  console.log(`[api] Destino do banco: ${getDatabaseTarget()}`);

  await waitForDatabase();
  await initDatabase();

  app.listen(port, "0.0.0.0", () => {
    console.log(`[api] Servidor ouvindo em http://0.0.0.0:${port}`);
    console.log("[api] Endpoints: GET /, GET /health, GET /tasks, POST /tasks");
  });
}

start().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[api] Falha ao iniciar:", message);
  process.exit(1);
});
