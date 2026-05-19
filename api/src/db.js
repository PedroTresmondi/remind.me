import pg from "pg";

const { Pool } = pg;

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "remindme",
  };
}

export const pool = new Pool(getPoolConfig());

export function getDatabaseTarget() {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return `${url.hostname}:${url.port || "5432"}/${url.pathname.replace(/^\//, "")}`;
    } catch {
      return "DATABASE_URL";
    }
  }
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME || "remindme";
  return `${host}:${port}/${name}`;
}

export async function waitForDatabase(maxAttempts = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log(`[db] Conectado ao PostgreSQL em ${getDatabaseTarget()} (tentativa ${attempt})`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[db] Aguardando banco... ${attempt}/${maxAttempts}: ${message}`);
      if (attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function pingDatabase() {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}

const INIT_TASKS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);
`;

export async function initDatabase() {
  await pool.query(INIT_TASKS_TABLE_SQL);
  console.log("[db] Tabela tasks verificada/criada com sucesso");
}
