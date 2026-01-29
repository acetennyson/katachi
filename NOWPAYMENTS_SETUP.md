# NOWPayments Integration Setup Guide

## ✅ What's Been Implemented

NOWPayments has been fully integrated into your checkout system! This allows you to accept:
- 💳 Credit/Debit Cards (via crypto conversion)
- ₿ Bitcoin, Ethereum, and 300+ cryptocurrencies
- 🚫 **NO KYC Required** for basic operations

## 🚀 Quick Setup (5 minutes)

### Step 1: Create NOWPayments Account

1. Go to https://nowpayments.io/
2. Click "Sign Up" (top right)
3. Enter your email and create a password
4. Verify your email
5. **No KYC verification needed for testing!**

### Step 2: Get Your API Keys

1. Log into https://account.nowpayments.io/
2. Go to **Settings** → **API Keys**
3. Click "Generate API Key"
4. Copy your API Key
5. (Optional) Generate IPN Secret for webhooks

### Step 3: Configure Your Environment

Update your `.env.local` file with your NOWPayments credentials:

```bash
# NOWPayments Configuration
NOWPAYMENTS_API_KEY=your_actual_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here (optional)
NOWPAYMENTS_SANDBOX=true  # Set to false for production
NEXT_PUBLIC_NOWPAYMENTS_ENABLED=true  # Enable NOWPayments option
```

### Step 4: Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

## 🧪 Testing

### Sandbox Mode (Recommended for Testing)

1. Set `NOWPAYMENTS_SANDBOX=true` in `.env.local`
2. Use sandbox API key from NOWPayments dashboard
3. Test with testnet cryptocurrencies (no real money)

### Test the Integration

1. Add items to your cart
2. Go to checkout
3. Select "Crypto & Cards" as payment method
4. Complete the order
5. You'll be redirected to NOWPayments invoice page
6. Choose your payment method (crypto or card)
7. Complete the payment

## 📋 Payment Flow

```
Customer Checkout
      ↓
Selects "Crypto & Cards"
      ↓
Order Created in Your Database
      ↓
NOWPayments Invoice Generated
      ↓
Customer Redirected to NOWPayments
      ↓
Customer Pays (Crypto or Card)
      ↓
NOWPayments Webhook Notifies Your Site
      ↓
Order Status Updated to PAID
      ↓
Customer Redirected Back to Confirmation
```

## 🔧 Features Implemented

✅ Invoice creation with NOWPayments
✅ Automatic order creation
✅ Webhook handling for payment status updates
✅ Support for multiple cryptocurrencies
✅ Card payments via crypto conversion
✅ Sandbox mode for testing
✅ Production-ready

## 💰 Fees

- **NOWPayments Fee:** 0.5% per transaction
- **No monthly fees**
- **No setup fees**
- **No KYC for small amounts**

## 🔒 Security

- All payments processed securely by NOWPayments
- Your site never handles sensitive payment data
- Webhook signature verification included
- HTTPS required for production

## 🌍 Supported Payment Methods

### Cryptocurrencies (300+)
- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (Tether)
- Litecoin (LTC)
- Dogecoin (DOGE)
- And 300+ more...

### Cards
- Visa
- Mastercard
- American Express
- (Converted to crypto automatically)

## 📝 Files Modified/Created

### New Files
- `lib/nowpayments-service.ts` - Service layer for NOWPayments
- `app/api/payments/nowpayments/route.ts` - Payment creation endpoint
- `app/api/payments/nowpayments/webhook/route.ts` - Webhook handler

### Modified Files
- `app/checkout/page.tsx` - Added crypto payment handling
- `app/checkout/method/page.tsx` - Added crypto payment option
- `lib/payment-service.ts` - Added NOWPayments to payment types
- `.env.local` - Added NOWPayments configuration

## 🐛 Troubleshooting

### "NOWPAYMENTS_API_KEY not configured"
- Make sure you added the API key to `.env.local`
- Restart your dev server after adding env variables

### "Crypto & Cards" option not showing
- Set `NEXT_PUBLIC_NOWPAYMENTS_ENABLED=true` in `.env.local`
- Restart your dev server

### Payment not updating order status
- Check your webhook URL is accessible from internet
- For local testing, use ngrok: `ngrok http 3000`
- Add your webhook URL in NOWPayments dashboard

### Sandbox payments not working
- Make sure `NOWPAYMENTS_SANDBOX=true`
- Use sandbox API keys (not production keys)
- Check NOWPayments sandbox documentation

## 🚀 Going Live

1. Get your **production** API keys from NOWPayments
2. Update `.env.local`:
   ```bash
   NOWPAYMENTS_SANDBOX=false
   NOWPAYMENTS_API_KEY=your_production_key
   ```
3. Set up webhook URL in NOWPayments dashboard:
   ```
   https://yourdomain.com/api/payments/nowpayments/webhook
   ```
4. Test with small amounts first
5. Monitor payments in NOWPayments dashboard

## 📚 Documentation

- NOWPayments API: https://documenter.getpostman.com/view/7907941/S1a32n38
- Dashboard: https://account.nowpayments.io/
- Support: support@nowpayments.io

## ❓ FAQ

**Q: Do I need KYC verification?**
A: No KYC required for testing and small transaction volumes.

**Q: Can customers pay with regular cards?**
A: Yes! NOWPayments converts card payments to crypto automatically.

**Q: What currencies are supported?**
A: 300+ cryptocurrencies + major fiat currencies via conversion.

**Q: How long do payments take?**
A: Crypto: 10-60 minutes (depends on blockchain)
    Cards: Instant

**Q: What happens if payment fails?**
A: Order status remains PENDING, customer can retry payment.

---

## 🎉 You're All Set!

Your store now accepts crypto and card payments without KYC requirements!

**Next Steps:**
1. Get your API keys from NOWPayments
2. Update `.env.local` 
3. Restart your server
4. Test a payment
5. Go live! 🚀
