const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/payment');
const Appointment = require('../models/appointment');
const auth = require('../middleware/auth');
const {
  isDbConnected,
  memoryPayments,
  memoryAppointments,
} = require('../utils/memoryStore');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
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

    if (isDbConnected()) {
      const payment = new Payment({
        user: req.user.id,
        razorpayOrderId: order.id,
        amount: amountInPaise,
        purpose,
        resource: resourceId || undefined,
        status: 'created',
      });
      await payment.save();

      return res.json({
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentDbId: payment._id,
      });
    }

    const memPayment = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: req.user.id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      purpose,
      resource: resourceId || undefined,
      status: 'created',
      createdAt: new Date(),
    };
    memoryPayments.push(memPayment);

    res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentDbId: memPayment._id,
    });
  } catch (err) {
    console.error('PAYMENT ROUTE ERROR:', err.message, err.stack);
    res.status(500).json({ message: 'Could not create order', error: err.message });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;
    const isValidObjectId = appointmentId && /^[0-9a-fA-F]{24}$/.test(String(appointmentId));

    if (isDbConnected()) {
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
      if (isValidObjectId) payment.appointment = appointmentId;
      await payment.save();

      if (isValidObjectId) {
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed', paymentStatus: 'paid' });
      }

      return res.json({ verified: true, payment });
    }

    const memPayment = memoryPayments.find(
      (p) => p.razorpayOrderId === razorpay_order_id && String(p.user) === String(req.user.id)
    );
    if (!memPayment) return res.status(404).json({ message: 'Payment record not found' });

    if (!isValid) {
      memPayment.status = 'failed';
      return res.status(400).json({ message: 'Payment verification failed', verified: false });
    }

    memPayment.status = 'paid';
    memPayment.razorpayPaymentId = razorpay_payment_id;
    memPayment.razorpaySignature = razorpay_signature;
    if (isValidObjectId) memPayment.appointment = appointmentId;

    if (isValidObjectId) {
      const memAppt = memoryAppointments.find((a) => String(a._id) === String(appointmentId));
      if (memAppt) {
        memAppt.status = 'confirmed';
        memAppt.paymentStatus = 'paid';
      }
    }

    res.json({ verified: true, payment: memPayment });
  } catch (err) {
    res.status(500).json({ message: 'Verification error', error: err.message });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
      return res.json(payments);
    }
    const payments = memoryPayments.filter((p) => String(p.user) === String(req.user.id));
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/resource-access/:resourceId', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      const payment = await Payment.findOne({
        user: req.user.id,
        resource: req.params.resourceId,
        status: 'paid',
      });
      return res.json({ hasAccess: !!payment });
    }
    const payment = memoryPayments.find(
      (p) =>
        String(p.user) === String(req.user.id) &&
        String(p.resource) === String(req.params.resourceId) &&
        p.status === 'paid'
    );
    res.json({ hasAccess: !!payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
