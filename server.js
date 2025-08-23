const express = require("express");
const connectDB = require("./config/db");
const soilRoutes = require("./routes/soilRoutes");
const authRoutes = require("./routes/authRoutes");
const currentReadingsRoutes = require("./routes/currentReadingsRoutes");
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(logger);

// Routes
app.use("/api", soilRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sensors", currentReadingsRoutes);

// Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
