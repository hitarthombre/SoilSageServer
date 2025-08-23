const mongoose = require("mongoose");

const dailyAggregateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true, index: true },
    sunlight_hours: { type: Number, required: true, default: 0 }, // Total hours with sunlight
    water_level_avg: { type: Number, required: true, default: 0 }, // Average moisture percentage
    uv_exposure_hours: { type: Number, required: true, default: 0 }, // Total hours with UV > threshold
    uv_threshold: { type: Number, required: true, default: 3.0 }, // UV index threshold for exposure
    
    // Aggregated sensor data
    temperature: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      avg: { type: Number, required: true }
    },
    humidity: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      avg: { type: Number, required: true }
    },
    moisture_percent: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      avg: { type: Number, required: true }
    },
    uv_index: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      avg: { type: Number, required: true }
    },
    lux: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      avg: { type: Number, required: true }
    },
    
    // Data collection stats
    total_readings: { type: Number, required: true, default: 0 },
    collection_start: { type: Date, required: true },
    collection_end: { type: Date, required: true }
  },
  { 
    timestamps: true,
    collection: "DailyAggregates"
  }
);

// Index for date range queries
dailyAggregateSchema.index({ date: 1 });

module.exports = mongoose.model("DailyAggregate", dailyAggregateSchema); 