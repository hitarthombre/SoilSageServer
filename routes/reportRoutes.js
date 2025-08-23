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

// Generate PDF report
router.post(
  "/generate",
  [
    body("startDate").isISO8601().withMessage("Start date must be a valid ISO date"),
    body("endDate").isISO8601().withMessage("End date must be a valid ISO date"),
    body("reportType").optional().isIn(["daily", "detailed"]).withMessage("Report type must be 'daily' or 'detailed'")
  ],
  validate,
  generateReport
);

// Get report data for a date range
router.get(
  "/data",
  [
    query("startDate").isISO8601().withMessage("Start date must be a valid ISO date"),
    query("endDate").isISO8601().withMessage("End date must be a valid ISO date")
  ],
  validate,
  getReportData
);

// Get last 24 hours data
router.get("/last24hours", getLast24HoursData);

// Download generated report
router.get("/download/:filename", downloadReport);

module.exports = router; 