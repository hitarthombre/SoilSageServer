const SensorData = require("../models/sensorDataModel");
const Calibration = require("../models/calibrationModel");

const computeStats = (values) => {
  if (!values.length) return { avg: null, median: null };
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return { avg, median };
};

const calibrate = async (req, res, next) => {
  try {
    const { days = 7, strategy = "median", fruit = null } = req.body || {};
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    const data = await SensorData.find({ timestamp: { $gte: start, $lte: end } }).select("lux moisture_percent moisture_percent_2 moisture_percent_3 temperature humidity uv_index");

    const luxStats = computeStats(data.map(d => d.lux).filter(v => v != null));
    const moistStats = computeStats(data.map(d => d.moisture_percent).filter(v => v != null));
    const moistStats2 = computeStats(data.map(d => d.moisture_percent_2).filter(v => v != null));
    const moistStats3 = computeStats(data.map(d => d.moisture_percent_3).filter(v => v != null));
    const tempStats = computeStats(data.map(d => d.temperature).filter(v => v != null));
    const humStats = computeStats(data.map(d => d.humidity).filter(v => v != null));
    const uvStats = computeStats(data.map(d => d.uv_index).filter(v => v != null));

    const pick = (stats) => strategy === "avg" ? stats.avg : stats.median;

    const targets = {
      sunlight_lux: pick(luxStats) ?? null,
      moisture_percent: pick(moistStats) ?? null,
      moisture_percent_2: pick(moistStats2) ?? null,
      moisture_percent_3: pick(moistStats3) ?? null,
      temperature_c: pick(tempStats) ?? null,
      humidity_percent: pick(humStats) ?? null,
      uv_index: pick(uvStats) ?? null,
    };

    const calibration = await Calibration.create({ fruit, sourceDays: days, strategy, targets, calculatedAt: new Date() });

    return res.status(201).json({ success: true, data: { calibration } });
  } catch (err) {
    next(err);
  }
};

const getLatestCalibration = async (req, res, next) => {
  try {
    const { fruit = null } = req.query || {};
    const calibration = await Calibration.findOne({ fruit }).sort({ calculatedAt: -1 });
    if (!calibration) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No calibration found" } });
    return res.status(200).json({ success: true, data: { calibration } });
  } catch (err) {
    next(err);
  }
};

module.exports = { calibrate, getLatestCalibration }; 