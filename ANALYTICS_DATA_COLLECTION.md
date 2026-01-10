# Analytics Data Collection - What & Why

## Current State: ⚠️ **MINIMAL TRACKING**

Currently, the analytics system is **set up but NOT actively collecting data**. Only `VIEW_PRODUCT` events are being used for product recommendations.

---

## 📊 Data That CAN Be Collected (Tables Created)

### 1. **analytics_events** - Core Event Tracking
**What's Collected:**
- `type` - Event type (e.g., VIEW_PRODUCT, ADD_TO_CART, CHECKOUT_START)
- `payload` - Event-specific data (JSON)
- `user_id` - Who performed the action
- `session_id` - Session identifier
- `device_id` - Device fingerprint
- `ip` - IP address
- `user_agent` - Browser/device info
- `referrer` - Where user came from
- `country` / `city` - Geographic location
- `device_type` - mobile/tablet/desktop
- `browser` - Chrome, Firefox, Safari, etc.
- `os` - Windows, macOS, iOS, Android, etc.
- `screen_resolution` - Display size
- `duration_seconds` - Time spent
- `occurred_at` - Timestamp

**Why Collect:**
- Understand user behavior patterns
- Track conversion funnel
- Identify drop-off points
- Geographic targeting
- Device/browser optimization
- Session analysis

---

### 2. **user_sessions** - Session Tracking
**What's Collected:**
- `session_id` - Unique session identifier
- `user_id` - User (if logged in)
- `device_id` - Device fingerprint
- `ip`, `user_agent`, `country`, `city` - Location/device info
- `landing_page` - First page visited
- `exit_page` - Last page visited
- `page_views` - Total pages viewed
- `events_count` - Total events in session
- `duration_seconds` - Session length
- `is_bounce` - Single-page visit
- `started_at` / `ended_at` - Session timestamps

**Why Collect:**
- Measure engagement (session duration, pages per session)
- Identify bounce rate
- Track user journeys
- Understand entry/exit points
- Calculate return visitor rate

---

### 3. **analytics_summary** - Daily Aggregated Metrics
**What's Collected (per day):**
- `total_sessions` - Daily sessions
- `unique_visitors` - Daily unique users
- `new_visitors` vs `returning_visitors`
- `page_views` - Total pages viewed
- `avg_session_duration` - Average time on site
- `bounce_rate` - Single-page sessions %
- `orders_count` - Daily orders
- `revenue` - Daily revenue
- `average_order_value` - AOV
- `conversion_rate` - Visitors → Orders %
- `cart_abandonment_rate` - Carts not completed %
- `products_viewed` / `products_added_to_cart` / `products_purchased`
- `traffic_by_country` - Geographic breakdown (JSONB)
- `traffic_by_device` - Device breakdown (JSONB)
- `traffic_by_browser` - Browser breakdown (JSONB)
- `orders_by_payment_method` - Payment preferences (JSONB)
- `revenue_by_payment_method` - Payment method revenue (JSONB)
- `orders_by_shipping_method` - Shipping preferences (JSONB)

**Why Collect:**
- Daily performance dashboard
- Trend analysis
- Geographic expansion decisions
- Device optimization priorities
- Payment method preferences
- Shipping method optimization

---

### 4. **product_analytics** - Product Performance
**What's Collected (per product, per day):**
- `views` - Product page views
- `unique_views` - Unique visitors
- `add_to_cart_count` - Times added to cart
- `purchases` - Times purchased
- `revenue` - Revenue from product
- `view_to_cart_rate` - Views → Cart %
- `cart_to_purchase_rate` - Cart → Purchase %
- `view_to_purchase_rate` - Views → Purchase %
- `avg_time_on_page` - Engagement time

**Why Collect:**
- Identify best-selling products
- Find products with high views but low conversions
- Optimize product pages
- Inventory planning
- Marketing focus (promote high-converting products)
- Product page optimization

---

### 5. **cart_analytics** - Cart Abandonment Tracking
**What's Collected:**
- `user_id` / `session_id` - Who/what cart
- `items_count` - Number of items
- `subtotal`, `tax`, `shipping`, `total` - Cart value
- `status` - ACTIVE, ABANDONED, COMPLETED, EXPIRED
- `created_at` / `abandoned_at` / `completed_at` - Timestamps
- `time_to_checkout` - How long before checkout
- `abandonment_reason` - Why abandoned (if known)

**Why Collect:**
- Calculate cart abandonment rate
- Identify high-value abandoned carts
- Send recovery emails
- Understand checkout friction
- Optimize checkout process
- Price sensitivity analysis

---

