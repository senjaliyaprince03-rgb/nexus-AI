-- NexusAI database bootstrap
-- Executed once by PostgreSQL before Alembic runs.
-- The Docker entrypoint runs *.sql files in /docker-entrypoint-initdb.d/

-- Enable pgvector for embedding storage + similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp so gen_random_uuid() works without pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable btree_gin for composite GIN indexes (used by analytics queries)
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Set default search path
ALTER DATABASE nexusai SET search_path TO public;

-- Log that init ran successfully
DO $$
BEGIN
  RAISE NOTICE 'NexusAI: extensions initialized (vector, uuid-ossp, btree_gin)';
END $$;
