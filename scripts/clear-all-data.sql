-- ============================================================
-- CLEAR ALL DATA - Keeps tables, removes all records
-- ============================================================
-- WARNING: This will delete ALL data in your database!
-- Use with caution!
-- ============================================================

-- Disable triggers temporarily for faster deletion
SET session_replication_role = replica;

-- Clear data in dependency order (children first, parents last)

-- Analytics and logs (most dependent tables first)
TRUNCATE TABLE analytics_events CASCADE;
TRUNCATE TABLE analytics_summary CASCADE;
TRUNCATE TABLE admin_activity_logs CASCADE;
TRUNCATE TABLE admin_analytics CASCADE;
TRUNCATE TABLE chat_logs CASCADE;
TRUNCATE TABLE chat_knowledge_base CASCADE;
TRUNCATE TABLE cart_analytics CASCADE;
TRUNCATE TABLE conversion_funnel CASCADE;
TRUNCATE TABLE ip_geolocation_cache CASCADE;
TRUNCATE TABLE product_analytics CASCADE;
TRUNCATE TABLE product_analytics_summary CASCADE;
TRUNCATE TABLE product_views CASCADE;
TRUNCATE TABLE search_analytics CASCADE;
TRUNCATE TABLE user_sessions CASCADE;

-- Tracking
TRUNCATE TABLE order_live_tracking CASCADE;

-- Orders (will cascade to order_items)
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;

-- Payments
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE card_payments CASCADE;

-- Products and variants
TRUNCATE TABLE variants CASCADE;
TRUNCATE TABLE products CASCADE;

-- Categories
TRUNCATE TABLE categories CASCADE;

-- Shipping
TRUNCATE TABLE shipping_zone_rates CASCADE;
TRUNCATE TABLE shipping_zones CASCADE;
TRUNCATE TABLE shipping_methods CASCADE;
TRUNCATE TABLE addresses CASCADE;

-- Reports
TRUNCATE TABLE scheduled_reports CASCADE;

-- Settings
TRUNCATE TABLE site_settings CASCADE;

-- Cache
TRUNCATE TABLE cache CASCADE;

-- Users (profiles) - Clear last to maintain referential integrity
-- WARNING: This will delete all user accounts!
TRUNCATE TABLE profiles CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS admin_activity_logs_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS admin_analytics_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS product_views_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS scheduled_reports_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS shipping_zone_rates_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS shipping_zones_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS site_settings_id_seq RESTART WITH 1;

SELECT 'All data cleared successfully!' AS result;
