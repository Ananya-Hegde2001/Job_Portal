import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const router = express.Router();

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

let instance;
if (key_id && key_secret) {
  instance = new Razorpay({ key_id, key_secret });
}

router.post('/order', async (req, res, next) => {
  try {
    if (!instance) return res.status(400).json({ error: 'Razorpay not configured' });
    const { amount, currency = 'INR', receipt } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'amount required (in paise)' });
    const order = await instance.orders.create({ amount, currency, receipt: receipt || ('rcpt_' + Date.now()) });
    res.json({ order, key: key_id });
  } catch (err) {
    next(err);
  }
});

router.post('/verify', express.json(), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const payload = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const valid = expected === razorpay_signature;
  if (!valid) return res.status(400).json({ ok: false, error: 'Invalid signature' });
  // TODO: mark user plan active in DB if needed
  res.json({ ok: true });
});

export default router;
