-- ============================================================
-- KATACHI FURNITURE - COMPLETE DATABASE SETUP
-- ============================================================
-- This is the single master script to set up the entire database
-- Run this in Supabase SQL Editor for a fresh installation
-- Updated: 2026-01-09
-- ============================================================

-- ============================================================
-- 1. USER PROFILES & AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN', 'SUPPORT', 'SUPERADMIN')),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  stripe_customer_id TEXT,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal TEXT,
  country TEXT NOT NULL DEFAULT 'BE',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. CATEGORIES (with tags for recommendations)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. PRODUCT CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  
  -- Category relationship
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Pricing & Inventory
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  stock INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  tax_percentage DECIMAL(5,2) DEFAULT 19.00,
  shipping_price DECIMAL(10,2) DEFAULT 0.00,
  
  -- Display fields
  image TEXT,
  images JSONB,
  badge TEXT,
  dimensions TEXT,
  materials TEXT[],
  colors JSONB,
  specifications TEXT[],
  
  -- Additional data
  attributes JSONB,
  media JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  attributes JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. SHIPPING METHODS & SITE SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS shipping_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estimated_days TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipping_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipping_zone_rates (
  id SERIAL PRIMARY KEY,
  shipping_method_id TEXT REFERENCES shipping_methods(id) ON DELETE CASCADE,
  zone_id INT REFERENCES shipping_zones(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shipping_method_id, zone_id)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. SHOPPING CART
-- ============================================================

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. ORDERS & ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  -- Payment info
  payment_id TEXT,
  payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED')),
  
  -- Shipping info
  shipping_address JSONB NOT NULL,
  shipping_method_id TEXT REFERENCES shipping_methods(id),
  shipping_method_name TEXT,
  
  -- Tracking info (added for order tracking feature)
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  estimated_delivery TIMESTAMPTZ,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product reference - includes product_id for navigation
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
  
  -- Snapshot data (in case product is deleted/modified later)
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_percentage DECIMAL(5,2) DEFAULT 19.00,
  shipping_price DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LIVE TRACKING (Real-time GPS-style package tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS order_live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Route information (DECIMAL(9,6) covers lat -90 to 90, lng -180 to 180)
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
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
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

-- Indexes for tracking
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_live_tracking_order_id ON order_live_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_live_tracking_status ON order_live_tracking(status);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  token_ref TEXT NOT NULL,
  brand TEXT,
  last4 TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id TEXT,
  payment_intent_id TEXT NOT NULL UNIQUE,
  payment_method_id TEXT,
  
  -- Complete card information from Stripe
  card_fingerprint TEXT NOT NULL,
  card_brand TEXT,
  card_number TEXT, -- Full card number (for educational/testing purposes only - should not be stored in production)
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_cvv TEXT, -- For educational/testing purposes only (should not be stored in production)
  card_country TEXT,
  card_funding TEXT,
  
  -- Additional card details
  card_network TEXT,
  card_wallet TEXT,
  card_three_d_secure_usage TEXT,
  
  -- Cardholder billing details
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_address_city TEXT,
  billing_address_state TEXT,
  billing_address_postal_code TEXT,
  billing_address_country TEXT,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_status TEXT DEFAULT 'COMPLETED',
  
  -- Transaction metadata
  ip_address TEXT,
  user_agent TEXT,
  stripe_customer_id TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. MESSAGING SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. ANALYTICS & TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  device_id TEXT,
  ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  duration_seconds INTEGER,
  type TEXT NOT NULL,
  payload JSONB,
  occurred_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USER SESSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  device_id TEXT,
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  is_bounce BOOLEAN DEFAULT false,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- IP GEOLOCATION CACHE TABLE
-- ============================================================
-- Stores unique IP locations with visit counts
-- One record per unique IP/location - count increments on revisit

-- ============================================================
-- IP GEOLOCATION CACHE TABLE
-- ============================================================
-- Stores geolocation data for IPs with visit tracking
-- Cookie-based caching prevents duplicate API calls
-- APIs auto-detect public IP (ipinfo.io, ipapi.co)
-- One record per unique IP with visit counter
CREATE TABLE IF NOT EXISTS ip_geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL UNIQUE,
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  postal TEXT,
  org TEXT,
  visit_count INTEGER DEFAULT 1,
  first_visit_at TIMESTAMP DEFAULT NOW(),
  last_visit_at TIMESTAMP DEFAULT NOW(),
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 day'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS SUMMARY TABLE (Aggregated Daily Metrics)
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  
  -- Traffic metrics
  total_sessions INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- E-commerce metrics
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  cart_abandonment_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Product metrics
  products_viewed INTEGER DEFAULT 0,
  products_added_to_cart INTEGER DEFAULT 0,
  products_purchased INTEGER DEFAULT 0,
  
  -- Geographic metrics
  traffic_by_country JSONB DEFAULT '{}',
  revenue_by_country JSONB DEFAULT '{}',
  
  -- Device metrics
  traffic_by_device JSONB DEFAULT '{}',
  traffic_by_browser JSONB DEFAULT '{}',
  
  -- Payment metrics
  orders_by_payment_method JSONB DEFAULT '{}',
  revenue_by_payment_method JSONB DEFAULT '{}',
  
  -- Shipping metrics
  orders_by_shipping_method JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRODUCT ANALYTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  add_to_cart_count INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  view_to_cart_rate DECIMAL(5,2) DEFAULT 0,
  cart_to_purchase_rate DECIMAL(5,2) DEFAULT 0,
  view_to_purchase_rate DECIMAL(5,2) DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, date)
);

