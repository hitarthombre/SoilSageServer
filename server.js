const express = require("express");
const connectDB = require("./config/db");
const soilRoutes = require("./routes/soilRoutes");
const authRoutes = require("./routes/authRoutes");
const currentReadingsRoutes = require("./routes/currentReadingsRoutes");
const reportRoutes = require("./routes/reportRoutes");
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const dataCollectionService = require("./services/dataCollectionService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

// Connect to MongoDB
connectDB();

// Start data collection service
dataCollectionService.startDataCollection();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(logger);

// Routes
app.use("/api", soilRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sensors", currentReadingsRoutes);
app.use("/api/reports", reportRoutes);

// Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await dataCollectionService.stopDataCollection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await dataCollectionService.stopDataCollection();
  process.exit(0);
});
