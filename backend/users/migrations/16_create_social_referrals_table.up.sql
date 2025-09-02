-- Create social referrals tracking table

CREATE TABLE social_referrals (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'facebook', 'linkedin', etc.
  visitor_id VARCHAR(100) NOT NULL,
  visitor_ip VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50), -- Mobile, Desktop, Tablet
  country VARCHAR(100), -- From IP geolocation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_social_referrals_platform ON social_referrals(platform);
CREATE INDEX idx_social_referrals_visitor_id ON social_referrals(visitor_id);
CREATE INDEX idx_social_referrals_created_at ON social_referrals(created_at);
CREATE INDEX idx_social_referrals_device_type ON social_referrals(device_type);
CREATE INDEX idx_social_referrals_country ON social_referrals(country);
