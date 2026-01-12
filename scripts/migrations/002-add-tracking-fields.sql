-- Add tracking fields to orders table for shipment tracking
-- Migration: 002-add-tracking-fields

-- Add tracking number, carrier, and estimated delivery fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Add comments for documentation
COMMENT ON COLUMN orders.tracking_number IS 'Shipment tracking number from carrier (e.g., USPS, FedEx, UPS)';
COMMENT ON COLUMN orders.carrier IS 'Shipping carrier name (e.g., USPS, FedEx, UPS, DHL)';
COMMENT ON COLUMN orders.estimated_delivery IS 'Estimated delivery date/time';
