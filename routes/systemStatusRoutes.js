const express = require("express");
const {
  getSystemStatus,
  getCollectionHistory,
  testDataCollection,
  getDataCollectionLogs
} = require("../controllers/systemStatusController");

const router = express.Router();

// Get overall system status
router.get("/status", getSystemStatus);

// Get recent collection history
router.get("/history", getCollectionHistory);

// Test data collection manually
router.post("/test-collection", testDataCollection);

// Get detailed collection logs
router.get("/logs", getDataCollectionLogs);

module.exports = router; 