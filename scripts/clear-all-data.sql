-- ============================================================
-- CLEAR ALL DATA - Keeps tables, removes all records
-- ============================================================
-- WARNING: This will delete ALL data in your database!
-- Use with caution!
-- ============================================================

-- Disable triggers temporarily for faster deletion
SET session_replication_role = replica;

-- Clear data in dependency order (children first, parents last)

-- Analytics and logs
TRUNCATE TABLE analytics_events CASCADE;
TRUNCATE TABLE admin_activity_logs CASCADE;
TRUNCATE TABLE chat_logs CASCADE;
TRUNCATE TABLE chat_knowledge_base CASCADE;

-- Tracking
TRUNCATE TABLE order_live_tracking CASCADE;

-- Orders (will cascade to order_items)
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;

-- Payments
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- Cart (will cascade to cart_items)
TRUNCATE TABLE cart_items CASCADE;
TRUNCATE TABLE carts CASCADE;

-- Products (will cascade to variants)
TRUNCATE TABLE variants CASCADE;
TRUNCATE TABLE products CASCADE;

-- Categories
TRUNCATE TABLE categories CASCADE;

-- Shipping
TRUNCATE TABLE shipping_methods CASCADE;
TRUNCATE TABLE addresses CASCADE;

-- Subscriptions
TRUNCATE TABLE subscriptions CASCADE;

-- Settings
TRUNCATE TABLE settings CASCADE;

-- Users (profiles) - Clear last to maintain referential integrity
-- WARNING: This will delete all user accounts!
TRUNCATE TABLE profiles CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS your_sequence RESTART WITH 1;

SELECT 'All data cleared successfully!' AS result;
