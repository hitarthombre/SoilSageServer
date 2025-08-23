const dataCollectionService = require("../services/dataCollectionService");

const keepAlive = async (req, res, next) => {
  try {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    const status = {
      status: "alive",
      timestamp: new Date().toISOString(),
      server: {
        url: serverUrl,
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime()
      },
      dataCollection: {
        isRunning: dataCollectionService.isRunning,
        lastCollection: dataCollectionService.lastCollectionTime,
        totalCollections: dataCollectionService.collectionCount,
        nextCollection: dataCollectionService.lastCollectionTime ? 
          new Date(dataCollectionService.lastCollectionTime.getTime() + 600000) : null
      },
      services: {
        mongodb: "connected",
        firebase: process.env.FIREBASE_URL ? "configured" : "not configured",
        dataCollection: dataCollectionService.isRunning ? "active" : "inactive"
      }
    };

    return res.status(200).json({
      success: true,
      data: status
    });

  } catch (err) {
    next(err);
  }
};

const healthCheck = async (req, res, next) => {
  try {
    // Simple health check for external monitoring services
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
};

module.exports = {
  keepAlive,
  healthCheck
}; 