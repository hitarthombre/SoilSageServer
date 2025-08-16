const mongoose = require("mongoose");

const stageSchema = new mongoose.Schema({
  "Growth Stage": String,
  Moisture: String,
  pH: String,
  Sunlight: String,
  "UV Light": String,
  "Water (per week)": String,
});

const soilSchema = new mongoose.Schema(
  {
    "Plant Name": { type: String, required: true },
    Stages: [stageSchema],
  },
  { collection: "SoilData" } // Map explicitly to SoilData collection
);

module.exports = mongoose.model("SoilData", soilSchema);