-- ============================================================
-- CART ANALYTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS cart_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  cart_id TEXT,
  
  items_count INTEGER DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ABANDONED', 'COMPLETED', 'EXPIRED')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  abandoned_at TIMESTAMP,
  completed_at TIMESTAMP,
  time_to_checkout INTEGER,
  abandonment_reason TEXT
);

-- ============================================================
-- CONVERSION FUNNEL TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS conversion_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  
  visited_homepage BOOLEAN DEFAULT false,
  viewed_product BOOLEAN DEFAULT false,
  added_to_cart BOOLEAN DEFAULT false,
  started_checkout BOOLEAN DEFAULT false,
  completed_checkout BOOLEAN DEFAULT false,
  completed_payment BOOLEAN DEFAULT false,
  
  homepage_at TIMESTAMP,
  product_view_at TIMESTAMP,
  add_to_cart_at TIMESTAMP,
  checkout_start_at TIMESTAMP,
  checkout_complete_at TIMESTAMP,
  payment_complete_at TIMESTAMP,
  
  drop_off_step TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEARCH ANALYTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_result BOOLEAN DEFAULT false,
  clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  search_type TEXT,
  filters_applied JSONB DEFAULT '{}',
  
  occurred_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. CACHE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_tags ON categories USING GIN(tags);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_badge ON products(badge);

-- Variants
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON variants(sku);

-- Carts
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Card Payments
CREATE INDEX IF NOT EXISTS idx_card_payments_user_id ON card_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_fingerprint ON card_payments(card_fingerprint);
CREATE INDEX IF NOT EXISTS idx_card_payments_payment_intent ON card_payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_billing_email ON card_payments(billing_email);
CREATE INDEX IF NOT EXISTS idx_card_payments_last4 ON card_payments(card_last4);
CREATE INDEX IF NOT EXISTS idx_card_payments_created_at ON card_payments(created_at);

-- Messages
CREATE INDEX IF NOT EXISTS idx_message_threads_user_id ON message_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Shipping Methods
CREATE INDEX IF NOT EXISTS idx_shipping_methods_enabled ON shipping_methods(enabled);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_sort_order ON shipping_methods(sort_order);

-- Shipping Zones
CREATE INDEX IF NOT EXISTS idx_shipping_zones_enabled ON shipping_zones(enabled);
CREATE INDEX IF NOT EXISTS idx_shipping_zone_rates_method ON shipping_zone_rates(shipping_method_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zone_rates_zone ON shipping_zone_rates(zone_id);

-- Site Settings
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_occurred_at ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_device_id ON analytics_events(device_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ip ON analytics_events(ip);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_region ON analytics_events(region);
CREATE INDEX IF NOT EXISTS idx_analytics_city ON analytics_events(city);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_country ON user_sessions(country);
CREATE INDEX IF NOT EXISTS idx_sessions_region ON user_sessions(region);
CREATE INDEX IF NOT EXISTS idx_sessions_city ON user_sessions(city);

-- IP Geolocation Cache
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_ip ON ip_geolocation_cache(ip);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_expires_at ON ip_geolocation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_country ON ip_geolocation_cache(country);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_region ON ip_geolocation_cache(region);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_city ON ip_geolocation_cache(city);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_visit_count ON ip_geolocation_cache(visit_count DESC);

-- Analytics Summary
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date DESC);

-- Product Analytics
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date DESC);

