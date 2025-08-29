const express = require("express");
const { body, query } = require("express-validator");
const { calibrate, getLatestCalibration } = require("../controllers/calibrationController");
const validate = require("../middlewares/validate");

const router = express.Router();

router.post(
  "/",
  [
    body("days").optional().isInt({ min: 1, max: 60 }).withMessage("days must be 1-60"),
    body("strategy").optional().isIn(["median", "avg"]).withMessage("strategy must be 'median' or 'avg'"),
    body("fruit").optional().isString().trim()
  ],
  validate,
  calibrate
);

router.get(
  "/latest",
  [
    query("fruit").optional().isString().trim()
  ],
  validate,
  getLatestCalibration
);

module.exports = router; 