import express from "express";
import { auth } from "../middleware/auth.js";
import Service from "../models/Services.js";
import upload from "../controller/multerconfig.js"; // Import your multer config

const router = express.Router();

// Create a service (vendor only) - Updated for image upload
router.post("/", auth, upload.array('images', 5), async (req, res) => {
  try {
    // Check if user is a vendor
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can create services" });
    }

    // Check if vendor already has a service
    const existingService = await Service.findOne({ vendor: req.user.id });
    if (existingService) {
      return res.status(400).json({ msg: "Vendor can only have one service" });
    }

    // Parse features if provided
    let features = [];
    if (req.body.features) {
      try {
        features = typeof req.body.features === 'string' 
          ? JSON.parse(req.body.features) 
          : req.body.features;
      } catch (err) {
        console.error("Error parsing features:", err);
        return res.status(400).json({ message: 'Invalid features format' });
      }
    }

    // Parse packages if provided
    let packages = [];
    if (req.body.packages) {
      try {
        packages = typeof req.body.packages === 'string' 
          ? JSON.parse(req.body.packages) 
          : req.body.packages;
      } catch (err) {
        console.error("Error parsing packages:", err);
        return res.status(400).json({ message: 'Invalid packages format' });
      }
    }

    // Get uploaded files
    const images = req.files?.map(file => file.path.replace(/\\/g, '/')) || [];

    // Create new service with images
    const service = new Service({
      ...req.body,
      features, // Add parsed features
      packages, // Add parsed packages
      vendor: req.user.id,
      images, // Add image paths
      status: "active" // or "pending" if you want admin approval
    });

    await service.save();
    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});




// Update service with image handling
router.put("/:id", auth, upload.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const service = await Service.findOne({ 
      _id: req.params.id, 
      vendor: req.user.id 
    });

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    // Get new images if uploaded
    const newImages = req.files?.map(file => file.path.replace(/\\/g, '/')) || [];
    
    // Combine existing images with new ones
    const updatedImages = [...service.images, ...newImages];

    // Parse features if provided
    let features = service.features;
    if (req.body.features) {
      try {
        features = typeof req.body.features === 'string' 
          ? JSON.parse(req.body.features) 
          : req.body.features;
      } catch (err) {
        console.error("Error parsing features:", err);
        return res.status(400).json({ message: 'Invalid features format' });
      }
    }

    const updatedService = await Service.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { 
        ...req.body,
        features,
        images: updatedImages 
      },
      { new: true }
    );

    res.json(updatedService);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put('/:id/images', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { imageUrlsToDelete } = req.body;
    
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { $pull: { images: { $in: imageUrlsToDelete } } },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    // Optional: Add filesystem cleanup here if needed
    // imageUrlsToDelete.forEach(deleteFileFromServer);

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all services (no changes needed)
router.get("/", async (req, res) => {
  try {
    const services = await Service.find({ status: "active" })
      .populate('vendor', 'businessName email phoneNumber');
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get vendor's service (no changes needed)
router.get("/my-service", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const service = await Service.findOne({ vendor: req.user.id })
      .populate('vendor', 'businessName email phoneNumber');
      
    if (!service) {
      return res.status(404).json({ msg: "No service found" });
    }

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// Delete service (no changes needed)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user.id
    });

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json({ msg: "Service deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Manage availability (no changes needed)
router.post("/:id/availability", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { availability: req.body.availability },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('vendor', 'businessName email phoneNumber');
      
    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

//service packages 
router.post("/:id/packages", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { packages } = req.body;
    
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { packages },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;