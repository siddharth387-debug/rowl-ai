const router = require('express').Router();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { generateClinicalBrief } = require('../services/aiService');

// Book appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctor, date, timeSlot, type, concern } = req.body;
    const appointment = new Appointment({
      patient: req.user.id,
      doctor,
      date,
      timeSlot,
      type,
      concern,
    });
    await appointment.save();
    await appointment.populate(['patient', 'doctor'], 'name email specialization avatar healingStage');
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my appointments (returns doctor's sessions if role === 'doctor', else patient's sessions)
router.get('/mine', auth, async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user.id } : { patient: req.user.id };
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email avatar healingStage ptsdScore')
      .populate('doctor', 'name email avatar specialization')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate AI Pre-Session Clinical Brief for a specific appointment (Doctor / Patient view)
router.get('/:id/clinical-brief', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const patient = await User.findById(appointment.patient)
      .select('name healingStage ptsdScore journalEntries aiMemorySummary shareInsightsWithDoctor')
      .lean();

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const brief = await generateClinicalBrief(patient, appointment.concern);
    res.json({
      patientName: patient.name,
      healingStage: patient.healingStage,
      ptsdScore: patient.ptsdScore,
      journalCount: patient.journalEntries?.length || 0,
      brief,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update appointment status & clinical notes
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    )
      .populate('patient', 'name email avatar healingStage ptsdScore')
      .populate('doctor', 'name email avatar specialization');

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
