-- Add optional start_date and end_date fields to links table for scheduling
ALTER TABLE links 
  ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient date range queries
CREATE INDEX idx_links_start_date ON links(start_date);
CREATE INDEX idx_links_end_date ON links(end_date);
CREATE INDEX idx_links_active_schedule ON links(is_active, start_date, end_date);
