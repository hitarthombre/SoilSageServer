# Soil Sage Server

A RESTful API server for the Soil Sage application that provides information about plants, their growth stages, and soil requirements.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- RESTful API architecture

## Soil Controller

The Soil Controller is responsible for handling incoming requests and interacting with the database to fetch and return soil information.

### Functions

#### `getAllFruits`

This function fetches all distinct fruits from the database and returns them as a JSON response.

#### `getFruitStages`

This function takes a fruit name as a parameter and fetches all growth stages for that fruit. It returns the stages as a JSON response.

#### `getStageDetails`

This function takes a fruit name and a growth stage as parameters and fetches the detailed information for that stage. It returns the details as a JSON response.

### Error Handling

If any error occurs during the database operations, the controller catches the error and sends an appropriate error response to the client. The response includes an error message and the HTTP status code 500.

## Prerequisites

- Node.js (Latest LTS version recommended)
- MongoDB installed and running locally
- npm or yarn package manager

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables in a `.env` file
4. Start the server
   ```bash
   npm start
   ```

## API Endpoints

### Get All Fruits

```
GET apifruits
```

Returns a list of all available fruits in the database.

Response format

```json
{
  total number,
  fruits [string]
}
```

### Get Fruit Stages

```
GET apifruitsnamestages
```

Returns all growth stages for a specific fruit.

Response format

```json
{
  fruit string,
  stages [string]
}
```

### Get Stage Details

```
GET apifruitsnamestagesstage
```

Returns detailed information about a specific growth stage of a fruit.

Response format

```json
{
  fruit string,
  stage {
    Growth Stage string,
     Additional stage details
  }
}
```

## Error Handling

The API uses standard HTTP response codes

- 200 Success
- 404 Resource not found
- 500 Server error

Errors are returned in the following format

```json
{
  error Error message
}
```

## Project Structure

```
├── config
│   └── db.js           # Database configuration
├── controllers
│   └── soilController.js # Request handlers
├── middlewares
│   ├── errorHandler.js   # Error handling middleware
│   └── logger.js        # Logging middleware
├── models
│   └── soilModel.js     # Database models
├── routes
│   └── soilRoutes.js    # API routes
└── server.js           # Application entry point
```

## Auth API

- Base: `/api/auth`
- Signup: `POST /signup`
  - body: `{ "username": "jdoe", "name": "John", "surname": "Doe", "email": "john@example.com", "password": "Aa!23456", "confirmPassword": "Aa!23456" }`
- Login: `POST /login`
  - body: `{ "email": "john@example.com", "password": "Aa!23456" }`

Responses return `{ success, data|error }` and include a JWT `token` on success.

### Environment variables
Create a `.env` file at the project root with:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/soilsage
JWT_SECRET=supersecret_change_me
JWT_EXPIRES_IN=15m
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
FIREBASE_URL=https://yourproject-code-default-rtdb.continent-part.firebasedatabase.app
SERVER_URL=https://your-app-name.onrender.com
```

**Note:** `SERVER_URL` is required for production deployment (e.g., Render, Heroku, Railway).

## Keep-Alive System (Free Hosting Tiers)

### **Problem with Free Hosting**
- **Render/Heroku free tiers** put servers to sleep after 15 minutes
- **Background processes stop** (including 10-minute data collection)
- **Server wakes up only** when receiving HTTP requests

### **Solution: External Ping Service**
Use free services to ping your server every 5 minutes:

#### **Option 1: UptimeRobot (Recommended)**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add new monitor:
   - **URL**: `https://your-app-name.onrender.com/keep-alive`
   - **Type**: HTTP(s)
   - **Interval**: 5 minutes
   - **Alert**: Disable (optional)

