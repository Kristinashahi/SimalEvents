import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a transporter using Mailtrap SMTP credentials
const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "727eb75afbd419", 
    pass: "cc36f5384b7421", 
  },
});



const TIME_PERIODS = [
    { id: "morning", name: "Morning", time: "7:00 AM - 11:00 AM" },
    { id: "day", name: "Day", time: "12:00 PM - 4:00 PM" },
    { id: "evening", name: "Evening", time: "5:00 PM - 9:00 PM" },
  ];
  
  export const sendBookingConfirmationEmail = async (to, booking) => {
    try {
      const mailOptions = {
        from: '"Booking App" <no-reply@bookingapp.com>',
        to,
        subject: "Booking Confirmation",
        html: `
          <h2>Booking Confirmed!</h2>
          <p>Dear ${booking.user?.name || "Customer"},</p>
          <p>Your booking has been confirmed by the vendor. Here are the details:</p>
          <ul>
            <li><strong>Service:</strong> ${booking.service?.name || "N/A"}</li>
            <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
            <li><strong>Time Periods:</strong> ${
              booking.periods
                ?.map((p) => {
                  const period = TIME_PERIODS.find((tp) => tp.id === p);
                  return period ? `${period.name} (${period.time})` : p;
                })
                .join(", ") || "N/A"
            }</li>
            <li><strong>Total Price:</strong> NPR ${booking.totalPrice || "N/A"}</li>
          </ul>
          <p>Thank you for choosing our platform!</p>
          <p>Best regards,<br/>Booking App Team</p>
        `,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send confirmation email");
    }
  };

  export const sendPasswordResetEmail = async (to, resetLink) => {
    try {
      const mailOptions = {
        from: '"SimalEvents" <no-reply@simalevents.com>',
        to,
        subject: "Password Reset Request",
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your SimalEvents account.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetLink}" style="color: #007bff; text-decoration: none;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br/>SimalEvents Team</p>
        `,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  };
