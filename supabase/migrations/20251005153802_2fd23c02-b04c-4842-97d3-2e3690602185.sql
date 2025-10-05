-- Add keyword click counters to user_stats table
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS hubble_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS chandra_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS jwst_clicks integer DEFAULT 0;

COMMENT ON COLUMN public.user_stats.hubble_clicks IS 'Number of times user clicked Hubble-related keywords';
COMMENT ON COLUMN public.user_stats.chandra_clicks IS 'Number of times user clicked Chandra-related keywords';
COMMENT ON COLUMN public.user_stats.jwst_clicks IS 'Number of times user clicked James Webb-related keywords';