-- Create active_users table for tracking current online users
CREATE TABLE active_users (
  id BIGSERIAL PRIMARY KEY,
  visitor_id VARCHAR(100) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page VARCHAR(300) DEFAULT '/',
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_active_users_visitor_id ON active_users(visitor_id);
CREATE INDEX idx_active_users_last_seen ON active_users(last_seen);
CREATE INDEX idx_active_users_page ON active_users(page);

-- Auto-cleanup trigger to remove inactive users (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_inactive_users() 
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM active_users 
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_inactive_users
  AFTER INSERT OR UPDATE ON active_users
  EXECUTE FUNCTION cleanup_inactive_users();
