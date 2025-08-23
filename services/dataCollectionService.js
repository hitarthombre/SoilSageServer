const axios = require("axios");
const SensorData = require("../models/sensorDataModel");
const DailyAggregate = require("../models/dailyAggregateModel");

class DataCollectionService {
  constructor() {
    this.isRunning = false;
    this.collectionInterval = null;
    this.aggregationInterval = null;
  }

  async startDataCollection() {
    if (this.isRunning) {
      console.log("Data collection service is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting data collection service...");

    // Collect data every 10 minutes (600,000 ms)
    this.collectionInterval = setInterval(async () => {
      await this.collectSensorData();
    }, 600000);

    // Aggregate data daily at midnight
    this.aggregationInterval = setInterval(async () => {
      await this.aggregateDailyData();
    }, this.getTimeUntilMidnight());

    // Initial data collection
    await this.collectSensorData();
  }

  async stopDataCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }
    this.isRunning = false;
    console.log("Data collection service stopped");
  }

  async collectSensorData() {
    try {
      const firebaseUrl = process.env.FIREBASE_URL;
      if (!firebaseUrl) {
        console.error("FIREBASE_URL not configured");
        return;
      }

      const response = await axios.get(`${firebaseUrl}/trial.json`);
      if (response.status !== 200) {
        console.error("Failed to fetch data from Firebase");
        return;
      }

      const data = response.data;
      if (!data) {
        console.log("No data available from Firebase");
        return;
      }

      // Store sensor data
      const sensorData = new SensorData({
        timestamp: new Date(),
        battery_percent: data.battery_percent || 0,
        battery_voltage: data.battery_voltage || 0,
        humidity: data.humidity || 0,
        irradiance: data.irradiance || 0,
        lux: data.lux || 0,
        moisture_percent: data.moisture_percent || 0,
        moisture_raw: data.moisture_raw || 0,
        temperature: data.temperature || 0,
        uv_index: data.uv_index || 0,
        uv_intensity: data.uv_intensity || 0,
        uv_raw: data.uv_raw || 0,
        uv_voltage: data.uv_voltage || 0
      });

      await sensorData.save();
      console.log(`Sensor data collected at ${new Date().toISOString()}`);

    } catch (error) {
      console.error("Error collecting sensor data:", error.message);
    }
  }

  async aggregateDailyData() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all sensor data for today
      const sensorData = await SensorData.find({
        timestamp: { $gte: today, $lt: tomorrow }
      }).sort({ timestamp: 1 });

      if (sensorData.length === 0) {
        console.log("No sensor data to aggregate for today");
        return;
      }

      // Calculate aggregates
      const aggregates = this.calculateAggregates(sensorData);
      
      // Calculate sunlight hours (lux > 1000)
      const sunlightHours = this.calculateSunlightHours(sensorData);
      
      // Calculate UV exposure hours (UV index > threshold)
      const uvExposureHours = this.calculateUVExposureHours(sensorData, 3.0);
      
      // Calculate average water level
      const waterLevelAvg = sensorData.reduce((sum, data) => sum + data.moisture_percent, 0) / sensorData.length;

      // Create or update daily aggregate
      const dailyAggregate = new DailyAggregate({
        date: today,
        sunlight_hours: sunlightHours,
        water_level_avg: waterLevelAvg,
        uv_exposure_hours: uvExposureHours,
        uv_threshold: 3.0,
        temperature: aggregates.temperature,
        humidity: aggregates.humidity,
        moisture_percent: aggregates.moisture_percent,
        uv_index: aggregates.uv_index,
        lux: aggregates.lux,
        total_readings: sensorData.length,
        collection_start: sensorData[0].timestamp,
        collection_end: sensorData[sensorData.length - 1].timestamp
      });

      await dailyAggregate.save();
      console.log(`Daily aggregate created for ${today.toDateString()}`);

    } catch (error) {
      console.error("Error aggregating daily data:", error.message);
    }
  }

  calculateAggregates(sensorData) {
    const temperature = sensorData.map(d => d.temperature);
    const humidity = sensorData.map(d => d.humidity);
    const moisture_percent = sensorData.map(d => d.moisture_percent);
    const uv_index = sensorData.map(d => d.uv_index);
    const lux = sensorData.map(d => d.lux);

    return {
      temperature: {
        min: Math.min(...temperature),
        max: Math.max(...temperature),
        avg: temperature.reduce((sum, val) => sum + val, 0) / temperature.length
      },
      humidity: {
        min: Math.min(...humidity),
        max: Math.max(...humidity),
        avg: humidity.reduce((sum, val) => sum + val, 0) / humidity.length
      },
      moisture_percent: {
        min: Math.min(...moisture_percent),
        max: Math.max(...moisture_percent),
        avg: moisture_percent.reduce((sum, val) => sum + val, 0) / moisture_percent.length
      },
      uv_index: {
        min: Math.min(...uv_index),
        max: Math.max(...uv_index),
        avg: uv_index.reduce((sum, val) => sum + val, 0) / uv_index.length
      },
      lux: {
        min: Math.min(...lux),
        max: Math.max(...lux),
        avg: lux.reduce((sum, val) => sum + val, 0) / lux.length
      }
    };
  }

  calculateSunlightHours(sensorData) {
    let sunlightMinutes = 0;
    const threshold = 1000; // lux threshold for sunlight

    for (let i = 0; i < sensorData.length - 1; i++) {
      const current = sensorData[i];
      const next = sensorData[i + 1];
      
      if (current.lux > threshold) {
        const timeDiff = (next.timestamp - current.timestamp) / (1000 * 60); // minutes
        sunlightMinutes += timeDiff;
      }
    }

    return Math.round((sunlightMinutes / 60) * 100) / 100; // hours with 2 decimal places
  }

  calculateUVExposureHours(sensorData, threshold) {
    let exposureMinutes = 0;

    for (let i = 0; i < sensorData.length - 1; i++) {
      const current = sensorData[i];
      const next = sensorData[i + 1];
      
      if (current.uv_index > threshold) {
        const timeDiff = (next.timestamp - current.timestamp) / (1000 * 60); // minutes
        exposureMinutes += timeDiff;
      }
    }

    return Math.round((exposureMinutes / 60) * 100) / 100; // hours with 2 decimal places
  }

  getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  }
}

module.exports = new DataCollectionService(); 