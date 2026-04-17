-- Runs after Supabase's baked-in migrations finish creating the auth, storage,
-- and authenticator roles. Aligns their passwords with POSTGRES_PASSWORD so
-- GoTrue / PostgREST / storage can actually log in.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator            WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin      WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin   WITH PASSWORD :'pgpass';
