# Payment Implementation Documentation

## Current Implementation: Cash on Delivery (COD)

### Overview
The current implementation focuses on Cash on Delivery (COD) as the primary payment method. We've built a solid foundation that can be extended to include online payment methods like Razorpay in the future.

### Features
1. **Order Confirmation Modal**
   - Displays order summary before final submission
   - Shows total amount, item count, and applied coupon if any
   - Provides clear instructions for COD orders

2. **Transaction ID Generation**
   - Each COD order is assigned a unique transaction ID
   - Format: `COD{timestamp}{random 4-digit number}`
   - Examples: `COD1656789012350123`

3. **User Experience Enhancements**
   - Clear payment method selection
   - COD-specific instructions
   - Order safety information
   - Terms and conditions acceptance

4. **Error Handling**
   - Specific error messages for common issues
   - Comprehensive validation to prevent invalid orders

### Database Changes
1. Added `transaction_id` column to the `orders` table
2. Created a stored procedure `increment_coupon_usage` to update coupon usage counts

## Future Integration: Razorpay

### Prerequisites
1. Create a Razorpay account and obtain API keys
2. Set up webhooks for payment verification

### Implementation Steps

#### 1. Environment Setup
```javascript
// Create a .env file with Razorpay credentials
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

#### 2. Server-Side Integration
Create a server API endpoint to create Razorpay orders:

```javascript
// server.js
const express = require('express');
const Razorpay = require('razorpay');
const app = express();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// API to create Razorpay order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    const options = {
      amount: amount * 100, // Razorpay accepts amount in paise
      currency,
      receipt,
      notes
    };
    
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// API to verify payment
app.post('/api/verify-payment', (req, res) => {
  // Verify payment signature
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  // Verification logic here...
});
```

#### 3. Client-Side Integration
Update the Checkout component to handle Razorpay payments:

```javascript
// Checkout.jsx
import { useEffect } from 'react';

// Load Razorpay script
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  document.body.appendChild(script);
  
  return () => {
    document.body.removeChild(script);
  };
}, []);

// Create and open Razorpay payment modal
const handleOnlinePayment = async () => {
  try {
    // Create order on your server
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: getPriceBreakdown().total,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          user_id: user.id,
          items: cart.length
        }
      })
    });
    
    const order = await response.json();
    
    // Configure Razorpay options
    const options = {
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Your Store Name',
      description: 'Purchase Payment',
      order_id: order.id,
      handler: async (response) => {
        // Verify payment on server
        const result = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        
        if (result.status === 200) {
          // Create order in database with payment info
          await placeOrder(order.id, response.razorpay_payment_id);
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone
      },
      theme: {
        color: '#4F46E5'
      }
    };
    
    // Open Razorpay checkout
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Payment initialization failed');
  }
};
```

#### 4. Update Payment Method Selection
Modify the payment method section to handle online payments:

```javascript
{/* Payment Methods */}
<div className="bg-white p-4 rounded-lg border space-y-3">
  <h2 className="text-base font-medium flex items-center gap-2">
    <CreditCard className="w-4 h-4" />
    Payment Method
  </h2>
  
  <div className="space-y-3">
    {PAYMENT_METHODS.map(method => (
      <div 
        key={method.id}
        className={`p-3 rounded-lg border ${
          paymentMethod === method.id
            ? 'border-indigo-600 bg-indigo-50' 
            : 'border-gray-200'
        }`}
        onClick={() => setPaymentMethod(method.id)}
      >
        {/* Existing code */}
      </div>
    ))}
  </div>
</div>

{/* Place Order Button */}
<button
  onClick={paymentMethod === 'cod' ? handlePlaceOrderClick : handleOnlinePayment}
  disabled={placingOrder || addresses.length === 0}
  className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-300"
>
  {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
</button>
```

#### 5. Database Updates
Add additional columns to track online payments:

```sql
-- Add online payment columns
ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "razorpay_order_id" text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "razorpay_payment_id" text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "payment_verified" boolean DEFAULT false;

-- Add indexes
CREATE INDEX IF NOT EXISTS "orders_razorpay_order_id_idx" ON "public"."orders" ("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "orders_razorpay_payment_id_idx" ON "public"."orders" ("razorpay_payment_id");
```

### Security Considerations
1. Never expose Razorpay secret key in client-side code
2. Always verify payment signatures server-side
3. Store payment details securely
4. Implement proper error handling for payment failures
5. Consider adding a webhook endpoint for asynchronous payment updates

## Testing
1. **Manual Testing**
   - Test COD orders with various cart configurations
   - Test with and without coupon codes
   - Verify transaction IDs are generated correctly
   - Ensure order details are saved accurately

2. **Razorpay Testing (Future)**
   - Use Razorpay test mode for development
   - Test payment success and failure scenarios
   - Verify webhook integration
   - Test payment verification

## Troubleshooting
1. **Common Issues**
   - Order placement failures: Check network requests and database connectivity
   - Transaction ID issues: Verify generation logic
   - Payment failures (Razorpay): Verify API keys and checkout configuration

2. **Debugging**
   - Check browser console for JavaScript errors
   - Review network requests for API failures
   - Verify database constraints and validations
   - Test with Razorpay test mode before production 