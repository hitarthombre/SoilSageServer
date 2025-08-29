const express = require("express");
const { body, query } = require("express-validator");
const {
  generateReport,
  getReportData,
  getLast24HoursData,
  downloadReport
} = require("../controllers/reportController");
const validate = require("../middlewares/validate");

const router = express.Router();

const isValidDateInput = (value) => {
  if (typeof value !== "string") return false;
  // Accept YYYY-MM-DD or any parsable ISO date string
  const trimmed = value.trim();
  if (!trimmed) return false;
  const parsed = Date.parse(trimmed);
  return !Number.isNaN(parsed);
};

// Generate PDF report
router.post(
  "/generate",
  [
    body("startDate").custom(isValidDateInput).withMessage("Start date must be a valid date (YYYY-MM-DD or ISO)"),
    body("endDate").custom(isValidDateInput).withMessage("End date must be a valid date (YYYY-MM-DD or ISO)"),
    body("reportType").optional().isIn(["daily", "detailed", "twoHourly24h"]).withMessage("Report type must be 'daily', 'detailed' or 'twoHourly24h'")
  ],
  validate,
  generateReport
);

// Get report data for a date range
router.get(
  "/data",
  [
    query("startDate").custom(isValidDateInput).withMessage("Start date must be a valid date (YYYY-MM-DD or ISO)"),
    query("endDate").custom(isValidDateInput).withMessage("End date must be a valid date (YYYY-MM-DD or ISO)")
  ],
  validate,
  getReportData
);

// Get last 24 hours data
router.get("/last24hours", getLast24HoursData);

// Download generated report
router.get("/download/:filename", downloadReport);

module.exports = router; 