const reportService = require("../services/reportService");
const SensorData = require("../models/sensorDataModel");
const DailyAggregate = require("../models/dailyAggregateModel");

const generateReport = async (req, res, next) => {
  try {
    const { startDate, endDate, reportType = "daily" } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Start date and end date are required"
        }
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date format"
        }
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Start date must be before end date"
        }
      });
    }

    const filename = await reportService.generateReport(start, end, reportType);

    return res.status(200).json({
      success: true,
      data: {
        message: "Report generated successfully",
        filename,
        downloadUrl: `/api/reports/download/${filename}`,
        reportType,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });

  } catch (err) {
    next(err);
  }
};

const getReportData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Start date and end date are required"
        }
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date format"
        }
      });
    }

    const reportData = await reportService.getReportData(start, end);

    return res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (err) {
    next(err);
  }
};

const getLast24HoursData = async (req, res, next) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    const sensorData = await SensorData.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 }).limit(144); // Max 144 readings (every 10 minutes for 24 hours)

    const dailyAggregates = await DailyAggregate.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        sensorData: sensorData.map(data => ({
          timestamp: data.timestamp,
          temperature: data.temperature,
          humidity: data.humidity,
          moisture_percent: data.moisture_percent,
          uv_index: data.uv_index,
          lux: data.lux,
          battery_percent: data.battery_percent
        })),
        dailyAggregates: dailyAggregates.map(agg => ({
          date: agg.date,
          sunlight_hours: agg.sunlight_hours,
          water_level_avg: agg.water_level_avg,
          uv_exposure_hours: agg.uv_exposure_hours
        }))
      }
    });

  } catch (err) {
    next(err);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filepath = require("path").join(__dirname, "../reports", filename);

    if (!require("fs").existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FILE_NOT_FOUND",
          message: "Report file not found"
        }
      });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        return res.status(500).json({
          success: false,
          error: {
            code: "DOWNLOAD_ERROR",
            message: "Failed to download report"
          }
        });
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateReport,
  getReportData,
  getLast24HoursData,
  downloadReport
}; 