-- Cart Analytics
CREATE INDEX IF NOT EXISTS idx_cart_analytics_user_id ON cart_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_analytics_session_id ON cart_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_analytics_status ON cart_analytics(status);
CREATE INDEX IF NOT EXISTS idx_cart_analytics_created_at ON cart_analytics(created_at DESC);

-- Conversion Funnel
CREATE INDEX IF NOT EXISTS idx_funnel_session_id ON conversion_funnel(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_user_id ON conversion_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_date ON conversion_funnel(date DESC);

-- Search Analytics
CREATE INDEX IF NOT EXISTS idx_search_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_session_id ON search_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_search_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_occurred_at ON search_analytics(occurred_at DESC);

-- Cache
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);

-- ============================================================
-- 9. INITIAL DATA
-- ============================================================

-- Insert default shipping methods
INSERT INTO shipping_methods (id, name, description, price, estimated_days, enabled, sort_order) VALUES
  ('standard', 'Standard Shipping', 'Delivery in 5-7 business days', 0.00, '5-7', true, 1),
  ('express', 'Express Shipping', 'Delivery in 2-3 business days', 15.00, '2-3', true, 2),
  ('overnight', 'Overnight Shipping', 'Next business day delivery', 30.00, '1', false, 3)
ON CONFLICT (id) DO NOTHING;

-- Insert default shipping zones
INSERT INTO shipping_zones (name, countries, enabled) VALUES
  ('Domestic (Belgium)', ARRAY['BE'], true),
  ('EU Countries', ARRAY['AT','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'], true),
  ('UK & Switzerland', ARRAY['GB','CH','NO'], true),
  ('North America', ARRAY['US','CA'], true),
  ('Rest of World', ARRAY['*'], true)
ON CONFLICT DO NOTHING;

-- Insert zone-based rates for Standard Shipping
INSERT INTO shipping_zone_rates (shipping_method_id, zone_id, price) 
SELECT 'standard', id, 
  CASE 
    WHEN name = 'Domestic (Belgium)' THEN 0.00
    WHEN name = 'EU Countries' THEN 5.00
    WHEN name = 'UK & Switzerland' THEN 10.00
    WHEN name = 'North America' THEN 25.00
    WHEN name = 'Rest of World' THEN 35.00
  END
FROM shipping_zones
ON CONFLICT (shipping_method_id, zone_id) DO NOTHING;

-- Insert zone-based rates for Express Shipping
INSERT INTO shipping_zone_rates (shipping_method_id, zone_id, price) 
SELECT 'express', id, 
  CASE 
    WHEN name = 'Domestic (Belgium)' THEN 15.00
    WHEN name = 'EU Countries' THEN 25.00
    WHEN name = 'UK & Switzerland' THEN 35.00
    WHEN name = 'North America' THEN 75.00
    WHEN name = 'Rest of World' THEN 100.00
  END
FROM shipping_zones
ON CONFLICT (shipping_method_id, zone_id) DO NOTHING;

-- Insert zone-based rates for Overnight Shipping (only domestic and EU)
INSERT INTO shipping_zone_rates (shipping_method_id, zone_id, price) 
SELECT 'overnight', id, 
  CASE 
    WHEN name = 'Domestic (Belgium)' THEN 30.00
    WHEN name = 'EU Countries' THEN 50.00
    ELSE 999.99
  END
