-- One durable, cumulative count per browser and public profile.
CREATE TABLE IF NOT EXISTS micontacto.profile_unique_views (
 profile_id uuid NOT NULL REFERENCES micontacto.profiles(id) ON DELETE CASCADE,
 visitor_hash text NOT NULL,
 first_seen_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(profile_id,visitor_hash)
);
CREATE INDEX IF NOT EXISTS profile_unique_views_profile_idx ON micontacto.profile_unique_views(profile_id);
