const express = require("express");
const router = express.Router();
const {
  getFruits,
  getStages,
  getStageDetails,
} = require("../controllers/soilController");

router.get("/fruits", getFruits);
router.get("/fruits/:name/stages", getStages);
router.get("/fruits/:name/stages/:stage", getStageDetails);

module.exports = router;
