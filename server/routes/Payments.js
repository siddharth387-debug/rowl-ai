const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/payment');
const Appointment = require('../models/appointment');
const Resource = require('../models/resource');
const auth = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PRICING = {
  appointment: 499,
  resource: 99,
};

router.post('/create-order', auth, async (req, res) => {
  try {
    const { purpose, resourceId } = req.body;

    if (!['appointment', 'resource'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid payment purpose' });
    }

    const amountInRupees = PRICING[purpose];
    const amountInPaise = amountInRupees * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rowl_${purpose}_${Date.now()}`,
      notes: { userId: req.user.id, purpose, resourceId: resourceId || '' },
    });

    const payment = new Payment({
      user: req.user.id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      purpose,
      resource: resourceId || undefined,
      status: 'created',
    });
    await payment.save();

    res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentDbId: payment._id,
    });
  } catch (err) {
  console.error('PAYMENT ROUTE ERROR:', err.message, err.stack);
  res.status(500).json({ message: 'Could not create order', error: err.message });
}
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId, resourceId } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user.id });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Payment verification failed', verified: false });
    }

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    if (appointmentId) payment.appointment = appointmentId;
    await payment.save();

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed', paymentStatus: 'paid' });
    }

    res.json({ verified: true, payment });
  } catch (err) {
    res.status(500).json({ message: 'Verification error', error: err.message });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/resource-access/:resourceId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      user: req.user.id,
      resource: req.params.resourceId,
      status: 'paid',
    });
    res.json({ hasAccess: !!payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;