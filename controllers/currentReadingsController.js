const axios = require("axios");

const getCurrentReadings = async (req, res, next) => {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    
    if (!firebaseUrl) {
      return res.status(500).json({
        success: false,
        error: {
          code: "CONFIG_ERROR",
          message: "Firebase URL not configured"
        }
      });
    }

    const response = await axios.get(`${firebaseUrl}/trial.json`);
    
    if (response.status !== 200) {
      return res.status(500).json({
        success: false,
        error: {
          code: "FIREBASE_ERROR",
          message: "Failed to fetch data from Firebase"
        }
      });
    }

    const data = response.data;
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NO_DATA",
          message: "No current readings available"
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        readings: data
      }
    });

  } catch (err) {
    console.error("Firebase fetch error:", err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch current readings"
      }
    });
  }
};

module.exports = { getCurrentReadings }; 