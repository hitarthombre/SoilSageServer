const express = require("express");
const { getCurrentReadings, getBatteryStatus } = require("../controllers/currentReadingsController");

const router = express.Router();

router.get("/current-readings", getCurrentReadings);
router.get("/battery", getBatteryStatus);

module.exports = router; 