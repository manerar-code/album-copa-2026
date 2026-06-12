-- Enable RLS on user_collections
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own collection"
  ON user_collections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable RLS on user_albums
ALTER TABLE user_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own albums"
  ON user_albums FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
