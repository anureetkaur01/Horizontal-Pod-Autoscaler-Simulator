# Horizontal-Pod-Autoscaler-Simulator

A real-time, interactive simulator for the Kubernetes Horizontal Pod Autoscaler (HPA). This project demonstrates how HPA works by using the actual Kubernetes HPA formula to scale real Docker containers based on simulated CPU load.

## 🚀 Features

- **Real-Time Visualization**: Dashboard showing CPU usage and pod count over time with live charts.
- **Formula-Based Scaling**: Uses the standard Kubernetes HPA formula:
  `desiredReplicas = ceil[currentReplicas * (currentCPU / targetCPU)]`
- **Docker Integration**: Scales real Nginx containers on your local machine to simulate pod scaling.
- **Interactive UI**: Drag the CPU slider to manually change load or use "Auto Traffic Mode" for dynamic simulation.
- **Stability Bounds**: Implements a stable range (30-70%) to prevent unnecessary scaling (thrashing).
- **Graceful Cleanup**: Automatically stops and removes all Docker containers on server shutdown.

## 📂 Project Structure

- `backend/`: Node.js/Express server that manages Docker containers and provides scaling APIs.
- `frontend/`: Interactive dashboard built with HTML, Vanilla CSS, and JavaScript (Chart.js).
- `tests/`: Comprehensive test suite including unit, integration, and load tests.

## 🛠️ Prerequisites

- **Node.js**: Installed on your system.
- **Docker Desktop**: Must be installed and running. The backend uses Docker to simulate pod scaling.

## 🏁 Getting Started

### 1. Start the Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    The backend runs on `http://localhost:5000`. It will initialize with 3 default pods (Docker containers).

### 2. Start the Frontend

You can run the frontend in two ways:

#### Option A: Using a Simple Server (Recommended)
This avoids CORS or browser security issues:
1.  From the project root directory, run:
    ```bash
    npx serve frontend
    ```
2.  Open the provided URL (usually `http://localhost:3000`) in your browser.

#### Option B: Open index.html Directly
1.  Navigate to the `frontend` directory.
2.  Double-click `index.html` to open it.
    *Note: Some browser security settings might block API requests to localhost when opening via file protocol.*

## 🎮 Using the Simulator

1.  **CPU Usage Slider**: Drag to simulate CPU load.
2.  **Auto Traffic Mode**: Toggles simulated fluctuating traffic between 20% and 95%.
3.  **Scaling Events Log**: Real-time log of HPA decisions and feedback loops.
4.  **Pod Container**: Visual representation of active "pods" (Docker containers).

## 🧪 Testing

The project includes three types of tests located in the `/tests` directory:

- **Unit Tests**: Test the core HPA formula logic in isolation.
  ```bash
  node tests/unit_test.js
  ```
- **Integration Tests**: Verify the Backend API endpoints (requires backend running).
  ```bash
  node tests/integration_test.js
  ```
- **Load Simulation**: Simulates a traffic profile to verify HPA convergence.
  ```bash
  node tests/load_test.js
  ```

## 🧰 Technologies Used

- **Backend**: Node.js, Express, Docker SDK (Child Process)
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Chart.js
- **Testing**: Node.js core modules