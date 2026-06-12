CREATE TABLE account_deletion_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_delete_at TIMESTAMPTZ NOT NULL,
  cancelled_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ
);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own deletion request"
  ON account_deletion_requests
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
