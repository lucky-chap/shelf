CREATE TABLE guest_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(200),
  message TEXT NOT NULL,
  emoji VARCHAR(60),
  visitor_ip TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_guest_entries_user_id ON guest_entries(user_id);
CREATE INDEX idx_guest_entries_approved ON guest_entries(user_id, is_approved);
CREATE INDEX idx_guest_entries_created_at ON guest_entries(created_at);
