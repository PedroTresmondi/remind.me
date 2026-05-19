-- Schema simplificado para a API Docker (PostgreSQL local)
-- O frontend Next.js continua usando o Supabase em modo legado.

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);

INSERT INTO tasks (title, description, status)
SELECT
  'Bem-vindo ao Remind.me',
  'Tarefa de exemplo criada pelo init.sql (Docker)',
  'pending'
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);
