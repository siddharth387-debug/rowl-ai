const router = require('express').Router();
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// Book appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctor, date, timeSlot, type, concern } = req.body;
    const appointment = new Appointment({ patient: req.user.id, doctor, date, timeSlot, type, concern });
    await appointment.save();
    await appointment.populate(['patient', 'doctor'], 'name email');
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my appointments
router.get('/mine', auth, async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user.id } : { patient: req.user.id };
    const appointments = await Appointment.find(query).populate('patient doctor', 'name email avatar').sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: req.body.status, notes: req.body.notes }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
