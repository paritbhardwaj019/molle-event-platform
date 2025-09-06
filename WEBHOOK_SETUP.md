# Cashfree Webhook Setup Guide

## Webhook URLs

Based on your ngrok URL `https://04478f4ebe64.ngrok-free.app`, here are the complete webhook URLs you need to configure in your Cashfree dashboard:

### 1. Payment Webhook (for both Package Purchase and Ticket Purchase)

```
https://04478f4ebe64.ngrok-free.app/api/cashfree/payment-webhook
```

This webhook handles:

- Package purchase payments
- Event ticket purchase payments
- Swipe purchase payments

### 2. Subscription Webhook (legacy - for backward compatibility)

```
https://04478f4ebe64.ngrok-free.app/api/cashfree/subscription-webhook
```

## Webhook Events Handled

### Payment Success Webhook

- **Event Type**: `PAYMENT_SUCCESS_WEBHOOK`
- **Handles**: Successful payments for packages, tickets, and swipes
- **Actions**:
  - Updates payment status to "COMPLETED"
  - Processes subscription activation for package purchases
  - Confirms booking status for ticket purchases
  - Updates user swipe limits for swipe purchases
- **Order Tags Detection**:
  - Uses `order_tags.pkgId` to identify package purchases
  - Uses `order_tags.bid` to identify ticket purchases
  - Fallback to database lookup if tags are not available

### Payment Failed Webhook

- **Event Type**: `PAYMENT_FAILED_WEBHOOK`
- **Handles**: Failed payment attempts
- **Actions**:
  - Updates payment status to "FAILED"
  - Logs error details for debugging

### Payment User Dropped Webhook

- **Event Type**: `PAYMENT_USER_DROPPED_WEBHOOK`
- **Handles**: Abandoned payment flows
- **Actions**:
  - Updates payment status to "USER_DROPPED"
  - Tracks user behavior analytics

## Cashfree Dashboard Configuration

### Step 1: Access Cashfree Dashboard

1. Log in to your Cashfree merchant dashboard
2. Navigate to **Settings** → **Webhooks**

### Step 2: Configure Webhook URLs

1. **Add New Webhook**

   - **Webhook URL**: `https://04478f4ebe64.ngrok-free.app/api/cashfree/payment-webhook`
   - **Events**: Select all payment events
     - ✅ Payment Success
     - ✅ Payment Failed
     - ✅ Payment User Dropped

2. **Webhook Secret** (if required)
   - Use your `CASHFREE_WEBHOOK_SECRET` environment variable
   - This is used for signature verification

### Step 3: Test Webhook

1. Use Cashfree's webhook testing feature
2. Send test events to verify your endpoint
3. Check logs in your application console

## Environment Variables Required

Make sure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_URL=https://04478f4ebe64.ngrok-free.app
NGROK_URL=https://04478f4ebe64.ngrok-free.app
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret
```

**Note**: No webhook secret is required as signature verification has been removed for simplicity.

## Order Structure

### Package Purchase Order

```json
{
  "order_id": "PKG_1234567890_user123",
  "order_amount": 299.0,
  "order_currency": "INR",
  "customer_details": {
    "customer_id": "user123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "9876543210"
  },
  "order_meta": {
    "return_url": "https://your-domain.com/dashboard?payment_success=true",
    "notify_url": "https://your-domain.com/api/cashfree/payment-webhook"
  },
  "order_note": "Subscription purchase for Premium Package",
  "order_tags": {
    "pkgId": "pkg_123",
    "uid": "user123",
    "pkgName": "Premium Package",
    "pkgPrice": "299.00",
    "pkgDur": "MONTHLY",
    "swipeLimit": "50"
  }
}
```

### Ticket Purchase Order

```json
{
  "order_id": "BK1234567890",
  "order_amount": 1500.0,
  "order_currency": "INR",
  "customer_details": {
    "customer_id": "user123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "9876543210"
  },
  "order_meta": {
    "return_url": "https://your-domain.com/bookings?booking_id=booking123",
    "notify_url": "https://your-domain.com/api/cashfree/payment-webhook"
  },
  "order_note": "Booking for Summer Music Festival - BK1234567890",
  "order_tags": {
    "bid": "booking123",
    "eid": "event456",
    "uid": "user123",
    "tkt": "2",
    "upay": "1500.00",
    "hget": "1200.00",
    "aget": "250.00",
    "rget": "50.00",
    "ref": "REF123"
  }
}
```

## Webhook Security

The webhook endpoints include:

- **No Signature Verification**: Simplified webhook processing without signature verification
- **Error Handling**: Comprehensive error logging and handling
- **Idempotency**: Safe to process duplicate webhooks
- **Direct Processing**: Processes webhooks directly from Cashfree without additional verification

## Testing Webhooks

### Using ngrok Inspector

1. Open `http://localhost:4040` in your browser
2. Monitor incoming webhook requests
3. View request/response details

### Manual Testing

You can test the webhook endpoint using curl:

```bash
curl -X POST https://04478f4ebe64.ngrok-free.app/api/cashfree/payment-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: your_signature_here" \
  -d '{
    "type": "PAYMENT_SUCCESS_WEBHOOK",
    "data": {
      "order": {
        "order_id": "test_order_123",
        "order_amount": 100,
        "order_currency": "INR"
      },
      "payment": {
        "cf_payment_id": "test_payment_123",
        "payment_status": "SUCCESS",
        "payment_amount": 100,
        "payment_currency": "INR"
      }
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**

   - Check ngrok tunnel is active
   - Verify webhook URL is correctly configured in Cashfree dashboard
   - Ensure webhook is enabled and active

2. **Signature verification failed**

   - Verify `CASHFREE_WEBHOOK_SECRET` is correctly set
   - Check webhook secret in Cashfree dashboard matches your environment variable

3. **Payment not processing**
   - Check application logs for errors
   - Verify database connections
   - Ensure all required environment variables are set

### Log Monitoring

Monitor these log messages in your application:

- `"Payment webhook received:"` - Webhook received
- `"Processing subscription payment success"` - Package purchase processing
- `"Processing booking payment success"` - Ticket purchase processing
- `"Payment failure processed successfully"` - Failed payment handling

## Production Deployment

When deploying to production:

1. **Update Webhook URLs**: Replace ngrok URL with your production domain
2. **Environment Variables**: Set production environment variables
3. **SSL Certificate**: Ensure HTTPS is enabled
4. **Monitoring**: Set up webhook monitoring and alerting
5. **Rate Limiting**: Consider implementing rate limiting for webhook endpoints

## Support

For issues with:

- **Cashfree Integration**: Contact Cashfree support
- **Webhook Processing**: Check application logs and database
- **Payment Verification**: Verify webhook signatures and payment data
