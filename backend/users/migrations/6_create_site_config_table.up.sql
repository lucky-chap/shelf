CREATE TABLE site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  title VARCHAR(200) NOT NULL DEFAULT 'My Landing Page',
  description TEXT DEFAULT 'Welcome to my creator landing page',
  theme_color VARCHAR(7) DEFAULT '#3B82F6',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#000000',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_config CHECK (id = 1)
);

-- Insert default configuration
INSERT INTO site_config (id) VALUES (1);