### 6. **conversion_funnel** - Funnel Analysis
**What's Collected:**
- `session_id` - User journey
- `visited_homepage` - Did they visit homepage?
- `viewed_product` - Did they view a product?
- `added_to_cart` - Did they add to cart?
- `started_checkout` - Did they start checkout?
- `completed_checkout` - Did they complete checkout?
- `completed_payment` - Did they pay?
- Timestamps for each step
- `drop_off_step` - Where did they leave?

**Why Collect:**
- Identify conversion bottlenecks
- Optimize each funnel step
- A/B test improvements
- Understand user flow
- Reduce drop-offs at each stage

---

### 7. **search_analytics** - Search Behavior
**What's Collected:**
- `query` - Search term
- `results_count` - Number of results
- `clicked_result` - Did they click a result?
- `clicked_product_id` - Which product clicked
- `search_type` - product, category, general
- `filters_applied` - Filters used (JSONB)

**Why Collect:**
- Understand what users are looking for
- Identify missing products
- Improve search functionality
- Popular search terms
- Search-to-purchase conversion
- SEO keyword insights

---

## 🚨 What's MISSING: Actual Tracking Implementation

**Current Status:** The infrastructure is ready, but **no frontend code is sending events** except:
- `VIEW_PRODUCT` events (used for recommendations only)

**What Needs to Be Implemented:**

### Events to Track:

1. **Page Views**
   - `PAGE_VIEW` - Every page visit
   - Payload: `{ page: '/products', title: 'Products' }`

2. **Product Interactions**
   - `VIEW_PRODUCT` - Product page viewed
   - Payload: `{ product_id, product_name, category_id, price }`
   - `ADD_TO_CART` - Item added to cart
   - Payload: `{ product_id, quantity, price, cart_total }`
   - `REMOVE_FROM_CART` - Item removed
   - `UPDATE_CART_QUANTITY` - Quantity changed

3. **Checkout Funnel**
   - `CHECKOUT_START` - Checkout page visited
   - Payload: `{ cart_value, items_count }`
   - `CHECKOUT_STEP` - Step in checkout
   - Payload: `{ step: 'address' | 'payment' | 'review' }`
   - `CHECKOUT_COMPLETE` - Order placed
   - Payload: `{ order_id, total, payment_method }`
   - `CHECKOUT_ABANDON` - Left checkout without completing

4. **Search**
   - `SEARCH` - Search performed
   - Payload: `{ query, results_count, filters }`
   - `SEARCH_CLICK` - Search result clicked
   - Payload: `{ query, product_id }`

5. **User Actions**
   - `SIGN_IN` - User logged in
   - `SIGN_UP` - User registered
   - `SIGN_OUT` - User logged out

6. **Session Events**
   - `SESSION_START` - New session
   - `SESSION_END` - Session ended

---

## 📈 Business Value of Each Metric

### Revenue Metrics
- **Total Revenue** → Business health
- **Average Order Value** → Upselling opportunities
- **Revenue by Country** → Geographic expansion
- **Revenue by Payment Method** → Payment optimization

### Conversion Metrics
- **Conversion Rate** → Overall funnel effectiveness
- **Cart Abandonment Rate** → Checkout issues
- **View-to-Cart Rate** → Product appeal
- **Cart-to-Purchase Rate** → Checkout friction

### Engagement Metrics
- **Session Duration** → Content quality
- **Pages per Session** → Site navigation
- **Bounce Rate** → Landing page quality
- **Return Visitor Rate** → Brand loyalty

### Product Metrics
- **Product Views** → Popular products
- **Product Conversion Rate** → Product page effectiveness
- **Top Products by Revenue** → Inventory planning

### Technical Metrics
- **Device Type** → Mobile optimization needs
- **Browser** → Compatibility issues
- **Country** → Geographic targeting
- **Screen Resolution** → Design optimization

---

## 🎯 Recommended Implementation Priority

1. **High Priority** (Revenue Impact):
   - ✅ Cart abandonment tracking
   - ✅ Checkout funnel tracking
   - ✅ Product view tracking
   - ✅ Order completion tracking

2. **Medium Priority** (Optimization):
   - ✅ Session tracking
   - ✅ Search analytics
   - ✅ Product performance
   - ✅ Geographic data

3. **Low Priority** (Nice to Have):
   - ✅ Device/browser breakdown
   - ✅ Screen resolution
   - ✅ Detailed funnel steps

---

## 🔧 Next Steps

1. **Create analytics tracking utility** (`lib/analytics.ts`)
2. **Add tracking calls** to:
   - Product pages (view, add to cart)
   - Checkout pages (start, steps, complete, abandon)
   - Search functionality
   - User authentication
   - Session start/end
3. **Create aggregation job** to populate `analytics_summary` daily
4. **Build admin dashboard** to visualize all metrics

