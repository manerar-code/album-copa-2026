-- Enable pg_cron extension (requires Supabase Pro plan or above)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests from pg_cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule process-pending-deletions Edge Function daily at 02:00 UTC
-- Replace <project_ref> with the actual Supabase project reference
-- The service_role key is retrieved from the database settings at runtime

SELECT cron.schedule(
  'process-pending-deletions',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<project_ref>.supabase.co/functions/v1/process-pending-deletions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
      )
    ) AS request_id;
  $$
);

-- Verify schedule was created:
-- SELECT * FROM cron.job;

-- To remove the schedule:
-- SELECT cron.unschedule('process-pending-deletions');
