
import express from "express";
import { auth, roleAuth } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Service from "../models/Services.js";
import { initiateEsewaPayment, checkPaymentStatus, getTotalRevenue } from "../controller/esewaController.js";
import { sendBookingConfirmationEmail } from "../controller/email.js";

const router = express.Router();

router.get("/availability/:serviceId", async (req, res) => {
  try {
    const { date } = req.query;
    const { serviceId } = req.params;

    const bookings = await Booking.find({
      service: serviceId,
      date: new Date(date),
      status: "confirmed",
    });

    const bookedPeriods = bookings.flatMap((booking) => booking.periods || []);

    res.json({ bookedPeriods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { serviceId, date, periods, specialRequests, cateringPackage, totalPrice } = req.body;

    if (!serviceId || !date || !periods || periods.length === 0 || !totalPrice) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const bookingDate = new Date(new Date(date).setHours(0, 0, 0, 0));

    const conflictingBookings = await Booking.find({
      service: serviceId,
      date: {
        $gte: bookingDate,
        $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000),
      },
      status: { $in: ["confirmed", "pending"] },
      periods: { $in: periods },
    });

    if (conflictingBookings.length > 0) {
      const conflictingPeriods = [...new Set(
        conflictingBookings.flatMap((b) => b.periods).filter((p) => periods.includes(p))
      )];
      return res.status(409).json({
        message: "The following time periods are no longer available. Please select different times.",
        conflictingPeriods,
      });
    }

    if (cateringPackage) {
      if (!Array.isArray(service.cateringPackages)) {
        return res.status(500).json({ message: "Service catering packages are invalid" });
      }

      const pkg = service.cateringPackages.find((p) => {
        if (!p._id) return false;
        return p._id.toString() === cateringPackage.packageId.toString();
      });

      if (!pkg) {
        return res.status(400).json({ message: "Invalid catering package" });
      }

      if (cateringPackage.guestCount < pkg.minGuests || cateringPackage.guestCount > pkg.maxGuests) {
        return res.status(400).json({
          message: `Guest count must be between ${pkg.minGuests} and ${pkg.maxGuests} for this package`,
        });
      }

      if (cateringPackage.selectedItems) {
        for (const item of cateringPackage.selectedItems) {
          if (!item.menuItemId) {
            return res.status(400).json({ message: "Menu item ID is required" });
          }

          if (item.isSectionItem) continue;

          const isIncluded = pkg.includedItems?.some((i) => i.menuItemId === item.menuItemId) || false;
          const isOptional = pkg.optionalItems?.some((i) => i.menuItemId === item.menuItemId) || false;

          if (!isIncluded && !isOptional) {
            return res.status(400).json({ message: `Invalid menu item selection: ${item.menuItemId}` });
          }

          if (isOptional) {
            const optItem = pkg.optionalItems.find((i) => i.menuItemId === item.menuItemId);
            if (optItem?.maxSelection > 0 && item.quantity > optItem.maxSelection) {
              return res.status(400).json({
                message: `Cannot select more than ${optItem.maxSelection} of ${item.menuItemId}`,
              });
            }
          }
        }
      }
    }

    const booking = new Booking({
      user: req.user.id,
      vendor: service.vendor,
      service: serviceId,
      date: new Date(date),
      periods,
      cateringPackage,
      totalPrice,
      specialRequests,
      status: "pending",
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

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
    )
      .populate("user", "name email")
      .populate("service", "name");

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    // Send email notification if booking is confirmed
    if (status === "confirmed" && booking.user?.email) {
      try {
        await sendBookingConfirmationEmail(booking.user.email, booking);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Note: Don't fail the request if email sending fails
      }
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/initiate-payment", auth, initiateEsewaPayment);

router.post("/verify-payment", auth, checkPaymentStatus);

router.get("/vendor/revenue", auth, roleAuth(["vendor"]), getTotalRevenue);

router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found or not authorized" });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        msg: "Can only cancel pending or confirmed bookings",
        currentStatus: booking.status,
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/vendor/revenue", auth, async (req, res) => {
  try {
    // Ensure the user is a vendor
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Aggregate total revenue from completed payments
    const revenue = await Booking.aggregate([
      {
        $match: {
          vendor: req.user.id,
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
    res.json({ totalRevenue });
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;