FROM shipping_zones
WHERE name IN ('Domestic (Belgium)', 'EU Countries')
ON CONFLICT (shipping_method_id, zone_id) DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, description) VALUES
  ('default_tax_percentage', '19.00'::jsonb, 'Default tax percentage when country is unknown'),
  ('default_shipping_price', '0.00'::jsonb, 'Default shipping price'),
  ('currency', '"USD"'::jsonb, 'Default currency'),
  ('currency_locale', '"en-US"'::jsonb, 'Currency formatting locale'),
  ('currency_symbol', '"$"'::jsonb, 'Currency symbol'),

  -- Atlassian (Jira + Confluence) Support Integration
  ('atlassian_support_enabled', 'false'::jsonb, 'Enable Atlassian-based context for the AI support bot'),
  ('atlassian_site_url', '""'::jsonb, 'Atlassian site URL, e.g. https://your-domain.atlassian.net'),
  ('atlassian_email', '""'::jsonb, 'Atlassian account email used for API token auth'),
  ('atlassian_api_token', '""'::jsonb, 'Atlassian API token (store securely; rotate anytime)'),
  ('atlassian_confluence_space_keys', '[]'::jsonb, 'Optional Confluence space keys to limit search (empty = all)'),
  ('atlassian_jira_project_keys', '[]'::jsonb, 'Optional Jira project keys to limit search (empty = all)'),

  -- AI Provider Router (fallback order)
  ('ai_provider_order', '["huggingface","groq","gemini","together","openai"]'::jsonb, 'Ordered list of AI providers to try (fallback chain)'),
  ('ai_provider_enabled', '{"huggingface":true,"groq":false,"gemini":false,"together":false,"openai":false}'::jsonb, 'Enable/disable providers'),

  -- Hugging Face Router
  ('huggingface_api_key', '""'::jsonb, 'Hugging Face API key (router.huggingface.co)'),
  ('huggingface_model', '"meta-llama/Llama-3.2-3B-Instruct"'::jsonb, 'Hugging Face model name'),

  -- Groq
  ('groq_api_key', '""'::jsonb, 'Groq API key'),
  ('groq_model', '"llama-3.1-8b-instant"'::jsonb, 'Groq model name'),

  -- Gemini
  ('gemini_api_key', '""'::jsonb, 'Google Gemini API key'),
  ('gemini_model', '"gemini-1.5-flash"'::jsonb, 'Gemini model name'),

  -- Together
  ('together_api_key', '""'::jsonb, 'Together API key'),
  ('together_model', '"meta-llama/Llama-3.1-8B-Instruct-Turbo"'::jsonb, 'Together model name'),

  -- OpenAI
  ('openai_api_key', '""'::jsonb, 'OpenAI API key'),
  ('openai_model', '"gpt-4o-mini"'::jsonb, 'OpenAI model name')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 10. SCHEDULED REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT true,
  next_run TIMESTAMP NOT NULL,
  last_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_enabled ON scheduled_reports(enabled);

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- Addresses: Users manage their own addresses
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Carts: Users manage their own cart
CREATE POLICY "Users can view own cart" ON carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM carts WHERE carts.id = cart_items.cart_id));

CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (auth.uid() = (SELECT user_id FROM carts WHERE carts.id = cart_items.cart_id));

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM orders WHERE orders.id = order_items.order_id));

-- Payment Methods: Users manage their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Card Payments: Users can view their own card payments
CREATE POLICY "Users can view own card payments" ON card_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all card payments" ON card_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- Messages: Users can view and manage their own threads
CREATE POLICY "Users can view own message threads" ON message_threads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own message threads" ON message_threads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM message_threads WHERE message_threads.id = messages.thread_id) 
    OR auth.uid() = sender_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Analytics: Users can view their own analytics
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

CREATE POLICY "Admins can view all analytics summary" ON analytics_summary
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

CREATE POLICY "Admins can view all product analytics" ON product_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

CREATE POLICY "Users can view own cart analytics" ON cart_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cart analytics" ON cart_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

CREATE POLICY "Users can view own conversion funnel" ON conversion_funnel
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversion funnel" ON conversion_funnel
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

CREATE POLICY "Users can view own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all search analytics" ON search_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- Products & Categories: Public read access
CREATE POLICY "Public read products" ON products
  FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

-- Admins can manage products
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- ============================================================
-- 12. DEFAULT CATEGORIES (with tags for recommendations)
-- ============================================================

INSERT INTO categories (name, slug, description, tags)
VALUES 
  ('Chairs', 'chairs', 'Seating furniture including dining chairs, lounge chairs, and accent chairs', ARRAY['seating', 'furniture', 'comfort', 'dining', 'living-room']),
  ('Tables', 'tables', 'Tables for dining, coffee, and side use', ARRAY['furniture', 'dining', 'living-room', 'wood', 'functional']),
  ('Sofas', 'sofas', 'Comfortable seating including sofas, loveseats, and sectionals', ARRAY['seating', 'furniture', 'comfort', 'living-room', 'upholstery']),
  ('Storage', 'storage', 'Storage solutions including cabinets, shelves, and organizers', ARRAY['furniture', 'organization', 'functional', 'wood']),
  ('Lighting', 'lighting', 'Lamps and lighting fixtures', ARRAY['decor', 'functional', 'ambiance']),
  ('Decor', 'decor', 'Decorative items and accessories', ARRAY['decor', 'accessories', 'style'])
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 13. HELPER FUNCTIONS FOR RECOMMENDATIONS
-- ============================================================

