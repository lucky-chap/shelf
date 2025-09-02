-- Create analytics tables for visitor tracking

-- Page views tracking
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  page VARCHAR(200) NOT NULL,
  visitor_id VARCHAR(100) NOT NULL, -- Client-generated UUID for tracking
  visitor_ip VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50), -- Mobile, Desktop, Tablet
  country VARCHAR(100), -- From IP geolocation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link clicks tracking
CREATE TABLE link_clicks (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100) NOT NULL,
  visitor_ip VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_page ON page_views(page);
CREATE INDEX idx_page_views_device_type ON page_views(device_type);
CREATE INDEX idx_page_views_country ON page_views(country);

CREATE INDEX idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX idx_link_clicks_visitor_id ON link_clicks(visitor_id);
CREATE INDEX idx_link_clicks_created_at ON link_clicks(created_at);
CREATE INDEX idx_link_clicks_device_type ON link_clicks(device_type);
CREATE INDEX idx_link_clicks_country ON link_clicks(country);
