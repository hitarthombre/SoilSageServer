const SoilData = require("../models/soilModel");

// Get all plant names
const getFruits = async (req, res, next) => {
  try {
    const plants = await SoilData.find({});
    const fruits = plants.map((p) => p["Plant Name"]);
    res.json({ total: fruits.length, fruits });
  } catch (err) {
    next(err);
  }
};

// Get all stages of a specific fruit
const getStages = async (req, res, next) => {
  try {
    const { name } = req.params;
    const plant = await SoilData.findOne({
      "Plant Name": new RegExp(`^${name}$`, "i"),
    });

    if (!plant) return res.status(404).json({ error: "Fruit not found" });

    const stages = plant.Stages.map((s) => s["Growth Stage"]);
    res.json({ fruit: plant["Plant Name"], stages });
  } catch (err) {
    next(err);
  }
};

// Get details of a specific stage
const getStageDetails = async (req, res, next) => {
  try {
    const { name, stage } = req.params;
    const plant = await SoilData.findOne({
      "Plant Name": new RegExp(`^${name}$`, "i"),
    });

    if (!plant) return res.status(404).json({ error: "Fruit not found" });

    const stageDetails = plant.Stages.find(
      (s) => s["Growth Stage"].toLowerCase() === stage.toLowerCase()
    );

    if (!stageDetails)
      return res.status(404).json({ error: "Stage not found" });

    res.json({ fruit: plant["Plant Name"], stage: stageDetails });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFruits, getStages, getStageDetails };