#### **Option 2: Cron-job.org**
1. Go to [cron-job.org](https://cron-job.org)
2. Create free account
3. Add new cron job:
   - **URL**: `https://your-app-name.onrender.com/keep-alive`
   - **Schedule**: Every 5 minutes
   - **HTTP Method**: GET

#### **Option 3: GitHub Actions (Free)**
```yaml
# .github/workflows/keep-alive.yml
name: Keep Server Alive
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Server
        run: |
          curl -s "https://your-app-name.onrender.com/keep-alive"
```

### **Keep-Alive Endpoints**
- `GET /` - Root endpoint with server info
- `GET /keep-alive` - Detailed status (use for external pinging)
- `GET /health` - Simple health check

### **How It Works**
1. **External service pings** `/keep-alive` every 5 minutes
2. **Server stays awake** and responds to requests
3. **Data collection continues** every 10 minutes
4. **Free hosting works** without upgrading to paid plans

## Sensors API

- GET `/api/sensors/current-readings`
  - Fetches real-time sensor data from Firebase
  - Returns current readings with timestamp
  - Response format:
    ```json
    {
      "success": true,
      "data": {
        "timestamp": "2024-01-01T00:00:00.000Z",
        "readings": {
          "battery_percent": 0,
          "battery_voltage": 0,
          "humidity": 77,
          "irradiance": 0.05,
          "lux": 45,
          "moisture_percent": 0,
          "moisture_raw": 4095,
          "temperature": 31.7,
          "uv_index": 3.75,
          "uv_intensity": 9.36,
          "uv_raw": 1162,
          "uv_voltage": 0.936
        }
      }
    }
    ```

- GET `/api/sensors/battery`
  - Fetches only battery status from Firebase
  - Returns battery percentage and voltage
  - Response format:
    ```json
    {
      "success": true,
      "data": {
        "battery_percent": 85,
        "battery_voltage": 3.7,
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    }
    ```

## Reports API

- POST `/api/reports/generate`
  - Generates PDF report for specified date range
  - Body: `{ "startDate": "2024-01-01", "endDate": "2024-01-07", "reportType": "daily" }`
  - Report types: "daily" (aggregated) or "detailed" (raw data)

- GET `/api/reports/data?startDate=2024-01-01&endDate=2024-01-07`
  - Retrieves report data for date range without generating PDF

- GET `/api/reports/last24hours`
  - Gets sensor data from last 24 hours
  - Includes both raw sensor data and daily aggregates

- GET `/api/reports/download/:filename`
  - Downloads generated PDF report

## Data Collection System

The server automatically:
- Collects sensor data every 10 minutes from Firebase
- Stores data in MongoDB with TTL (auto-deletes after 24 hours)
- Aggregates daily data at midnight including:
  - Sunlight hours (lux > 1000)
  - Water level averages
  - UV exposure hours (UV index > 3.0)
  - Temperature/humidity min/max/avg
- Generates comprehensive reports with PDF output

## System Monitoring API

Monitor the automatic data collection system:

- GET `/api/system/status`
  - Overall system health and status
  - Data collection service status
  - Database statistics

- GET `/api/system/history?limit=20`
  - Recent data collection history
  - Recent daily aggregates
  - Default limit: 20 records

- POST `/api/system/test-collection`
  - Manually trigger data collection for testing
  - Useful to verify Firebase connectivity

- GET `/api/system/logs?hours=24`
  - Detailed collection logs for specified hours
  - Hourly statistics and collection rates
  - Performance monitoring

## How to Verify Automatic Operation

### 1. **Check System Status**
```bash
curl http://localhost:3000/api/system/status
```
Look for:
- `"dataCollection": { "isRunning": true }`
- Recent collection timestamps
- Total sensor readings count

### 2. **Monitor Collection History**
```bash
curl http://localhost:3000/api/system/history
```
Should show recent sensor data collections every 10 minutes.

### 3. **Test Manual Collection**
```bash
curl -X POST http://localhost:3000/api/system/test-collection
```
Verify Firebase connectivity and data storage.

### 4. **Check Collection Logs**
```bash
curl "http://localhost:3000/api/system/logs?hours=6"
```
Should show ~36 collections in 6 hours (every 10 minutes).

### 5. **Watch Console Logs**
Server console should show:
```
✅ Sensor data collected at 2024-01-01T10:00:00.000Z (Total: 1)
✅ Sensor data collected at 2024-01-01T10:10:00.000Z (Total: 2)
📊 Daily aggregate created for Mon Jan 01 2024 with 144 readings
```

### 6. **Verify Data Retention**
- Sensor data: Automatically deleted after 24 hours
- Daily aggregates: Stored permanently for reporting
- Check MongoDB collections: `SensorData` and `DailyAggregates`
