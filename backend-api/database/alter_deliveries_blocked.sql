-- Add blocked_at column to deliveries table for obstacle detection (TC-007)
-- Run this script on existing databases to add obstacle tracking capability

ALTER TABLE deliveries ADD COLUMN blocked_at DATETIME NULL;

-- Optional: Add index for efficient querying of blocked deliveries
CREATE INDEX idx_deliveries_blocked_at ON deliveries(blocked_at);
