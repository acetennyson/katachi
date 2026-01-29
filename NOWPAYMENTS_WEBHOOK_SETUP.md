# NOWPayments Webhook Configuration Guide

## 🎯 What is the Webhook?

The webhook is how NOWPayments notifies your store when a payment is completed, failed, or updated. **It's essential for automatically updating order statuses.**

## 📍 Your Webhook URL

### Production URL:
```
https://yourdomain.com/api/payments/nowpayments/webhook
```

### Local Development (using ngrok):
```
https://your-ngrok-url.ngrok.io/api/payments/nowpayments/webhook
```

---

## 🚀 Setup Instructions

### Option 1: Production Setup (For Live Site)

#### Step 1: Deploy Your Site
Make sure your site is deployed and accessible via HTTPS.

#### Step 2: Configure Webhook in NOWPayments Dashboard

1. Log into https://account.nowpayments.io/
2. Go to **Settings** → **API** → **IPN Callbacks**
3. Add your webhook URL:
   ```
   https://yourdomain.com/api/payments/nowpayments/webhook
   ```
4. Click **Save**

#### Step 3: Get IPN Secret (Optional but Recommended)

1. In the same IPN settings page
2. Generate or copy your **IPN Secret**
3. Add it to your `.env.local`:
   ```bash
   NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
   ```
4. Restart your server

---

### Option 2: Local Development Setup (Using ngrok)

For testing webhooks locally, you need to expose your local server to the internet using ngrok.

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

#### Step 4: Configure NOWPayments Webhook

1. Copy your ngrok URL (e.g., `https://abc123.ngrok.io`)
2. Go to https://account.nowpayments.io/
3. Go to **Settings** → **API** → **IPN Callbacks**
4. Add webhook URL:
   ```
   https://abc123.ngrok.io/api/payments/nowpayments/webhook
   ```
5. Click **Save**

#### Step 5: Test It!

1. Make a test payment
2. Watch your terminal for webhook logs:
   ```
   [NOWPayments Webhook] Received IPN
   [NOWPayments Webhook] Payment data: {...}
   [NOWPayments Webhook] ✅ Order updated successfully
   ```

---

## 🔍 Webhook Flow

```
Customer Completes Payment on NOWPayments
                ↓
NOWPayments sends POST request to your webhook
                ↓
Your webhook verifies signature (if IPN secret set)
                ↓
Parses payment data (status, order_id, amount)
                ↓
Updates order status in your database
                ↓
Returns success response to NOWPayments
```

---

## 📊 Payment Status Mapping

The webhook automatically maps NOWPayments statuses to your order statuses:

| NOWPayments Status | Your Payment Status | Your Order Status |
|-------------------|--------------------|--------------------|
| `finished`        | `PAID`             | `CONFIRMED`        |
| `confirmed`       | `PAID`             | `CONFIRMED`        |
| `partially_paid`  | `PARTIAL`          | `PENDING`          |
| `failed`          | `FAILED`           | `CANCELLED`        |
| `expired`         | `FAILED`           | `CANCELLED`        |
| `refunded`        | `FAILED`           | `CANCELLED`        |
| Other             | `PENDING`          | `PENDING`          |

---

## 🔒 Security Features

### 1. Signature Verification
If you set `NOWPAYMENTS_IPN_SECRET`, the webhook verifies each request is from NOWPayments:

```bash
# In .env.local
NOWPAYMENTS_IPN_SECRET=your_secret_here
```

### 2. HTTPS Required
NOWPayments only sends webhooks to HTTPS URLs (not HTTP).

### 3. POST Only
The webhook only accepts POST requests.

---

## 🧪 Testing the Webhook

### Manual Test (Using curl)

```bash
curl -X POST http://localhost:3000/api/payments/nowpayments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test_123",
    "payment_status": "finished",
    "order_id": "ORD_TEST123",
    "price_amount": 100,
    "price_currency": "USD"
  }'
```

Expected response:
```json
{
  "success": true,
  "order_id": "ORD_TEST123",
  "payment_status": "PAID"
}
```

