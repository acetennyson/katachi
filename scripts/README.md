# Database Setup

## Quick Start

This directory contains the complete database setup for Katachi Furniture e-commerce platform.

### Single Setup Script

**`00-complete-setup.sql`** - Complete database schema for fresh installation

Run this single file in your Supabase SQL Editor to set up everything.

## What's Included

### Tables Created (16 total)
1. **profiles** - User accounts with roles
2. **addresses** - User shipping addresses
3. **categories** - Product categories with tags
4. **products** - Product catalog with full details
5. **product_categories** - Many-to-many product-category relationships
6. **variants** - Product variants (size, color, etc.)
7. **carts** - Shopping carts
8. **cart_items** - Items in shopping carts
9. **orders** - Order records
10. **order_items** - Items in orders (with product_id for navigation)
11. **payment_methods** - Saved payment methods
12. **card_payments** - Card payment tracking
13. **message_threads** - Customer support threads
14. **messages** - Support messages
15. **analytics_events** - User behavior tracking
16. **cache** - Application cache

### Features

✅ **Complete Product System**
- Full product details (name, description, price, stock)
- Images (main + gallery)
- Materials, dimensions, colors, specifications
- Badge system (New, Limited, Sale, Popular)
- In-stock status
- Category relationships

✅ **Smart Category System**
- Categories with names, slugs, descriptions
- Tag-based recommendation system
- Helper functions for cross-category recommendations
- Default categories: Chairs, Tables, Sofas, Storage, Lighting, Decor

✅ **Order Management**
- Order tracking with status
- Product references in order items for navigation
- Payment status tracking
- Shipping address storage

✅ **Security**
- Row Level Security (RLS) enabled
- User-specific data access policies
- Admin role-based policies
- Public product viewing

✅ **Performance**
- Optimized indexes on all foreign keys
- GIN indexes for array/JSONB columns
- Proper relationship constraints

✅ **Recommendation System**
- Tag-based category matching
- `get_related_categories()` function
- `get_products_by_category_tags()` function
- Smart cross-category product suggestions

## How to Use

### For Fresh Installation

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `00-complete-setup.sql`
4. Run the script
5. Done! All tables, indexes, policies, and default data created

### After Setup

The script creates:
- 16 database tables with relationships
- Performance indexes
- RLS policies for security
- 6 default categories with tags
- 2 helper functions for recommendations

### Default Categories Created

- **Chairs** - tags: seating, furniture, comfort, dining, living-room
- **Tables** - tags: furniture, dining, living-room, wood, functional  
- **Sofas** - tags: seating, furniture, comfort, living-room, upholstery
- **Storage** - tags: furniture, organization, functional, wood
- **Lighting** - tags: decor, functional, ambiance
- **Decor** - tags: decor, accessories, style

## Storage Setup (Optional)

If you want image uploads, create a Supabase Storage bucket:

```sql
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## Schema Highlights

### Product Schema
```sql
products (
  id, slug, name, description, type,
  category_id,              -- Links to categories
  price, currency, stock, in_stock,
  image, images,            -- Main image + gallery
  badge, dimensions,        -- Display fields
  materials, colors,        -- Arrays/JSON
  specifications,           -- Array of features
  attributes, media,        -- Extra data
  created_at, updated_at
)
```

### Category Schema
```sql
categories (
  id, name, slug,
  description, image,
  tags,                     -- Array for recommendations
  created_at, updated_at
)
```

### Order Items Schema
```sql
order_items (
  id, order_id,
  product_id,               -- For navigation to product
  product_name,             -- Snapshot
  quantity, unit_price,
  created_at
)
```

## Maintenance

This is a single-file setup. For schema changes:
1. Edit `00-complete-setup.sql`
2. Test on development database
3. Apply to production

No migration system needed - this is for fresh installations.

## Support

For issues or questions:
- Check Supabase Dashboard for error messages
- Verify all tables were created: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
- Check RLS policies are active
