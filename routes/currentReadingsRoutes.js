const express = require("express");
const { getCurrentReadings } = require("../controllers/currentReadingsController");

const router = express.Router();

router.get("/current-readings", getCurrentReadings);

module.exports = router; 