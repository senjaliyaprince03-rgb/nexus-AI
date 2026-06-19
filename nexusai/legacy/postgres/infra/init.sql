-- Runs once on first container start, before any app migrations.
-- The pgvector/pgvector:pg16 image ships the extension files;
-- we just need to enable it in the nexusai database.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
