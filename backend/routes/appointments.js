const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendAppointmentConfirmation, sendAppointmentNotification } = require('../config/email');

// Create appointment (User)
// Create appointment (User)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('=================================');
    console.log('📝 Appointment Request Received');
    console.log('User ID:', req.user.userId);
    console.log('Request Body:', req.body);
    console.log('=================================');
    
    const appointment = new Appointment({
      ...req.body,
      userId: req.user.userId,
      status: 'pending',
    });

    console.log('💾 Attempting to save appointment...');
    const savedAppointment = await appointment.save();
    console.log('✅ Appointment saved successfully:', savedAppointment._id);
    
    res.status(201).json({ 
      message: 'Appointment created successfully', 
      appointment: savedAppointment 
    });
  } catch (error) {
    console.error('❌ ERROR DETAILS:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    console.error('=================================');
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: error.toString()
    });
  }
});

// Get user's appointments
router.get('/my-appointments', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all appointments (Admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('userId', 'name email phone').sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment status (Admin)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes, confirmedBy: req.user.userId, updatedAt: Date.now() },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Send email notification
    if (status === 'confirmed') {
      await sendAppointmentConfirmation({
        email: appointment.email,
        patientName: appointment.patientName,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        doctor: appointment.doctor,
        department: appointment.department,
      });
    } else {
      await sendAppointmentNotification(appointment.email, appointment.patientName, status);
    }

    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;