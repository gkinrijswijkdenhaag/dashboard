-- Default roles template used across all services
CREATE TABLE IF NOT EXISTS default_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  role_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate with the standard GKIN service roles
INSERT INTO default_roles (name, role_order) VALUES
  ('Voorganger', 1),
  ('Ouderling van dienst', 2),
  ('Collecte', 3),
  ('Preekvertaling', 4),
  ('Muzikale begeleiding', 5),
  ('Muzikale bijdrage', 6),
  ('Voorzangers', 7),
  ('Lector', 8),
  ('Beamer', 9),
  ('Streaming', 10),
  ('Geluid', 11),
  ('Kindernevendienst', 12),
  ('Ontvangstteam', 13),
  ('Koffiedienst', 14)
ON CONFLICT (name) DO NOTHING;
