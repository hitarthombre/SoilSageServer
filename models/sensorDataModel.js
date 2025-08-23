const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true, index: true },
    battery_percent: { type: Number, required: true },
    battery_voltage: { type: Number, required: true },
    humidity: { type: Number, required: true },
    irradiance: { type: Number, required: true },
    lux: { type: Number, required: true },
    moisture_percent: { type: Number, required: true },
    moisture_raw: { type: Number, required: true },
    temperature: { type: Number, required: true },
    uv_index: { type: Number, required: true },
    uv_intensity: { type: Number, required: true },
    uv_raw: { type: Number, required: true },
    uv_voltage: { type: Number, required: true }
  },
  { 
    timestamps: true,
    collection: "SensorData"
  }
);

// TTL index to automatically delete documents after 24 hours (86400 seconds)
sensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

// Index for date range queries
sensorDataSchema.index({ timestamp: 1 });

module.exports = mongoose.model("SensorData", sensorDataSchema); 