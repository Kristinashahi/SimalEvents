import express from "express";
import { auth } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Service from "../models/Services.js";
import User from "../models/user.js";

const router = express.Router();

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
    const { serviceId, date, periods, package: pkg, guestCount } = req.body;

    // Validate input
    if (!serviceId || !date || !periods || periods.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Validate package if selected
    if (pkg) {
      const validPackage = service.packages.find(p => p._id.toString() === pkg._id);
      if (!validPackage) {
        return res.status(400).json({ message: "Invalid package selected" });
      }
      if (guestCount < validPackage.minGuests || guestCount > validPackage.maxGuests) {
        return res.status(400).json({ 
          message: `Guest count must be between ${validPackage.minGuests}-${validPackage.maxGuests} for this package`
        });
      }
    }

    // Check availability
    const conflictingBookings = await Booking.find({
      service: serviceId,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] },
      periods: { $in: periods }
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ 
        message: "Some selected periods are already booked",
        conflictingPeriods: [...new Set(conflictingBookings.flatMap(b => b.periods))]
      });
    }

    // Calculate total price
    let totalPrice;
    if (pkg) {
      totalPrice = pkg.price * guestCount * periods.length;
    } else {
      totalPrice = service.price * periods.length;
    }

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      vendor: service.vendor,
      service: serviceId,
      date: new Date(date),
      periods,
      package: pkg,
      guestCount: pkg ? guestCount : null,
      totalPrice,
      specialRequests: req.body.specialRequests,
      status: "pending"
    });

    await booking.save();
    
    // Populate user and service details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('service', 'name');

    res.status(201).json(populatedBooking);
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
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
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