const dataCollectionService = require("../services/dataCollectionService");
const SensorData = require("../models/sensorDataModel");
const DailyAggregate = require("../models/dailyAggregateModel");

const getSystemStatus = async (req, res, next) => {
  try {
    const status = {
      dataCollection: {
        isRunning: dataCollectionService.isRunning,
        lastCollection: null,
        nextCollection: null,
        totalCollections: 0
      },
      dataStats: {
        totalSensorReadings: 0,
        totalDailyAggregates: 0,
        oldestData: null,
        newestData: null
      },
      performance: {
        collectionInterval: "10 minutes",
        aggregationSchedule: "Daily at midnight",
        ttlExpiration: "24 hours"
      }
    };

    // Get data collection stats
    if (dataCollectionService.isRunning) {
      const now = new Date();
      const lastCollection = dataCollectionService.lastCollectionTime || now;
      const nextCollection = new Date(lastCollection.getTime() + 600000); // 10 minutes later
      
      status.dataCollection.lastCollection = lastCollection.toISOString();
      status.dataCollection.nextCollection = nextCollection.toISOString();
    }

    // Get data statistics
    const [sensorCount, aggregateCount] = await Promise.all([
      SensorData.countDocuments(),
      DailyAggregate.countDocuments()
    ]);

    status.dataStats.totalSensorReadings = sensorCount;
    status.dataStats.totalDailyAggregates = aggregateCount;

    // Get oldest and newest data
    if (sensorCount > 0) {
      const [oldest, newest] = await Promise.all([
        SensorData.findOne().sort({ timestamp: 1 }),
        SensorData.findOne().sort({ timestamp: -1 })
      ]);

      if (oldest) status.dataStats.oldestData = oldest.timestamp.toISOString();
      if (newest) status.dataStats.newestData = newest.timestamp.toISOString();
    }

    return res.status(200).json({
      success: true,
      data: status
    });

  } catch (err) {
    next(err);
  }
};

const getCollectionHistory = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get recent sensor data collections
    const recentCollections = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('timestamp temperature humidity moisture_percent uv_index lux battery_percent');

    // Get recent daily aggregates
    const recentAggregates = await DailyAggregate.find()
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .select('date sunlight_hours water_level_avg uv_exposure_hours total_readings');

    return res.status(200).json({
      success: true,
      data: {
        recentCollections: recentCollections.map(data => ({
          timestamp: data.timestamp,
          temperature: data.temperature,
          humidity: data.humidity,
          moisture_percent: data.moisture_percent,
          uv_index: data.uv_index,
          lux: data.lux,
          battery_percent: data.battery_percent
        })),
        recentAggregates: recentAggregates.map(agg => ({
          date: agg.date,
          sunlight_hours: agg.sunlight_hours,
          water_level_avg: agg.water_level_avg,
          uv_exposure_hours: agg.uv_exposure_hours,
          total_readings: agg.total_readings
        }))
      }
    });

  } catch (err) {
    next(err);
  }
};

const testDataCollection = async (req, res, next) => {
  try {
    // Manually trigger a data collection for testing
    await dataCollectionService.collectSensorData();
    
    return res.status(200).json({
      success: true,
      data: {
        message: "Manual data collection triggered successfully",
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    next(err);
  }
};

const getDataCollectionLogs = async (req, res, next) => {
  try {
    const { hours = 24 } = req.query;
    const cutoffTime = new Date(Date.now() - (parseInt(hours) * 60 * 60 * 1000));

    // Get sensor data from the specified time period
    const sensorData = await SensorData.find({
      timestamp: { $gte: cutoffTime }
    }).sort({ timestamp: -1 });

    // Group by hour for better visualization
    const hourlyStats = {};
    sensorData.forEach(data => {
      const hour = data.timestamp.toISOString().slice(0, 13) + ':00:00.000Z';
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          count: 0,
          avgTemperature: 0,
          avgHumidity: 0,
          avgMoisture: 0,
          avgUV: 0,
          avgLux: 0
        };
      }
      
      hourlyStats[hour].count++;
      hourlyStats[hour].avgTemperature += data.temperature;
      hourlyStats[hour].avgHumidity += data.humidity;
      hourlyStats[hour].avgMoisture += data.moisture_percent;
      hourlyStats[hour].avgUV += data.uv_index;
      hourlyStats[hour].avgLux += data.lux;
    });

    // Calculate averages
    Object.keys(hourlyStats).forEach(hour => {
      const stats = hourlyStats[hour];
      const count = stats.count;
      stats.avgTemperature = (stats.avgTemperature / count).toFixed(1);
      stats.avgHumidity = (stats.avgHumidity / count).toFixed(1);
      stats.avgMoisture = (stats.avgMoisture / count).toFixed(2);
      stats.avgUV = (stats.avgUV / count).toFixed(2);
      stats.avgLux = (stats.avgLux / count).toFixed(0);
    });

    return res.status(200).json({
      success: true,
      data: {
        period: `${hours} hours`,
        totalCollections: sensorData.length,
        expectedCollections: Math.floor(parseInt(hours) * 6), // 6 per hour (every 10 minutes)
        collectionRate: `${((sensorData.length / (parseInt(hours) * 6)) * 100).toFixed(1)}%`,
        hourlyStats: Object.entries(hourlyStats).map(([hour, stats]) => ({
          hour,
          ...stats
        }))
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemStatus,
  getCollectionHistory,
  testDataCollection,
  getDataCollectionLogs
}; 