const express = require("express");
const connectDB = require("./config/db");
const soilRoutes = require("./routes/soilRoutes");
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use("/api", soilRoutes);

// Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
