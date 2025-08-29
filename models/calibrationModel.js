const mongoose = require("mongoose");

const calibrationSchema = new mongoose.Schema(
  {
    fruit: { type: String, required: false, index: true, default: null },
    sourceDays: { type: Number, required: true, default: 7 },
    calculatedAt: { type: Date, required: true, default: Date.now },
    strategy: { type: String, required: true, default: "median" },
    targets: {
      sunlight_lux: { type: Number, required: false, default: null },
      moisture_percent: { type: Number, required: false, default: null },
      temperature_c: { type: Number, required: false, default: null },
      humidity_percent: { type: Number, required: false, default: null },
      uv_index: { type: Number, required: false, default: null },
    }
  },
  { timestamps: true, collection: "Calibrations" }
);

calibrationSchema.index({ fruit: 1, calculatedAt: -1 });

module.exports = mongoose.model("Calibration", calibrationSchema); 