### Test with Real Payment

1. Create a test order on your site
2. Use sandbox mode (`NOWPAYMENTS_SANDBOX=true`)
3. Complete payment on NOWPayments
4. Check your server logs for webhook activity
5. Verify order status updated in database

---

## 📝 Webhook Logs

The webhook logs detailed information to help you debug:

```bash
# Successful webhook
[NOWPayments Webhook] Received IPN
[NOWPayments Webhook] Headers: { signature: 'present', contentType: 'application/json' }
[NOWPayments Webhook] ✅ Signature verified
[NOWPayments Webhook] Payment data: {
  orderId: 'ORD_ABC123',
  paymentStatus: 'finished',
  paymentId: '12345678',
  amount: 100,
  currency: 'USD'
}
[NOWPayments Webhook] ✅ Order updated successfully: {
  orderId: 'ORD_ABC123',
  newPaymentStatus: 'PAID',
  newOrderStatus: 'CONFIRMED'
}
```

---

## 🐛 Troubleshooting

### Webhook not being called

**Check 1:** Is your URL correct?
- Must be HTTPS (not HTTP)
- Must be publicly accessible
- Must end with `/api/payments/nowpayments/webhook`

**Check 2:** Is the URL configured in NOWPayments?
- Log into https://account.nowpayments.io/
- Check Settings → API → IPN Callbacks

**Check 3:** For local development, is ngrok running?
```bash
ngrok http 3000
```

### "Invalid signature" error

**Solution:** Check your IPN secret
```bash
# In .env.local
NOWPAYMENTS_IPN_SECRET=your_actual_secret_from_dashboard
```

Or temporarily disable verification:
```bash
# Remove or comment out:
# NOWPAYMENTS_IPN_SECRET=...
```

### Order not updating

**Check 1:** Does the order exist?
- Verify `order_number` matches between payment and order

**Check 2:** Database connection
- Check Supabase credentials in `.env.local`

**Check 3:** Check server logs
```bash
# Look for errors in your terminal
[NOWPayments Webhook] Failed to update order: ...
```

### Webhook timing out

**Solution:** The webhook is async and should respond quickly. If slow:
- Check your database connection speed
- Ensure Supabase service role key is correct
- Monitor server resources

---

## 🔄 Webhook Retry Logic

NOWPayments automatically retries failed webhooks:
- Retries up to 10 times
- With exponential backoff
- Over 24 hours

Your webhook must return:
- HTTP 200 for success
- Any other status code triggers retry

---

## 📚 Webhook Payload Example

Here's what NOWPayments sends to your webhook:

```json
{
  "payment_id": "5077197174",
  "payment_status": "finished",
  "pay_address": "0x123...",
  "price_amount": 100,
  "price_currency": "USD",
  "pay_amount": 0.0025,
  "actually_paid": 0.0025,
  "pay_currency": "BTC",
  "order_id": "ORD_ABC123",
  "order_description": "Order ORD_ABC123 - 3 items",
  "purchase_id": "12345678",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z",
  "outcome_amount": 95,
  "outcome_currency": "USD"
}
```

---

## ✅ Quick Checklist

- [ ] Webhook URL configured in NOWPayments dashboard
- [ ] IPN Secret added to `.env.local` (optional)
- [ ] Server restarted after adding IPN secret
- [ ] Webhook URL is HTTPS (for production)
- [ ] ngrok running (for local development)
- [ ] Test payment completed successfully
- [ ] Order status updated in database
- [ ] Webhook logs showing in terminal

---

## 🎉 You're All Set!

Your webhook is now configured and ready to automatically update order statuses when payments complete!

**Next Steps:**
1. Make a test payment
2. Watch the webhook logs in your terminal
3. Verify the order status updates in your database
4. Go live! 🚀

---

## 📞 Support

- NOWPayments Documentation: https://nowpayments.io/doc/
- NOWPayments Support: support@nowpayments.io
- Webhook Issues: Check server logs first, then contact NOWPayments support
