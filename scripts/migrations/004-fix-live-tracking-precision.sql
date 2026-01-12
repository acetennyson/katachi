-- Fix coordinate precision for live tracking
-- Migration: 004-fix-live-tracking-precision

-- Drop the table if it exists (since it's likely empty or just created)
DROP TABLE IF EXISTS order_live_tracking;

-- Recreate with correct precision
CREATE TABLE order_live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Route information (DECIMAL(9,6) allows -999.999999 to 999.999999)
  -- This covers latitude (-90 to 90) and longitude (-180 to 180) with precision
  start_lat DECIMAL(9, 6) NOT NULL,
  start_lng DECIMAL(9, 6) NOT NULL,
  start_address TEXT,
  
  end_lat DECIMAL(9, 6) NOT NULL,
  end_lng DECIMAL(9, 6) NOT NULL,
  end_address TEXT,
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  total_paused_duration INTEGER DEFAULT 0,
  
  -- Current status
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  current_lat DECIMAL(9, 6),
  current_lng DECIMAL(9, 6),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  
  UNIQUE(order_id)
);

-- Create indexes
CREATE INDEX idx_order_live_tracking_order_id ON order_live_tracking(order_id);
CREATE INDEX idx_order_live_tracking_status ON order_live_tracking(status);

-- Add comments
COMMENT ON TABLE order_live_tracking IS 'Real-time package tracking with map visualization';
COMMENT ON COLUMN order_live_tracking.status IS 'ACTIVE: Moving, PAUSED: Temporarily stopped, COMPLETED: Delivered, CANCELLED: Tracking cancelled';
COMMENT ON COLUMN order_live_tracking.total_paused_duration IS 'Total minutes the tracking has been paused';
