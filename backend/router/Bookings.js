import express from "express";
import { auth } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Service from "../models/Services.js";
import User from "../models/user.js";
import axios from "axios";

const router = express.Router();

const KHALTI_API_URL = process.env.KHALTI_API_URL || "https://dev.khalti.com/api/v2/";
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;

router.get('/availability/:serviceId', async (req, res) => {
    try {
      const { date } = req.query;
      const { serviceId } = req.params;
      
      // Only check confirmed bookings for availability
      const bookings = await Booking.find({
        service: serviceId,
        date: new Date(date),
        status: 'confirmed' // Only confirmed bookings block availability
      });
  
      // Get all booked periods
      const bookedPeriods = bookings.flatMap(booking => 
        booking.periods || [] // Use periods if available, otherwise empty array
      );
      
      res.json({ bookedPeriods });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  

// Create a new booking
router.post("/", auth, async (req, res) => {
  try {
    const { serviceId, date, periods, specialRequests, cateringPackage, totalPrice } = req.body;

    // Validate input
    if (!serviceId || !date || !periods || periods.length === 0 || !totalPrice) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Get the service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const bookingDate = new Date(new Date(date).setHours(0,0,0,0));

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      service: serviceId,
      date: {
        $gte: bookingDate,
        $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['confirmed', 'pending'] },
      periods: { $in: periods }
    });

    if (conflictingBookings.length > 0) {
      const conflictingPeriods = [...new Set(
        conflictingBookings.flatMap(b => b.periods)
        .filter(p => periods.includes(p))
)];
      
      return res.status(409).json({ 
        message: "The following time periods are no longer available. Please select different times.",
        conflictingPeriods 
      });
    }

    // Validate catering package if included
    if (cateringPackage) {
      // Ensure cateringPackages is an array
      if (!Array.isArray(service.cateringPackages)) {
        return res.status(500).json({ message: "Service catering packages are invalid" });
      }
    
      const pkg = service.cateringPackages.find(p => {
        // Skip packages without _id
        if (!p._id) return false;
        // Ensure both sides are strings for comparison
        return p._id.toString() === cateringPackage.packageId.toString();
      });
    
      if (!pkg) {
        return res.status(400).json({ message: "Invalid catering package" });
      }
    
      // Validate guest count
      if (cateringPackage.guestCount < pkg.minGuests || cateringPackage.guestCount > pkg.maxGuests) {
        return res.status(400).json({ 
          message: `Guest count must be between ${pkg.minGuests} and ${pkg.maxGuests} for this package`
        });
      }
    
      // Validate selected menu items
      if (cateringPackage.selectedItems) {
        for (const item of cateringPackage.selectedItems) {
          if (!item.menuItemId) {
            return res.status(400).json({ message: "Menu item ID is required" });
          }
      
          // Skip validation for section items
          if (item.isSectionItem) continue;
      
          // Check if item exists in package
          const isIncluded = pkg.includedItems?.some(i => i.menuItemId === item.menuItemId) || false;
          const isOptional = pkg.optionalItems?.some(i => i.menuItemId === item.menuItemId) || false;
          
          if (!isIncluded && !isOptional) {
            return res.status(400).json({ message: `Invalid menu item selection: ${item.menuItemId}` });
          }
      
          // Check optional item limits
          if (isOptional) {
            const optItem = pkg.optionalItems.find(i => i.menuItemId === item.menuItemId);
            if (optItem?.maxSelection > 0 && item.quantity > optItem.maxSelection) {
              return res.status(400).json({ 
                message: `Cannot select more than ${optItem.maxSelection} of ${item.menuItemId}`
              });
            }
          }
        }
      }
    }

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      vendor: service.vendor,
      service: serviceId,
      date: new Date(date),
      periods,
      cateringPackage,
      totalPrice,
      specialRequests,
      status: "pending"
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's bookings
router.get("/user", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("vendor", "businessName")
      .populate("service", "name price images")
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get vendor's bookings
router.get("/vendor", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can access this route" });
    }

    const bookings = await Booking.find({ vendor: req.user.id })
      .populate("user", "name email")
      .populate("service", "name price")
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update booking status (vendor only)
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can update booking status" });
    }

    const { status } = req.body;
    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    // If confirmed, initiate Khalti payment
    if (status === "confirmed") {
      const paymentInitiation = await initiateKhaltiPayment(booking);
      booking.payment = {
        paymentId: paymentInitiation.pidx,
        status: "pending",
        amount: booking.totalPrice * 100, // Convert NPR to paisa
      };
      await booking.save();
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// New route: Initiate Khalti payment
const initiateKhaltiPayment = async (booking) => {
  try {
    const vendor = await User.findById(booking.vendor);
    if (!vendor.khaltiMerchantId) {
      throw new Error("Vendor has not configured Khalti merchant ID");
    }

    const response = await axios.post(
      `${KHALTI_API_URL}epayment/initiate/`,
      {
        return_url: "http://localhost:5173/user-dashboard",
        website_url: "http://localhost:5173",
        amount: booking.totalPrice * 100,
        purchase_order_id: booking._id.toString(),
        purchase_order_name: `Booking for ${booking.service.name}`,
        customer_info: {
          name: booking.user.name || "Customer",
          email: booking.user.email || "customer@example.com",
          phone: "9800000000",
        },
        merchant_id: vendor.khaltiMerchantId, // Direct payment to vendor
      },
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    throw new Error("Failed to initiate Khalti payment: " + err.message);
  }
};

router.post("/:id/verify-payment", auth, async (req, res) => {
  const { id } = req.params;
  const { pidx } = req.body;

  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { pidx },
      { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` } }
    );

    if (response.data.status === "Completed") {
      const booking = await Booking.findByIdAndUpdate(
        id,
        {
          "payment.paymentId": response.data.txn_id,
          "payment.status": "completed",
          "payment.amount": response.data.amount / 100,
          "payment.paidAt": new Date(),
          status: "paid",
        },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ msg: "Booking not found" });
      }

      return res.json({ msg: "Payment verified successfully" });
    } else {
      return res.status(400).json({ msg: "Payment not completed" });
    }
  } catch (error) {
    console.error("Payment verification error:", error.response?.data || error.message);
    return res.status(500).json({ msg: "Payment verification failed" });
  }
});

// Payment callback
router.get("/:id/payment-callback", async (req, res) => {
  const { id } = req.params;
  const { pidx, status, txnId, amount } = req.query;

  try {
    if (status !== "Completed") {
      return res.redirect("http://localhost:5173/user?payment=failed");
    }

    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { pidx },
      { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` } }
    );

    if (response.data.status === "Completed") {
      await Booking.findByIdAndUpdate(id, {
        "payment.paymentId": txnId,
        "payment.status": "completed",
        "payment.amount": amount / 100,
        "payment.paidAt": new Date(),
        status: "paid",
      });

      return res.redirect("http://localhost:5173/user?payment=success");
    } else {
      return res.redirect("http://localhost:5173/user?payment=failed");
    }
  } catch (error) {
    console.error("Payment callback error:", error.response?.data || error.message);
    return res.redirect("http://localhost:5173/user?payment=failed");
  }
});

// User cancels booking
router.put("/:id/cancel", auth, async (req, res) => {
    try {
        // Find booking and verify the user owns it
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            return res.status(404).json({ msg: "Booking not found or not authorized" });
        }

        // Only allow cancelling pending or confirmed bookings
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ 
                msg: "Can only cancel pending or confirmed bookings",
                currentStatus: booking.status
            });
        }

        booking.status = 'cancelled';
        await booking.save();
        
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
});







export default router;
