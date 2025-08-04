CREATE TABLE user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'recipe_import', 'recipe_adapt'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_created_at ON user_usage(created_at);

-- Function to count monthly usage
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID, p_action_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN COUNT(*)
  FROM user_usage
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;
