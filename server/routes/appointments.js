const router = require('express').Router();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { generateClinicalBrief } = require('../services/aiService');
const {
  isDbConnected,
  memoryAppointments,
  findMemoryUserById,
} = require('../utils/memoryStore');

// Book appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctor, date, timeSlot, type, concern } = req.body;
    if (isDbConnected()) {
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
      return res.json(appointment);
    }

    const patientDoc = findMemoryUserById(req.user.id) || { _id: req.user.id, name: 'Rowl Patient', email: '' };
    const doctorDoc = findMemoryUserById(doctor) || { _id: doctor, name: 'Dr. Priya Menon', specialization: 'Trauma & PTSD', avatar: '🌸' };
    const appt = {
      _id: new mongoose.Types.ObjectId().toString(),
      patient: { _id: patientDoc._id, name: patientDoc.name, email: patientDoc.email, healingStage: patientDoc.healingStage || 'beginning' },
      doctor: { _id: doctorDoc._id, name: doctorDoc.name, email: doctorDoc.email, specialization: doctorDoc.specialization, avatar: doctorDoc.avatar || '🌸' },
      date,
      timeSlot,
      type: type || 'video',
      concern: concern || '',
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date(),
    };
    memoryAppointments.push(appt);
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my appointments (returns doctor's sessions if role === 'doctor', else patient's sessions)
router.get('/mine', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      const query = req.user.role === 'doctor' ? { doctor: req.user.id } : { patient: req.user.id };
      const appointments = await Appointment.find(query)
        .populate('patient', 'name email avatar healingStage ptsdScore')
        .populate('doctor', 'name email avatar specialization')
        .sort({ date: 1 });
      return res.json(appointments);
    }

    const filtered = memoryAppointments.filter((a) =>
      req.user.role === 'doctor'
        ? String(a.doctor?._id || a.doctor) === String(req.user.id)
        : String(a.patient?._id || a.patient) === String(req.user.id)
    );
    res.json(filtered);
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

    if (isDbConnected()) {
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
      return res.json({
        patientName: patient.name,
        healingStage: patient.healingStage,
        ptsdScore: patient.ptsdScore,
        journalCount: patient.journalEntries?.length || 0,
        brief,
      });
    }

    const memAppt = memoryAppointments.find((a) => String(a._id) === String(req.params.id));
    if (!memAppt) return res.status(404).json({ message: 'Appointment not found' });
    const patient = findMemoryUserById(memAppt.patient?._id || memAppt.patient) || memAppt.patient || { name: 'Rowl Patient', healingStage: 'beginning' };
    const brief = await generateClinicalBrief(patient, memAppt.concern);
    res.json({
      patientName: patient.name,
      healingStage: patient.healingStage || 'beginning',
      ptsdScore: patient.ptsdScore || 0,
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

    if (isDbConnected()) {
      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      )
        .populate('patient', 'name email avatar healingStage ptsdScore')
        .populate('doctor', 'name email avatar specialization');

      return res.json(appointment);
    }

    const memAppt = memoryAppointments.find((a) => String(a._id) === String(req.params.id));
    if (!memAppt) return res.status(404).json({ message: 'Appointment not found' });
    Object.assign(memAppt, updateFields);
    res.json(memAppt);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
