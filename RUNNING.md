# Running the HPA Simulator

Follow these steps to get the Horizontal Pod Autoscaler Simulator running on your local machine.

## Prerequisites

- **Docker Desktop**: Must be installed and running. The backend uses Docker to simulate pod scaling.
- **Node.js**: Installed on your system.

## 1. Start the Backend

1.  Open a terminal in the `backend` directory.
2.  Install dependencies (if it's your first time):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    The backend should be running on `http://localhost:5000`.

## 2. Start the Frontend

You can run the frontend in two ways:

### Option A: Using a Simple Server (Recommended)
This avoids potential CORS or browser security issues with `file://` protocols.
1.  Open a terminal in the root directory.
2.  Run:
    ```bash
    npx serve frontend
    ```
3.  Open the provided URL (usually `http://localhost:3000`) in your browser.

### Option B: Open index.html Directly
1.  Navigate to the `frontend` directory.
2.  Double-click `index.html` to open it in your browser.
    *Note: Some browser security settings might block API requests to localhost when opening via file protocol.*

## 3. Using the Simulator

1.  Once both are running, you'll see the HPA Simulator dashboard.
2.  Drag the **CPU Usage** slider.
3.  When CPU exceeds **70%**, the system will scale up (add pods).
4.  When CPU drops below **30%**, the system will scale down (remove pods).
5.  Check the **Scaling Events Log** and **Pod Container** for real-time updates.
