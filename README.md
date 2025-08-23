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
```

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
