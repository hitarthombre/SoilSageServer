const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const SensorData = require("../models/sensorDataModel");
const DailyAggregate = require("../models/dailyAggregateModel");
const SoilData = require("../models/soilModel");

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

  displayVal(value, digits = 1) {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return digits === 0 ? Math.round(value).toString() : value.toFixed(digits);
    const n = parseFloat(String(value));
    if (!Number.isFinite(n)) return "N/A";
    return digits === 0 ? Math.round(n).toString() : n.toFixed(digits);
  }

  async generateReport(startDate, endDate, reportType = "daily", options = {}) {
    try {
      const filename = `sensor_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}_${reportType}.pdf`;
      const filepath = path.join(this.reportsDir, filename);

      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      await this.drawHeader(doc, startDate, endDate, reportType);

      if (reportType === "daily") {
        await this.generateDailyReport(doc, startDate, endDate);
      } else if (reportType === "detailed") {
        await this.generateDetailedReport(doc, startDate, endDate);
      } else if (reportType === "twoHourly24h") {
        await this.generateTwoHourly24hReport(doc, startDate, options);
      } else {
        doc.fontSize(14).fillColor("#b00020").text(`Unknown report type: ${reportType}`);
      }

      doc.moveDown(2);
      doc.fontSize(10).fillColor("#000").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });

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

  async drawHeader(doc, startDate, endDate, reportType) {
    const logoPath = process.env.LOGO_PATH && process.env.LOGO_PATH.trim().length > 0 ? process.env.LOGO_PATH.trim() : null;
    const hasLogo = logoPath && fs.existsSync(logoPath);

    const title = "Soil Sage";
    const subtitle = reportType === "twoHourly24h"
      ? `${startDate.toDateString()} (24 hours, hourly summary)`
      : `${startDate.toDateString()} to ${endDate.toDateString()}`;

    const topY = doc.y;
    if (hasLogo) {
      try {
        doc.image(logoPath, 40, topY, { width: 60 });
      } catch (e) {}
    }

    doc.fontSize(22).fillColor("#111").text(title, 0, topY, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#333").text(subtitle, { align: "center" });
    doc.moveDown(1);

    const currentY = doc.y;
    doc.moveTo(40, currentY).lineTo(555, currentY).stroke();
    doc.moveDown(1);
  }

  async generateDailyReport(doc, startDate, endDate) {
    const dailyAggregates = await DailyAggregate.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    if (dailyAggregates.length === 0) {
      doc.fontSize(14).text("No daily data available for the selected period.");
      return;
    }

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
  }

  async generateDetailedReport(doc, startDate, endDate) {
    const sensorData = await SensorData.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    if (sensorData.length === 0) {
      doc.fontSize(14).text("No detailed data available for the selected period.");
      return;
    }

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

    doc.moveDown(2);
    doc.fontSize(16).text("Sample Time Series Data", { underline: true });
    doc.moveDown();

    const sampleData = sensorData.filter((_, index) => index % Math.ceil(sensorData.length / 20) === 0);
    sampleData.forEach((data, index) => {
      if (index < 20) {
        const time = data.timestamp.toLocaleString();
        doc.fontSize(9).text(`${time}: T:${data.temperature.toFixed(1)}°C, H:${data.humidity.toFixed(1)}%, M:${data.moisture_percent.toFixed(1)}%, UV:${data.uv_index.toFixed(1)}`);
      }
    });
  }

  async generateTwoHourly24hReport(doc, dayDate, options = {}) {
    const { fruit } = options;

    const start = new Date(dayDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const data = await SensorData.find({ timestamp: { $gte: start, $lt: end } }).sort({ timestamp: 1 });

    const buckets = Array.from({ length: 24 }).map((_, i) => {
      const bucketStart = new Date(start.getTime() + i * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);
      return { index: i, start: bucketStart, end: bucketEnd, points: [] };
    });

    let cursor = 0;
    for (const point of data) {
      while (cursor < buckets.length - 1 && point.timestamp >= buckets[cursor].end) {
        cursor++;
      }
      if (point.timestamp >= buckets[cursor].start && point.timestamp < buckets[cursor].end) {
        buckets[cursor].points.push(point);
      }
    }

    // Resolve targets (calibration > fruit DB > env)
    let targets = {
      sunlight_lux: this.parseFloatOrNull(process.env.REQUIRED_SUNLIGHT_LUX),
      moisture_percent: this.parseFloatOrNull(process.env.REQUIRED_MOISTURE_PERCENT),
      temperature_c: this.parseFloatOrNull(process.env.REQUIRED_TEMPERATURE_C),
      humidity_percent: this.parseFloatOrNull(process.env.REQUIRED_HUMIDITY_PERCENT),
      uv_index: this.parseFloatOrNull(process.env.REQUIRED_UV_INDEX)
    };

    try {
      const Calibration = require("../models/calibrationModel");
      // Try fruit calibration first
      let calib = null;
      if (fruit) calib = await Calibration.findOne({ fruit }).sort({ calculatedAt: -1 });
      // Then try global calibration
      if (!calib) calib = await Calibration.findOne({ fruit: null }).sort({ calculatedAt: -1 });
      if (calib && calib.targets) {
        targets = { ...targets, ...calib.targets };
      }
    } catch (_) {}

    if (fruit) {
      try {
        const docFruit = await SoilData.findOne({ "Plant Name": new RegExp(`^${fruit}$`, "i") });
        if (docFruit && Array.isArray(docFruit.Stages) && docFruit.Stages.length > 0) {
          const parseNum = (v) => {
            if (v == null) return null;
            const n = parseFloat(String(v).toString().replace(/[^0-9.\-]/g, ""));
            return Number.isFinite(n) ? n : null;
          };
          const agg = (key) => {
            const vals = docFruit.Stages.map(s => parseNum(s[key])).filter(v => v != null);
            return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
          };
          targets = {
            sunlight_lux: agg("Sunlight") ?? targets.sunlight_lux,
            moisture_percent: agg("Moisture") ?? targets.moisture_percent,
            temperature_c: agg("Temperature") ?? targets.temperature_c,
            humidity_percent: agg("Humidity") ?? targets.humidity_percent,
            uv_index: agg("UV Light") ?? targets.uv_index
          };
        }
      } catch (e) {}
    }

    // Required block
    doc.fontSize(12).fillColor("#000").text("Required Targets", { underline: true });
    const reqCols = [40, 180, 320, 460];
    const reqTop = doc.y + 4;
    doc.fontSize(10);
    doc.text("Sunlight (lux)", reqCols[0], reqTop);
    doc.text("Moisture %", reqCols[1], reqTop);
    doc.text("Temperature °C", reqCols[2], reqTop);
    doc.text("Humidity %", reqCols[3], reqTop);

    const reqValsY = reqTop + 12;
    doc.text(this.displayVal(targets.sunlight_lux, 0), reqCols[0], reqValsY);
    doc.text(this.displayVal(targets.moisture_percent, 1), reqCols[1], reqValsY);
    doc.text(this.displayVal(targets.temperature_c, 1), reqCols[2], reqValsY);
    doc.text(this.displayVal(targets.humidity_percent, 1), reqCols[3], reqValsY);
    doc.moveDown(2);

    // Hourly table
    const tableTop = doc.y;
    const colX = [
      40,  85,  140,  195,  250,  305,  360,  415,  470
    ];
    // Hours, Sun (R), Moist (R), Temp (R), Hum (R), UV (R), Condition
    doc.fontSize(9).fillColor("#000");
    doc.text("Hours", colX[0], tableTop);
    doc.text("Sun (R)", colX[1], tableTop);
    doc.text("Moist (R)", colX[2], tableTop);
    doc.text("Temp (R)", colX[3], tableTop);
    doc.text("Hum (R)", colX[4], tableTop);
    doc.text("UV (R)", colX[5], tableTop);
    doc.text("Condition", colX[6], tableTop);
    doc.moveTo(40, tableTop + 12).lineTo(555, tableTop + 12).stroke();

    let rowY = tableTop + 18;

    const avg = (arr) => (arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length) : null);
    const hourlyConditions = [];

    for (const b of buckets) {
      const luxAvg = avg(b.points.map(p => p.lux));
      const moistureAvg = avg(b.points.map(p => p.moisture_percent));
      const uvAvg = avg(b.points.map(p => p.uv_index));
      const tempAvg = avg(b.points.map(p => p.temperature));
      const humAvg = avg(b.points.map(p => p.humidity));

      const label = `${b.start.getHours()}-${b.end.getHours()}`;
      const fmt = (v, d = 1) => (v == null ? "N/A" : Number(v).toFixed(d));

      const scores = [];
      const pushScore = (real, target) => {
        if (target == null || real == null) return;
        const rel = target === 0 ? Math.abs(real) : Math.abs(real - target) / Math.abs(target);
        let score = 4;
        if (rel > 0.5) score = 0; else if (rel > 0.3) score = 1; else if (rel > 0.2) score = 2; else if (rel > 0.1) score = 3; else score = 4;
        scores.push(score);
      };
      pushScore(luxAvg, targets.sunlight_lux);
      pushScore(moistureAvg, targets.moisture_percent);
      pushScore(tempAvg, targets.temperature_c);
      pushScore(humAvg, targets.humidity_percent);
      pushScore(uvAvg, targets.uv_index);

      const weighted = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      const { label: condText, color } = this.mapCondition(weighted);
      hourlyConditions.push(weighted);

      doc.fontSize(9).fillColor("#000");
      doc.text(label, colX[0], rowY);
      doc.text(fmt(luxAvg, 0), colX[1], rowY);
      doc.text(fmt(moistureAvg, 1), colX[2], rowY);
      doc.text(fmt(tempAvg, 1), colX[3], rowY);
      doc.text(fmt(humAvg, 1), colX[4], rowY);
      doc.text(fmt(uvAvg, 2), colX[5], rowY);

      const badgeX = colX[6];
      const badgeW = 70;
      const badgeH = 12;
      if (condText !== "N/A") {
        const prevColor = doc.fillColor();
        doc.save();
        doc.rect(badgeX, rowY - 2, badgeW, badgeH).fill(color);
        doc.fillColor("#fff").fontSize(8).text(condText, badgeX + 4, rowY, { width: badgeW - 8, align: "center" });
        doc.restore();
        doc.fillColor(prevColor);
      } else {
        doc.text("N/A", badgeX, rowY);
      }

      rowY += 16;
      if (rowY > 740) {
        doc.addPage();
        rowY = 50;
      }
    }

    // Day summary, suggestions, conclusion (reuse existing logic)
    doc.moveDown(1);
    doc.fontSize(12).fillColor("#000").text("Daily Condition Summary", { underline: true });
    const dayScore = hourlyConditions.filter(v => v != null).length ? (hourlyConditions.filter(v => v != null).reduce((s, v) => s + v, 0) / hourlyConditions.filter(v => v != null).length) : null;
    const { label: dayLabel, color: dayColor } = this.mapCondition(dayScore);
    doc.moveDown(0.5);
    const x = 40, y = doc.y;
    doc.text("Overall condition:", x, y);
    if (dayLabel !== "N/A") {
      doc.save(); doc.rect(x + 110, y - 2, 100, 14).fill(dayColor); doc.fillColor("#fff").fontSize(10).text(dayLabel, x + 110, y, { width: 100, align: "center" }); doc.restore(); doc.fillColor("#000");
    } else { doc.text("N/A", x + 110, y); }

    doc.moveDown(1); doc.fontSize(12).text("Suggestions", { underline: true });
    const suggestions = this.buildSuggestions(buckets, targets);
    if (suggestions.length === 0) doc.fontSize(10).text("- No specific actions suggested based on available data.");
    else suggestions.forEach(s => doc.fontSize(10).text(`- ${s}`));

    doc.moveDown(1); doc.fontSize(12).text("Conclusion", { underline: true });
    const conclusion = dayLabel === "Good"
      ? "Conditions were generally optimal throughout the day. Maintain current care routines."
      : dayLabel === "Favourable" ? "Overall favourable conditions with minor deviations. Monitor and adjust as necessary."
      : dayLabel === "Average" ? "Mixed conditions observed. Consider addressing highlighted suggestions to improve plant health."
      : dayLabel === "Poor" ? "Suboptimal conditions detected for extended periods. Implement suggested actions promptly."
      : dayLabel === "Worst" ? "Severe deviations from targets. Immediate corrective actions are recommended."
      : "Insufficient data to conclude.";
    doc.fontSize(10).text(conclusion);
  }

  parseFloatOrNull(v) {
    if (v === undefined || v === null) return null;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  }

  mapCondition(score) {
    if (score === null || score === undefined) return { label: "N/A", color: "#9E9E9E" };
    const rounded = score;
    if (rounded >= 3.6) return { label: "Good", color: "#2e7d32" };
    if (rounded >= 2.6) return { label: "Favourable", color: "#0277bd" };
    if (rounded >= 1.6) return { label: "Average", color: "#757575" };
    if (rounded >= 0.6) return { label: "Poor", color: "#ef6c00" };
    return { label: "Worst", color: "#c62828" };
  }

  buildSuggestions(buckets, targets) {
    const avgVal = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
    const all = buckets.flatMap(b => b.points);
    if (all.length === 0) return [];

    const avgLux = avgVal(all.map(p => p.lux));
    const avgMoist = avgVal(all.map(p => p.moisture_percent));
    const avgTemp = avgVal(all.map(p => p.temperature));
    const avgHum = avgVal(all.map(p => p.humidity));
    const avgUV = avgVal(all.map(p => p.uv_index));

    const out = [];
    if (targets.moisture_percent != null && avgMoist != null) {
      if (avgMoist < targets.moisture_percent - 5) out.push("Increase watering; soil moisture below target levels.");
      if (avgMoist > targets.moisture_percent + 5) out.push("Reduce watering; soil moisture above target levels.");
    }
    if (targets.sunlight_lux != null && avgLux != null) {
      if (avgLux < targets.sunlight_lux * 0.8) out.push("Consider relocating to a sunnier area or extending light exposure.");
      if (avgLux > targets.sunlight_lux * 1.2) out.push("Provide shading during peak hours to prevent stress.");
    }
    if (targets.temperature_c != null && avgTemp != null) {
      if (avgTemp < targets.temperature_c - 3) out.push("Low temperature detected; provide insulation or adjust environment.");
      if (avgTemp > targets.temperature_c + 3) out.push("High temperature detected; improve ventilation or provide cooling.");
    }
    if (targets.humidity_percent != null && avgHum != null) {
      if (avgHum < targets.humidity_percent - 10) out.push("Low humidity; consider misting or using a humidifier.");
      if (avgHum > targets.humidity_percent + 10) out.push("High humidity; increase airflow to prevent fungal issues.");
    }
    if (targets.uv_index != null && avgUV != null) {
      if (avgUV > targets.uv_index + 1) out.push("High UV exposure; use shade cloth to reduce UV stress.");
    }

    return out;
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