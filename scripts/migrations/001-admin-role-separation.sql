-- Migration: Admin Role Separation and Product Ownership
-- Description: Adds product ownership tracking, admin activity logs, and product analytics
-- Date: 2026-01-11

-- ============================================================================
-- 1. Add product ownership tracking
-- ============================================================================

-- Add created_by and updated_by columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- Update existing products to be owned by first admin (or set to NULL)
-- Run this manually after migration if needed:
-- UPDATE products SET created_by = (SELECT id FROM profiles WHERE role = 'ADMIN' LIMIT 1) WHERE created_by IS NULL;

-- Add index for faster queries by owner
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_updated_by ON products(updated_by);

-- ============================================================================
-- 2. Create admin activity logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'product_created', 'product_updated', 'product_deleted', 'order_updated', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'product', 'order', 'category', 'settings', etc.
  resource_id VARCHAR(100), -- ID of the resource (product_id, order_id, etc.)
  details JSONB, -- Additional details about the action
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource ON admin_activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_activity_logs(created_at DESC);

-- ============================================================================
-- 3. Product analytics table already exists - just add missing columns if needed
-- ============================================================================

-- The product_analytics table already exists with structure:
-- id uuid, product_id uuid, date date, views, unique_views, add_to_cart_count, purchases, revenue, etc.
-- We'll add summary columns for overall product stats (not daily)

-- Create a new table for overall product analytics summary
CREATE TABLE IF NOT EXISTS product_analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  
  -- Lifetime metrics
  total_views INTEGER DEFAULT 0,
  total_unique_views INTEGER DEFAULT 0,
  total_add_to_cart INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  
  -- Calculated rates
  conversion_rate NUMERIC DEFAULT 0, -- purchases / views
  cart_conversion_rate NUMERIC DEFAULT 0, -- purchases / add_to_cart
  
  -- Time tracking
  last_viewed_at TIMESTAMP,
  last_purchased_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_analytics_summary_product_id ON product_analytics_summary(product_id);

-- ============================================================================
-- 4. Create product view tracking table (for detailed analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_views (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous users
  session_id VARCHAR(100), -- For tracking anonymous users
  
  -- View details
  time_spent_seconds INTEGER DEFAULT 0,
  scrolled_to_bottom BOOLEAN DEFAULT false,
  clicked_add_to_cart BOOLEAN DEFAULT false,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session_id ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- ============================================================================
-- 5. Create admin analytics summary table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_analytics (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Product metrics
  total_products_created INTEGER DEFAULT 0,
  total_products_active INTEGER DEFAULT 0,
  total_products_out_of_stock INTEGER DEFAULT 0,
  
  -- Sales metrics
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  total_items_sold INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_product_views INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(5, 2) DEFAULT 0.00, -- Percentage
  
  -- Time tracking
  last_product_upload TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint - one analytics record per admin
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_analytics_admin_id ON admin_analytics(admin_id);

-- ============================================================================
-- 6. Add functions to update analytics automatically
-- ============================================================================

-- Function to update product analytics summary when a view is recorded
CREATE OR REPLACE FUNCTION update_product_analytics_on_view()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_analytics_summary (product_id, total_views, last_viewed_at, updated_at)
  VALUES (NEW.product_id, 1, NEW.viewed_at, NOW())
  ON CONFLICT (product_id) 
  DO UPDATE SET
    total_views = product_analytics_summary.total_views + 1,
    last_viewed_at = NEW.viewed_at,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product views
DROP TRIGGER IF EXISTS trigger_update_product_analytics_on_view ON product_views;
CREATE TRIGGER trigger_update_product_analytics_on_view
AFTER INSERT ON product_views
FOR EACH ROW
EXECUTE FUNCTION update_product_analytics_on_view();

-- Function to update admin analytics when products are created
CREATE OR REPLACE FUNCTION update_admin_analytics_on_product()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.created_by IS NOT NULL THEN
    INSERT INTO admin_analytics (admin_id, total_products_created, total_products_active, last_product_upload, last_updated)
    VALUES (NEW.created_by, 1, CASE WHEN NEW.stock > 0 THEN 1 ELSE 0 END, NOW(), NOW())
    ON CONFLICT (admin_id)
    DO UPDATE SET
      total_products_created = admin_analytics.total_products_created + 1,
      total_products_active = admin_analytics.total_products_active + CASE WHEN NEW.stock > 0 THEN 1 ELSE 0 END,
      last_product_upload = NOW(),
      last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product creation
DROP TRIGGER IF EXISTS trigger_update_admin_analytics_on_product ON products;
CREATE TRIGGER trigger_update_admin_analytics_on_product
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION update_admin_analytics_on_product();

-- ============================================================================
-- 7. Create helper views for easy querying
-- ============================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS products_with_analytics CASCADE;
DROP VIEW IF EXISTS admin_performance_summary CASCADE;

-- View: Products with their creator info and analytics
CREATE VIEW products_with_analytics AS
SELECT 
  p.*,
  creator.email as creator_email,
  creator.name as creator_name,
  pas.total_views,
  pas.total_add_to_cart,
  pas.total_purchases,
  pas.total_revenue,
  pas.conversion_rate,
  pas.last_viewed_at,
  pas.last_purchased_at
FROM products p
LEFT JOIN profiles creator ON p.created_by = creator.id
LEFT JOIN product_analytics_summary pas ON p.id = pas.product_id;

-- View: Admin performance summary
CREATE VIEW admin_performance_summary AS
SELECT 
  p.id as admin_id,
  p.email,
  p.name,
  aa.total_products_created,
  aa.total_products_active,
  aa.total_revenue,
  aa.total_orders,
  aa.total_items_sold,
  aa.avg_conversion_rate,
  aa.last_product_upload,
  COUNT(DISTINCT al.id) as total_actions,
  MAX(al.created_at) as last_activity
FROM profiles p
LEFT JOIN admin_analytics aa ON p.id = aa.admin_id
LEFT JOIN admin_activity_logs al ON p.id = al.admin_id
WHERE p.role IN ('ADMIN', 'SUPERADMIN')
GROUP BY p.id, p.email, p.name, aa.total_products_created, aa.total_products_active, 
         aa.total_revenue, aa.total_orders, aa.total_items_sold, aa.avg_conversion_rate, aa.last_product_upload;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Notes:
-- 1. Existing products will have NULL for created_by - update manually if needed
-- 2. Analytics tables start with zero counts - they'll populate as events occur
-- 3. Admin activity logging needs to be implemented in API routes
-- 4. Product view tracking needs client-side implementation

COMMENT ON TABLE admin_activity_logs IS 'Tracks all actions performed by admin users for audit and analytics';
COMMENT ON TABLE product_analytics IS 'Aggregated analytics data for each product';
COMMENT ON TABLE product_views IS 'Individual product view events with detailed metrics';
COMMENT ON TABLE admin_analytics IS 'Summary analytics for each admin user';
