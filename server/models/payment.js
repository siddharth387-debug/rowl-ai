const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  purpose: { type: String, enum: ['appointment', 'resource', 'subscription'], required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);