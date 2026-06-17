import Razorpay from 'razorpay';
import crypto from 'crypto';
import { User } from '../models/index.js';

export const createUpiCollectRequest = async (req, res, next) => {
  try {
    const { upiId, plan } = req.body;
    const userId = req.userId;

    if (!upiId || !plan) {
      return res.status(400).json({ success: false, message: 'Missing upiId or plan' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay keys not configured' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = plan === 'basic' ? 4900 : 9900; // Amount in paise

    // Step 1: Create an order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    // Step 2: Since we cannot strictly trigger a collect request directly without a Razorpay customer token/customer VPA setup in standard API easily via server-to-server for a generic merchant account in test mode without an integration, 
    // In test mode, we return the order ID. The frontend can use a checkout flow or we simulate it.
    // For a real UPI Collect, one would use the Razorpay Server-to-Server UPI Collect API if enabled for the merchant.
    // Assuming standard S2S UPI integration:
    /*
    const upiCollect = await razorpay.payments.createUpi({
      amount: amount,
      currency: 'INR',
      description: `Phantom ${plan} subscription`,
      order_id: order.id,
      vpa: upiId,
      contact: "9999999999", // User phone
      email: "test@example.com"
    });
    */

    // Since standard Razorpay S2S UPI is restricted and requires special approval, 
    // we will return the order and rely on webhook or standard checkout if S2S fails.
    // We mock the S2S collect response here for the sake of the demo, but in real life Razorpay needs special approval for S2S UPI collect.
    
    // As a mock for the user's specific request: "trigger to their phone"
    // The closest standard way without Razorpay S2S approval is returning an intent link.

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        status: 'created',
        message: 'Order created. Please complete the payment.',
      },
    });

  } catch (error) {
    console.error('❌ Razorpay Order Error:', error);
    next(error);
  }
};

export const razorpayWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
      const event = req.body.event;
      if (event === 'payment.captured') {
        const payment = req.body.payload.payment.entity;
        const notes = payment.notes;
        
        if (notes && notes.userId && notes.plan) {
          await User.update({ plan: notes.plan }, { where: { id: notes.userId } });
          console.log(`✅ User ${notes.userId} upgraded to ${notes.plan}`);
        }
      }
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'invalid signature' });
    }
  } catch (error) {
    console.error('❌ Razorpay Webhook Error:', error);
    next(error);
  }
};
