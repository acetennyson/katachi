# Lemonsqueezy Webhook Configuration Guide

## 🎯 What is the Webhook?

The webhook is how Lemonsqueezy notifies your store when:
- A payment is completed
- An order is created
- A subscription is activated
- A refund is processed
- Any payment event occurs

**It's essential for automatically updating order statuses.**

## 📍 Your Webhook URL

### Production URL:
```
https://katachi.store/api/payments/lemonsqueezy/webhook
```

### Local Development (using ngrok):
```
https://your-ngrok-url.ngrok.io/api/payments/lemonsqueezy/webhook
```

---

## 🚀 Setup Instructions

### Option 1: Production Setup (For Live Site)

#### Step 1: Deploy Your Site
Make sure your site is deployed and accessible via HTTPS.

#### Step 2: Configure Webhook in Lemonsqueezy Dashboard

1. Log into https://app.lemonsqueezy.com/
2. Go to **Settings** → **Webhooks**
3. Click **+ Add Webhook**
4. Configure webhook:
   
   **Endpoint URL:**
   ```
   https://katachi.store/api/payments/lemonsqueezy/webhook
   ```
   
   **Events to listen for:**
   - ✅ `order_created`
   - ✅ `order_refunded`
   - ✅ `subscription_created` (if using subscriptions)
   - ✅ `subscription_payment_success`
   - ✅ `subscription_payment_failed`
   - ✅ `subscription_cancelled`
   - ✅ `subscription_expired`

5. Click **Create Webhook**
6. Copy the **Signing Secret** (looks like: `whsec_...`)

#### Step 3: Add Signing Secret to Environment

Update your `.env.local`:
```bash
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

#### Step 4: Restart Your Server
```bash
npm run dev
# or
pnpm dev
```

---

### Option 2: Local Development Setup (Using ngrok)

For testing webhooks locally, expose your local server to the internet using ngrok.

#### Step 1: Install ngrok

```bash
# Download from https://ngrok.com/download
# Or install via homebrew (macOS):
brew install ngrok

# Or via npm:
npm install -g ngrok
```

#### Step 2: Start Your Local Server

```bash
npm run dev
# Server running on http://localhost:3000
```

#### Step 3: Start ngrok

```bash
# In a new terminal window
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

#### Step 4: Configure Lemonsqueezy Webhook

1. Copy your ngrok URL (e.g., `https://abc123.ngrok.io`)
2. Go to https://app.lemonsqueezy.com/settings/webhooks
3. Click **+ Add Webhook**
4. Enter webhook URL:
   ```
   https://abc123.ngrok.io/api/payments/lemonsqueezy/webhook
   ```
5. Select all order and subscription events
6. Click **Create Webhook**
7. Copy the **Signing Secret**

#### Step 5: Add Secret to Environment

```bash
# In .env.local
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

#### Step 6: Restart Server

```bash
# Restart your dev server
npm run dev
```

#### Step 7: Test It!

1. Make a test payment
2. Watch your terminal for webhook logs:
   ```
   [Lemonsqueezy Webhook] Received webhook
   [Lemonsqueezy Webhook] ✅ Signature verified
   [Lemonsqueezy Webhook] Event: order_created
   [Lemonsqueezy Webhook] ✅ Order updated successfully
   ```

---

## 🔍 Webhook Flow

```
Customer Completes Payment on Lemonsqueezy
                ↓
Lemonsqueezy sends POST request to your webhook
                ↓
Your webhook verifies signature (if secret set)
                ↓
Parses event data (order_created, etc.)
                ↓
Maps event to order status
                ↓
Updates order in your database
                ↓
Returns success response to Lemonsqueezy
```

---

## 📊 Event & Status Mapping

The webhook automatically maps Lemonsqueezy events to your order statuses:

| Lemonsqueezy Event | Your Payment Status | Your Order Status |
|-------------------|--------------------|--------------------|
| `order_created`   | `PENDING`          | `PENDING`          |
| Order paid        | `PAID`             | `CONFIRMED`        |
| `order_refunded`  | `REFUNDED`         | `REFUNDED`         |
| `subscription_created` | `PAID`        | `CONFIRMED`        |
| `subscription_payment_success` | `PAID` | `CONFIRMED`   |
| `subscription_payment_failed` | `FAILED` | `CANCELLED`  |
| `subscription_cancelled` | `CANCELLED` | `CANCELLED`    |
| `subscription_expired` | `CANCELLED`   | `CANCELLED`      |

---

## 🔒 Security Features

### 1. Signature Verification
If you set `LEMONSQUEEZY_WEBHOOK_SECRET`, the webhook verifies each request is from Lemonsqueezy:

```bash
# In .env.local
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

**How it works:**
- Lemonsqueezy signs each webhook with HMAC SHA-256
- Your webhook verifies the signature
- Invalid signatures are rejected with 401 error

### 2. HTTPS Required
Lemonsqueezy only sends webhooks to HTTPS URLs (not HTTP).

### 3. POST Only
The webhook only accepts POST requests.

### 4. Custom Data
Order ID is stored in custom data to match payments to orders.

---

## 🧪 Testing the Webhook

### Manual Test (Using curl)

```bash
curl -X POST http://localhost:3000/api/payments/lemonsqueezy/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {
      "event_name": "order_created"
    },
    "data": {
      "attributes": {
        "status": "paid",
        "total": 10000,
        "currency": "USD",
        "custom_data": {
          "order_id": "ORD_TEST123"
        }
      }
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "order_number": "ORD_TEST123",
  "payment_status": "PAID"
}
```

### Test with Real Payment

1. Create a test order on your site
2. Use test mode in Lemonsqueezy
3. Complete payment
4. Check your server logs for webhook activity
5. Verify order status updated in database

