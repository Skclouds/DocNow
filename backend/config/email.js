const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAppointmentConfirmation = async (appointmentData) => {
  const { email, patientName, date, timeSlot, doctor, department } = appointmentData;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'DocNow - Appointment Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #4CAF50;">Appointment Confirmed!</h1>
          <p>Dear ${patientName},</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50;">
            <p><strong>Doctor:</strong> ${doctor}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
          </div>
          <p style="margin-top: 20px;">Please arrive 10 minutes before your scheduled time.</p>
          <p>Thank you for choosing DocNow!</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendAppointmentNotification = async (email, patientName, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `DocNow - Appointment ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello ${patientName},</h2>
        <p>Your appointment status has been updated to: <strong>${status}</strong></p>
        <p>Please check your DocNow account for more details.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendAppointmentConfirmation, sendAppointmentNotification };