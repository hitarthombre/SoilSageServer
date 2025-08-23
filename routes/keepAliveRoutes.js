const express = require("express");
const { keepAlive, healthCheck } = require("../controllers/keepAliveController");

const router = express.Router();

// Keep-alive endpoint for external ping services
router.get("/keep-alive", keepAlive);

// Simple health check for monitoring services
router.get("/health", healthCheck);

// Root endpoint that also keeps server awake
router.get("/", (req, res) => {
  res.json({
    message: "Soil Sage Server is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      keepAlive: "/keep-alive",
      health: "/health",
      sensors: "/api/sensors",
      auth: "/api/auth",
      reports: "/api/reports",
      system: "/api/system"
    }
  });
});

module.exports = router; 