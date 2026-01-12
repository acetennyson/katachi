-- Add live tracking system for real-time package location on map
-- Migration: 003-add-live-tracking

-- Create live tracking table
CREATE TABLE IF NOT EXISTS order_live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Route information
  start_lat DECIMAL(9, 6) NOT NULL,
  start_lng DECIMAL(9, 6) NOT NULL,
  start_address TEXT,
  
  end_lat DECIMAL(9, 6) NOT NULL,
  end_lng DECIMAL(9, 6) NOT NULL,
  end_address TEXT,
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL, -- Total estimated duration
  paused_at TIMESTAMPTZ, -- When tracking was paused
  resumed_at TIMESTAMPTZ, -- When tracking was resumed
  total_paused_duration INTEGER DEFAULT 0, -- Total minutes paused
  
  -- Current status
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, COMPLETED, CANCELLED
  current_lat DECIMAL(9, 6),
  current_lng DECIMAL(9, 6),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- Admin who created the tracking
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  
  UNIQUE(order_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_live_tracking_order_id ON order_live_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_live_tracking_status ON order_live_tracking(status);

-- Add comments
COMMENT ON TABLE order_live_tracking IS 'Real-time package tracking with map visualization';
COMMENT ON COLUMN order_live_tracking.status IS 'ACTIVE: Moving, PAUSED: Temporarily stopped, COMPLETED: Delivered, CANCELLED: Tracking cancelled';
COMMENT ON COLUMN order_live_tracking.total_paused_duration IS 'Total minutes the tracking has been paused (to calculate correct position)';
