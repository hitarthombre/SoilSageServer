const SoilData = require("../models/soilModel");

// Get all plants with only names and URLs
const getFruits = async (req, res, next) => {
  try {
    const plants = await SoilData.aggregate([
      {
        $group: {
          _id: "$Plant Name",
          uri: { $first: "$Uri" } // Pick first available image URL if exists
        }
      },
      { $project: { _id: 0, name: "$_id", uri: 1 } },
      { $sort: { name: 1 } } // Optional: sort alphabetically
    ]);

    res.json({
      total: plants.length,
      fruits: plants,
    });
  } catch (err) {
    next(err);
  }
};

// Get all stages of a specific fruit (only stage names)
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
