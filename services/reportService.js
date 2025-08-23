const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const SensorData = require("../models/sensorDataModel");
const DailyAggregate = require("../models/dailyAggregateModel");

class ReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, "../reports");
    this.ensureReportsDirectory();
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generateReport(startDate, endDate, reportType = "daily") {
    try {
      const filename = `sensor_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
      const filepath = path.join(this.reportsDir, filename);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text("Soil Sage Sensor Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Report Period: ${startDate.toDateString()} to ${endDate.toDateString()}`, { align: "center" });
      doc.moveDown();

      if (reportType === "daily") {
        await this.generateDailyReport(doc, startDate, endDate);
      } else {
        await this.generateDetailedReport(doc, startDate, endDate);
      }

      // Add footer
      doc.moveDown(2);
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on("finish", () => resolve(filename));
        stream.on("error", reject);
      });

    } catch (error) {
      console.error("Error generating report:", error.message);
      throw error;
    }
  }

  async generateDailyReport(doc, startDate, endDate) {
    // Get daily aggregates for the period
    const dailyAggregates = await DailyAggregate.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    if (dailyAggregates.length === 0) {
      doc.fontSize(14).text("No daily data available for the selected period.");
      return;
    }

    // Summary section
    doc.fontSize(16).text("Daily Summary", { underline: true });
    doc.moveDown();

    dailyAggregates.forEach((aggregate, index) => {
      const date = aggregate.date.toDateString();
      
      doc.fontSize(14).text(`Date: ${date}`);
      doc.fontSize(10).text(`Sunlight Hours: ${aggregate.sunlight_hours}h`);
      doc.fontSize(10).text(`Water Level Average: ${aggregate.water_level_avg.toFixed(2)}%`);
      doc.fontSize(10).text(`UV Exposure: ${aggregate.uv_exposure_hours}h (threshold: ${aggregate.uv_threshold})`);
      doc.fontSize(10).text(`Temperature: ${aggregate.temperature.min.toFixed(1)}°C - ${aggregate.temperature.max.toFixed(1)}°C (avg: ${aggregate.temperature.avg.toFixed(1)}°C)`);
      doc.fontSize(10).text(`Humidity: ${aggregate.humidity.min.toFixed(1)}% - ${aggregate.humidity.max.toFixed(1)}% (avg: ${aggregate.humidity.avg.toFixed(1)}%)`);
      doc.fontSize(10).text(`Total Readings: ${aggregate.total_readings}`);
      
      if (index < dailyAggregates.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      }
    });

    // Charts section (placeholder for future enhancement)
    doc.moveDown(2);
    doc.fontSize(16).text("Trends & Analysis", { underline: true });
    doc.moveDown();
    doc.fontSize(10).text("• Sunlight exposure patterns");
    doc.fontSize(10).text("• Water level variations");
    doc.fontSize(10).text("• UV exposure trends");
    doc.fontSize(10).text("• Temperature and humidity ranges");
  }

  async generateDetailedReport(doc, startDate, endDate) {
    // Get detailed sensor data for the period
    const sensorData = await SensorData.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    if (sensorData.length === 0) {
      doc.fontSize(14).text("No detailed data available for the selected period.");
      return;
    }

    // Data summary
    doc.fontSize(16).text("Detailed Data Summary", { underline: true });
    doc.moveDown();

    const totalReadings = sensorData.length;
    const avgTemperature = sensorData.reduce((sum, d) => sum + d.temperature, 0) / totalReadings;
    const avgHumidity = sensorData.reduce((sum, d) => sum + d.humidity, 0) / totalReadings;
    const avgMoisture = sensorData.reduce((sum, d) => sum + d.moisture_percent, 0) / totalReadings;
    const avgUV = sensorData.reduce((sum, d) => sum + d.uv_index, 0) / totalReadings;

    doc.fontSize(12).text(`Total Readings: ${totalReadings}`);
    doc.fontSize(12).text(`Average Temperature: ${avgTemperature.toFixed(1)}°C`);
    doc.fontSize(12).text(`Average Humidity: ${avgHumidity.toFixed(1)}%`);
    doc.fontSize(12).text(`Average Moisture: ${avgMoisture.toFixed(2)}%`);
    doc.fontSize(12).text(`Average UV Index: ${avgUV.toFixed(2)}`);

    // Time series data (sample)
    doc.moveDown(2);
    doc.fontSize(16).text("Sample Time Series Data", { underline: true });
    doc.moveDown();

    const sampleData = sensorData.filter((_, index) => index % Math.ceil(sensorData.length / 20) === 0);
    
    sampleData.forEach((data, index) => {
      if (index < 20) { // Limit to 20 samples for PDF readability
        const time = data.timestamp.toLocaleString();
        doc.fontSize(9).text(`${time}: T:${data.temperature.toFixed(1)}°C, H:${data.humidity.toFixed(1)}%, M:${data.moisture_percent.toFixed(1)}%, UV:${data.uv_index.toFixed(1)}`);
      }
    });
  }

  async getReportData(startDate, endDate) {
    try {
      const [sensorData, dailyAggregates] = await Promise.all([
        SensorData.find({
          timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: 1 }),
        DailyAggregate.find({
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 })
      ]);

      return {
        sensorData,
        dailyAggregates,
        summary: {
          totalReadings: sensorData.length,
          periodDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          avgTemperature: sensorData.length > 0 ? sensorData.reduce((sum, d) => sum + d.temperature, 0) / sensorData.length : 0,
          avgHumidity: sensorData.length > 0 ? sensorData.reduce((sum, d) => sum + d.humidity, 0) / sensorData.length : 0,
          avgMoisture: sensorData.length > 0 ? sensorData.reduce((sum, d) => sum + d.moisture_percent, 0) / sensorData.length : 0,
          avgUV: sensorData.length > 0 ? sensorData.reduce((sum, d) => sum + d.uv_index, 0) / sensorData.length : 0
        }
      };
    } catch (error) {
      console.error("Error getting report data:", error.message);
      throw error;
    }
  }
}

module.exports = new ReportService(); 