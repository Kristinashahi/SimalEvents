
import { EsewaPaymentGateway, EsewaCheckStatus } from "esewajs";
import Transaction from "../models/Transaction.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config();

export const initiateEsewaPayment = async (req, res) => {
  const { bookingId, amount } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return res.status(404).json({ message: "Booking not found" });
    }

    const productId = `BOOKING-${bookingId}-${Date.now()}`; // Unique product ID
    const reqPayment = await EsewaPaymentGateway(
      amount,
      0, // productDeliveryCharge
      0, // productServiceCharge
      0, // taxAmount
      productId,
      process.env.MERCHANT_ID,
      process.env.SECRET,
      process.env.SUCCESS_URL,
      process.env.FAILURE_URL,
      process.env.ESEWAPAYMENT_URL,
      undefined, // algorithm (defaults to sha256)
      undefined // encoding (defaults to base64)
    );

    if (!reqPayment || reqPayment.status !== 200) {
      console.error(`Failed to initiate payment: ${JSON.stringify(reqPayment)}`);
      return res.status(400).json({ message: "Error initiating payment" });
    }

    // Save transaction
    const transaction = new Transaction({
      product_id: productId,
      amount,
      status: "PENDING",
      booking: bookingId,
    });
    await transaction.save();

    // Update booking with transaction ID
    booking.payment = {
      paymentId: productId,
      status: "pending",
      amount,
    };
    await booking.save();

    //console.log(`Payment initiated for product_id: ${productId}, booking: ${bookingId}`);
    res.json({ url: reqPayment.request.res.responseUrl });
  } catch (error) {
    //console.error("Error initiating eSewa payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const checkPaymentStatus = async (req, res) => {
  const { product_id } = req.body;

 // console.log(`Checking payment status for product_id: ${product_id}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await Transaction.findOne({ product_id }).session(session);
    if (!transaction) {
      //console.error(`Transaction not found for product_id: ${product_id}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

    const booking = await Booking.findById(transaction.booking).session(session);
    if (!booking) {
      //console.error(`Booking not found for ID: ${transaction.booking}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Associated booking not found" });
    }

    const paymentStatusCheck = await EsewaCheckStatus(
      transaction.amount,
      transaction.product_id,
      process.env.MERCHANT_ID,
      process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    //console.log(`eSewa payment status response: ${JSON.stringify(paymentStatusCheck)}`);

    if (paymentStatusCheck.status === 200 && paymentStatusCheck.data.status === "COMPLETE") {
      // Update transaction
      transaction.status = "COMPLETE";
      await transaction.save({ session });

      // Update booking
      booking.status = "paid";
      booking.payment.status = "completed";
      booking.payment.paidAt = new Date();
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();

      //console.log(`Payment verified: Transaction ${product_id} set to COMPLETE, Booking ${transaction.booking} set to paid`);
      res.status(200).json({ message: "Payment verified successfully" });
    } else {
      // Update transaction to FAILED
      transaction.status = "FAILED";
      await transaction.save({ session });

      // Update booking payment status to failed
      booking.payment.status = "failed";
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();

      //console.log(`Payment failed: Transaction ${product_id} set to FAILED, Booking ${transaction.booking} payment status set to failed`);
      res.status(400).json({ message: "Payment not completed" });
    }
  } catch (error) {
   // console.error("Error checking payment status:", error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Server error", error: error.message });
  }
  
}

export const getTotalRevenue = async (req, res) => {
    try {
      const vendorId = req.user.id;
  
      // Aggregate totalPrice for bookings with payment.status = "completed"
      const revenue = await Booking.aggregate([
        {
          $match: {
            vendor: new mongoose.Types.ObjectId(vendorId),
            "payment.status": "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]);
  
      const totalRevenue = revenue.length > 0 ? revenue[0].totalRevenue : 0;
  
      res.status(200).json({ totalRevenue });
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      res.status(500).json({ msg: "Failed to fetch total revenue" });
    }
  };