---

## 📝 Webhook Logs

The webhook logs detailed information to help you debug:

```bash
# Successful webhook
[Lemonsqueezy Webhook] Received webhook
[Lemonsqueezy Webhook] Headers: { signature: 'present', contentType: 'application/json' }
[Lemonsqueezy Webhook] ✅ Signature verified
[Lemonsqueezy Webhook] Event: order_created
[Lemonsqueezy Webhook] Data: {
  orderId: 'ORD_ABC123',
  status: 'paid',
  total: 10000,
  currency: 'USD'
}
[Lemonsqueezy Webhook] ✅ Order updated successfully: {
  orderNumber: 'ORD_ABC123',
  event: 'order_created',
  newPaymentStatus: 'PAID',
  newOrderStatus: 'CONFIRMED'
}
```

---

## 🐛 Troubleshooting

### Webhook not being called

**Check 1:** Is your URL correct?
- Must be HTTPS (not HTTP) for production
- Must be publicly accessible
- Must end with `/api/payments/lemonsqueezy/webhook`

**Check 2:** Is the URL configured in Lemonsqueezy?
- Log into https://app.lemonsqueezy.com/settings/webhooks
- Verify webhook exists and is enabled

**Check 3:** For local development, is ngrok running?
```bash
ngrok http 3000
```

**Check 4:** Check Lemonsqueezy webhook logs
- Go to your webhook in Lemonsqueezy dashboard
- Click on it to see delivery attempts and responses

### "Invalid signature" error

**Solution:** Check your webhook secret
```bash
# In .env.local
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET
```

Or temporarily disable verification:
```bash
# Remove or comment out:
# LEMONSQUEEZY_WEBHOOK_SECRET=...
```

### Order not updating

**Check 1:** Does the order exist?
- Verify `order_number` matches between payment and order
- Check if order was created in your database

**Check 2:** Database connection
- Check Supabase credentials in `.env.local`
- Verify service role key is correct

**Check 3:** Check server logs
```bash
# Look for errors in your terminal
[Lemonsqueezy Webhook] Failed to update order: ...
```

### "No order_id found" error

**Solution:** Make sure order ID is passed in custom data:
```javascript
checkoutData: {
  custom: {
    order_id: orderId, // This is required!
  },
}
```

### Webhook timing out

**Solution:** The webhook is async and should respond quickly. If slow:
- Check your database connection speed
- Ensure Supabase service role key is correct
- Monitor server resources

---

## 🔄 Webhook Retry Logic

Lemonsqueezy automatically retries failed webhooks:
- Retries multiple times
- With exponential backoff
- Over several hours

Your webhook must return:
- HTTP 200 for success
- Any other status code triggers retry

---

## 📚 Webhook Payload Example

Here's what Lemonsqueezy sends to your webhook:

```json
{
  "meta": {
    "event_name": "order_created",
    "custom_data": {
      "order_id": "ORD_ABC123"
    }
  },
  "data": {
    "type": "orders",
    "id": "123456",
    "attributes": {
      "store_id": 12345,
      "customer_id": 67890,
      "identifier": "abc-123-def",
      "order_number": 1234,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "currency": "USD",
      "currency_rate": "1.00000000",
      "subtotal": 999,
      "discount_total": 0,
      "tax": 0,
      "total": 999,
      "subtotal_usd": 999,
      "discount_total_usd": 0,
      "tax_usd": 0,
      "total_usd": 999,
      "tax_name": "VAT",
      "tax_rate": "0.00",
      "status": "paid",
      "status_formatted": "Paid",
      "refunded": false,
      "refunded_at": null,
      "subtotal_formatted": "$9.99",
      "discount_total_formatted": "$0.00",
      "tax_formatted": "$0.00",
      "total_formatted": "$9.99",
      "first_order_item": {
        "id": 123456,
        "order_id": 123456,
        "product_id": 12345,
        "variant_id": 67890,
        "product_name": "Store Order Payment",
        "variant_name": "Default",
        "price": 999
      },
      "urls": {
        "receipt": "https://..."
      },
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z",
      "custom_data": {
        "order_id": "ORD_ABC123"
      }
    }
  }
}
```

---

## ✅ Quick Checklist

- [ ] Webhook URL configured in Lemonsqueezy dashboard
- [ ] Signing secret added to `.env.local`
- [ ] Server restarted after adding secret
- [ ] Webhook URL is HTTPS (for production)
- [ ] ngrok running (for local development)
- [ ] Test payment completed successfully
- [ ] Order status updated in database
- [ ] Webhook logs showing in terminal

---

## 🎉 You're All Set!

Your Lemonsqueezy webhook is now configured and ready to automatically update order statuses when payments complete!

**Next Steps:**
1. Make a test payment
2. Watch the webhook logs in your terminal
3. Verify the order status updates in your database
4. Go live! 🚀

---

## 📞 Support

- Lemonsqueezy Documentation: https://docs.lemonsqueezy.com/
- Webhook Guide: https://docs.lemonsqueezy.com/api/webhooks
- Dashboard: https://app.lemonsqueezy.com/
- Support: https://lemonsqueezy.com/help

---

## 💡 Pro Tips

### 1. Test Webhooks in Dashboard
Lemonsqueezy lets you manually trigger webhooks from the dashboard for testing.

### 2. Monitor Webhook Deliveries
Check webhook delivery status and responses in Lemonsqueezy dashboard.

### 3. Use Test Mode
Always test in test mode before going live.

### 4. Keep Logs
Monitor your server logs to catch any webhook processing issues.

### 5. Handle All Events
Even if you don't use subscriptions now, handle subscription events for future flexibility.

---

*Last Updated: 2024*
*Status: Webhook ready and working ✅*