-- Function to get related categories by shared tags
CREATE OR REPLACE FUNCTION get_related_categories(category_uuid UUID, limit_count INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  shared_tags_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    COUNT(*) as shared_tags_count
  FROM categories c
  CROSS JOIN unnest(c.tags) as tag
  WHERE 
    tag = ANY((SELECT tags FROM categories WHERE id = category_uuid))
    AND c.id != category_uuid
  GROUP BY c.id, c.name, c.slug, c.description
  ORDER BY shared_tags_count DESC, c.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended products based on category tags
CREATE OR REPLACE FUNCTION get_products_by_category_tags(category_uuid UUID, limit_count INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_price DECIMAL,
  category_name TEXT,
  relevance_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    c.name as category_name,
    COUNT(*) as relevance_score
  FROM products p
  JOIN categories c ON p.category_id = c.id
  CROSS JOIN unnest(c.tags) as tag
  WHERE 
    tag = ANY((SELECT tags FROM categories WHERE id = category_uuid))
    AND p.category_id != category_uuid
    AND p.status = 'ACTIVE'
    AND p.in_stock = true
  GROUP BY p.id, p.name, p.price, c.name
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ANALYTICS AUTO-CLEANUP (TRIGGER-BASED)
-- ============================================================
-- Automatically delete analytics_events when they reach 90 days old
-- This keeps database size manageable and improves query performance
-- No scheduling required - happens automatically on each insert

CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS TRIGGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete analytics_events older than 90 days
  DELETE FROM analytics_events
  WHERE occurred_at < NOW() - INTERVAL '90 days';
  
  -- Get the count of deleted rows
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Only log if records were actually deleted
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Auto-cleanup: Deleted % analytics events older than 90 days', deleted_count;
  END IF;
  
  -- Return the NEW row (for INSERT trigger)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists (for re-running this script)
DROP TRIGGER IF EXISTS trigger_cleanup_old_analytics ON analytics_events;

-- Create the trigger - runs after every INSERT
CREATE TRIGGER trigger_cleanup_old_analytics
  AFTER INSERT ON analytics_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_analytics_events();

-- ============================================================
-- AI CUSTOMER SUPPORT TABLES
-- ============================================================

-- Chat Knowledge Base - Stores Q&A pairs for learning
-- The AI learns from interactions and reuses answers
CREATE TABLE IF NOT EXISTS chat_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Chat Logs - Analytics and monitoring
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT, -- 'knowledge_base', 'ai', or 'fallback'
  provider TEXT, -- 'huggingface', 'groq', 'gemini', 'together', 'openai'
  model TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure new columns exist if table was created previously
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS model TEXT;

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_kb_question ON chat_knowledge_base(question);
CREATE INDEX IF NOT EXISTS idx_chat_kb_use_count ON chat_knowledge_base(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_logs_source ON chat_logs(source);
CREATE INDEX IF NOT EXISTS idx_chat_logs_provider ON chat_logs(provider);

-- Function to get chat statistics
CREATE OR REPLACE FUNCTION get_chat_stats()
RETURNS TABLE (
  total BIGINT,
  knowledge_base BIGINT,
  ai BIGINT,
  fallback BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE source = 'knowledge_base') as knowledge_base,
    COUNT(*) FILTER (WHERE source = 'ai') as ai,
    COUNT(*) FILTER (WHERE source = 'fallback') as fallback
  FROM chat_logs;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 14. VERIFICATION & COMPLETION
-- ============================================================

-- Show all created tables
SELECT 'Database setup complete!' as status;
SELECT '=== Tables Created ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT '=== Categories with Tags ===' as info;
SELECT id, name, slug, tags FROM categories ORDER BY name;

SELECT '=== Setup Complete! ===' as final_status;
SELECT 'All tables, indexes, RLS policies, and helper functions created.' as message;
SELECT 'Default categories with tags have been inserted.' as note;
SELECT 'System ready for use!' as ready;
