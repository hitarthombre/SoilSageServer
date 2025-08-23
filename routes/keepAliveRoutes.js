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
    message: "Soil Sage is Running, Thanks For Verifying !!!"
  });
});

module.exports = router; 