# Horizontal-Pod-Autoscaler-Simulator

## Project Overview

This project is a simulation of the Kubernetes Horizontal Pod Autoscaler (HPA).  
It demonstrates how applications can automatically scale the number of pods based on CPU usage.

The simulator includes a web dashboard that allows users to adjust CPU load and observe how pods scale up or down automatically,also the pods are represented by real Docker containers.

---

## Features

- CPU usage simulator using slider
- Automatic scaling logic
- Pod visualization dashboard
- Scaling event logs
- Real-time CPU and pod charts
- Real Docker containers used to simulate pods

---

## Technology Stack

Frontend
- HTML
- CSS
- JavaScript
- Chart.js

Backend
- Node.js
- Express.js

Infrastructure
- Docker

---

## Autoscaling Logic

The simulator follows simple scaling rules:

If CPU usage > 70%  
→ Increase pods by 1

If CPU usage < 30%  
→ Decrease pods by 1

Constraints:

Minimum pods = 1  
Maximum pods = 10

Scaling occurs gradually to simulate real autoscaler behavior.

---

## Architecture

Frontend Dashboard  
↓  
Autoscaler Logic  
↓  
Backend API (Node.js)  
↓  
Docker CLI  
↓  
Containers (Simulated Pods)

---

## How to Run the Project

### 1. Install Docker
Install Docker Desktop and ensure Docker is running.

### 2. Pull the nginx image

docker pull nginx

### 3. Start the backend server

cd backend  
node server.js

Backend will start on port 5000.

### 4. Open the frontend dashboard

Open:

frontend/index.html

in your browser.

### 5. Test autoscaling

Increase CPU above 70% to scale up pods.

Decrease CPU below 30% to scale down pods.

---

## Demo

During scaling events, Docker containers are created or removed automatically.

You can verify this using:

docker ps

Each container represents a simulated pod.

---

## Conclusion

This project demonstrates the concept of autoscaling used in Kubernetes by simulating Horizontal Pod Autoscaler behavior using a web dashboard and Docker containers.
