const express = require("express");
const { body } = require("express-validator");
const { signup, login } = require("../controllers/authController");
const validate = require("../middlewares/validate");

const router = express.Router();

const passwordRule = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .matches(/[a-z]/)
  .withMessage("Password must contain a lowercase letter")
  .matches(/[A-Z]/)
  .withMessage("Password must contain an uppercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain a digit")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("Password must contain a symbol");

router.post(
  "/signup",
  [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters").escape(),
    body("name").trim().notEmpty().withMessage("Name is required").escape(),
    body("surname").trim().notEmpty().withMessage("Surname is required").escape(),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    passwordRule,
    body("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("Passwords do not match"),
  ],
  validate,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

module.exports = router; 