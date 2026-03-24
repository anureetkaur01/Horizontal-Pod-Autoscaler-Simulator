// Configuration
const CONFIG = {
    minPods: 1,
    maxPods: 10,
    scaleUpThreshold: 70, // %
    scaleDownThreshold: 30, // %
    initialCpu: 50,
    initialPods: 3,
    chartUpdateIntervalMs: 1000,
    maxDataPoints: 30,
    targetCpu: 50 // New HPA target CPU
};

const TARGET_CPU = CONFIG.targetCpu;
const DEBUG = true; // Set to true for detailed scaling logs

// State
let state = {
    cpuUsage: CONFIG.initialCpu,
    previousCpu: CONFIG.initialCpu,
    podCount: CONFIG.initialPods,
    status: 'STABLE', // 'system stable', 'scaling up', 'scaling down'
    history: {
        time: [],
        cpu: [],
        pods: []
    },
    podCounterId: CONFIG.initialPods, // for generating unique Pod IDs monotonically
    autoMode: false,
    autoInterval: null
};

// DOM Elements
const els = {
    cpuSlider: document.getElementById('cpu-slider'),
    cpuValueDisplay: document.getElementById('cpu-value-display'),
    currentPodsDisplay: document.getElementById('current-pods'),
    btnIncrease: document.getElementById('btn-increase'),
    btnDecrease: document.getElementById('btn-decrease'),
    autoBtn: document.getElementById('auto-mode-btn'),
    systemStatusBadge: document.getElementById('system-status-badge'),
    backendStatusBadge: document.getElementById('backend-status-badge'),
    podContainer: document.getElementById('pod-container'),
    logContainer: document.getElementById('log-container')
};

// Charts configuration
let cpuChart, podChart;
Chart.defaults.color = '#8b949e';
Chart.defaults.font.family = "'Inter', sans-serif";
async function checkBackend() {
    try {
        const response = await fetch("http://localhost:5000/pods");
        if (response.ok) {
            const data = await response.json();
            els.backendStatusBadge.textContent = "Backend Connected";
            els.backendStatusBadge.className = "badge stable";
            if (data.pods !== state.podCount && !scaleCooldown) {
                // Synchronize pod count but avoid CPU glitching
                const oldPods = state.podCount;
                state.podCount = data.pods;
                els.currentPodsDisplay.textContent = state.podCount;
                renderPods();
                
                // If it's the first sync or a major mismatch, adjust CPU to prevent 100% spikes
                if (oldPods === 0 && state.podCount > 0) {
                   state.cpuUsage = CONFIG.initialCpu;
                   els.cpuSlider.value = state.cpuUsage;
                   updateCpuDisplay();
                }
            }
        } else {
            throw new Error();
        }
    } catch (e) {
        els.backendStatusBadge.textContent = "Backend Disconnected";
        els.backendStatusBadge.className = "badge error";
    }
}

async function scaleUp() {
    try {
        const response = await fetch("http://localhost:5000/scale-up", {
            method: "POST"
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        updatePods(data.pods);
        return true;
    } catch (error) {
        console.error("Scale up failed:", error);
        updateLog(`Scale up failed: ${error.message}`, 'log-error');
        return false;
    }
}

async function scaleDown() {
    try {
        const response = await fetch("http://localhost:5000/scale-down", {
            method: "POST"
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        updatePods(data.pods);
        return true;
    } catch (error) {
        console.error("Scale down failed:", error);
        updateLog(`Scale down failed: ${error.message}`, 'log-error');
        return false;
    }
}
function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
            x: {
                display: false // Hide X axis labels for cleaner look
            },
            y: {
                grid: {
                    color: '#30363d',
                    drawBorder: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    const ctxCpu = document.getElementById('cpuChart').getContext('2d');
    cpuChart = new Chart(ctxCpu, {
        type: 'line',
        data: {
            labels: state.history.time,
            datasets: [{
                label: 'CPU Usage (%)',
                data: state.history.cpu,
                borderColor: '#da3633',
                backgroundColor: 'rgba(218, 54, 51, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                title: { display: true, text: 'CPU Usage Over Time', color: '#c9d1d9', align: 'start', font: { size: 14 } }
            },
            scales: {
                ...commonOptions.scales,
                y: { ...commonOptions.scales.y, min: 0, max: 100 }
            }
        }
    });

    const ctxPod = document.getElementById('podChart').getContext('2d');
    podChart = new Chart(ctxPod, {
        type: 'line',
        data: {
            labels: state.history.time,
            datasets: [{
                label: 'Pod Count',
                data: state.history.pods,
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                stepped: true, // Pods are discrete
                pointRadius: 0
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                title: { display: true, text: 'Pod Count Over Time', color: '#c9d1d9', align: 'start', font: { size: 14 } }
            },
            scales: {
                ...commonOptions.scales,
                y: { ...commonOptions.scales.y, min: 0, max: 12, ticks: { stepSize: 1 } }
            }
        }
    });
}

function updateCharts() {
    const now = new Date().toLocaleTimeString();

    state.history.time.push(now);
    state.history.cpu.push(state.cpuUsage);
    state.history.pods.push(state.podCount);

    if (state.history.time.length > CONFIG.maxDataPoints) {
        state.history.time.shift();
        state.history.cpu.shift();
        state.history.pods.shift();
    }

    cpuChart.update();
    podChart.update();
}

function updateLog(message, actionClass = '') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const time = new Date().toLocaleTimeString();

    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-content ${actionClass}">${message}</span>
    `;

    els.logContainer.appendChild(entry);

    // Limit number of logs to prevent memory/DOM overflow causing it to stop
    while (els.logContainer.children.length > 50) {
        els.logContainer.removeChild(els.logContainer.firstChild);
    }

    els.logContainer.scrollTop = els.logContainer.scrollHeight;
}

function renderPods() {
    // Current dom pod count
    const currentDomPods = els.podContainer.children.length;

    if (state.podCount > currentDomPods) {
        // Add pods
        const podsToAdd = state.podCount - currentDomPods;
        for (let i = 0; i < podsToAdd; i++) {
            state.podCounterId++;
            const podEl = document.createElement('div');
            podEl.className = 'pod';
            podEl.innerHTML = `
                <div class="pod-icon"></div>
                <div class="pod-label">Pod ${state.podCounterId}</div>
            `;
            els.podContainer.appendChild(podEl);
            if (DEBUG) console.log(`[UI] + Added Pod ${state.podCounterId}`);
        }
    } else if (state.podCount < currentDomPods) {
        // Remove pods
        const podsToRemove = currentDomPods - state.podCount;
        for (let i = 0; i < podsToRemove; i++) {
            const lastPod = els.podContainer.lastElementChild;
            if (lastPod) {
                lastPod.classList.add('removing');
                const podLabel = lastPod.querySelector('.pod-label').textContent;
                // Wait for animation
                setTimeout(() => {
                    if (lastPod.parentNode === els.podContainer) {
                        els.podContainer.removeChild(lastPod);
                        if (DEBUG) console.log(`[UI] - Removed ${podLabel}`);
                    }
                }, 400); // 400ms match css
            }
        }
    }
}
function updatePods(count) {
    const oldPods = state.podCount;
    state.podCount = count;

    if (DEBUG) console.log(`[STATE] Total Pods: ${state.podCount}`);

    // Feedback Loop: Adding pods reduces average CPU usage (Load Spreading)
    // This allows the HPA formula to stabilize once the desired pod count is reached.
    if (oldPods > 0 && count > 0 && oldPods !== count) {
        let totalLoad = state.cpuUsage * oldPods;
        state.cpuUsage = Math.max(1, Math.min(100, Math.round(totalLoad / count)));
        els.cpuSlider.value = state.cpuUsage;
        updateCpuDisplay();
    } else if (count === 0) {
        // If no pods exist, CPU usage per pod is technically undefined or 100%
        // But for simulation, let's keep it at 100% to represent overloaded state
        state.cpuUsage = 100;
        els.cpuSlider.value = state.cpuUsage;
        updateCpuDisplay();
    }

    els.currentPodsDisplay.textContent = state.podCount;
    renderPods();
}

function setSystemStatus(statusKey) {
    els.systemStatusBadge.classList.remove('stable', 'scaling-up', 'scaling-down');

    if (statusKey === 'STABLE') {
        els.systemStatusBadge.textContent = 'System Stable';
        els.systemStatusBadge.classList.add('stable');
    } else if (statusKey === 'SCALING_UP') {
        els.systemStatusBadge.textContent = 'Scaling Up';
        els.systemStatusBadge.classList.add('scaling-up');
    } else if (statusKey === 'SCALING_DOWN') {
        els.systemStatusBadge.textContent = 'Scaling Down';
        els.systemStatusBadge.classList.add('scaling-down');
    }
}

// Format CPU display color based on load
function updateCpuDisplay() {
    els.cpuValueDisplay.textContent = `${state.cpuUsage}%`;
    if (state.cpuUsage >= 70) {
        els.cpuValueDisplay.style.color = '#ff7b72'; // Red-ish
    } else if (state.cpuUsage > 30) {
        els.cpuValueDisplay.style.color = '#f0883e'; // Orange-ish
    } else {
        els.cpuValueDisplay.style.color = '#79c0ff'; // Blue-ish
    }
}

function startAutoMode() {
    state.autoInterval = setInterval(async () => {
        let base = 20;
        let fluctuation = Math.floor(Math.random() * 76); // 20 to 95
        let newCpu = base + fluctuation;
        await setCpu(newCpu);
    }, 3000);
}

function stopAutoMode() {
    clearInterval(state.autoInterval);
    state.autoInterval = null;
}

// Core Autoscaling Logic Function
let scaleCooldown = false;
async function checkAutoscaling() {
    if (scaleCooldown) return;

    // STABLE RANGE: 30-70% CPU (from CONFIG) remains stable
    if (state.cpuUsage >= CONFIG.scaleDownThreshold && state.cpuUsage <= CONFIG.scaleUpThreshold) {
        setSystemStatus('STABLE');
        return;
    }

    let didScale = false;
    const oldPodCount = state.podCount;

    // KUBERNETES HPA FORMULA-BASED SCALING
    // Formula: desiredPods = ceil[currentPods * (currentCPU / targetCPU)]
    let desiredPods = Math.ceil(
        state.podCount * (state.cpuUsage / TARGET_CPU)
    );

    if (DEBUG) {
        console.log(`[DEBUG] CPU: ${state.cpuUsage}% | Current Pods: ${state.podCount} | Desired Pods: ${desiredPods}`);
    }

    // Clamp values between min and max pods
    desiredPods = Math.max(CONFIG.minPods, Math.min(CONFIG.maxPods, desiredPods));

    // Determine if we need to move towards desiredPods
    if (desiredPods > state.podCount) {
        setSystemStatus('SCALING_UP');
        didScale = await scaleUp();
        if (didScale) {
            updateLog(
                `CPU: ${state.cpuUsage}% → Target Pods: ${desiredPods} → Scaling from ${oldPodCount} → ${state.podCount}`,
                'log-action-up'
            );
        }
    }
    else if (desiredPods < state.podCount) {
        setSystemStatus('SCALING_DOWN');
        didScale = await scaleDown();
        if (didScale) {
            updateLog(
                `CPU: ${state.cpuUsage}% → Target Pods: ${desiredPods} → Scaling from ${oldPodCount} → ${state.podCount}`,
                'log-action-down'
            );
        }
    } else {
        setSystemStatus('STABLE');
    }

    if (didScale) {
        // cooldown to simulate provisioning delay
        scaleCooldown = true;
        setTimeout(() => {
            scaleCooldown = false;
            // After cooldown, trigger check to see if we still need to scale
            checkAutoscaling();
        }, 1500);
    }
}
// Input Handlers
async function setCpu(val) {
    let newVal = Math.max(0, Math.min(100, val));
    if (newVal !== state.cpuUsage) {
        state.previousCpu = state.cpuUsage;
        state.cpuUsage = newVal;
        els.cpuSlider.value = newVal;
        updateCpuDisplay();
      await checkAutoscaling();
    }
}

// Update the display text immediately while dragging, but don't trigger scaling yet
els.cpuSlider.addEventListener('input', (e) => {
    let tempVal = parseInt(e.target.value, 10);
    els.cpuValueDisplay.textContent = `${tempVal}%`;
    if (tempVal >= 70) {
        els.cpuValueDisplay.style.color = '#ff7b72';
    } else if (tempVal > 30) {
        els.cpuValueDisplay.style.color = '#f0883e';
    } else {
        els.cpuValueDisplay.style.color = '#79c0ff';
    }
});

// Trigger actual CPU state update and scaling only when the user finishes dragging (releases mouse)
els.cpuSlider.addEventListener('change', (e) => {
    setCpu(parseInt(e.target.value, 10));
});

els.btnIncrease.addEventListener('click', () => {
    if (!state.autoMode) setCpu(state.cpuUsage + 15);
});

els.btnDecrease.addEventListener('click', () => {
    if (!state.autoMode) setCpu(state.cpuUsage - 15);
});

// Auto Mode Toggle logic
els.autoBtn.addEventListener('click', () => {
    state.autoMode = !state.autoMode;

    if (state.autoMode) {
        startAutoMode();
        els.autoBtn.textContent = "Stop Auto Traffic";
        els.autoBtn.classList.replace('btn-secondary', 'btn-primary');
        els.cpuSlider.disabled = true;
        els.btnIncrease.disabled = true;
        els.btnDecrease.disabled = true;
        updateLog("Auto Traffic Mode Started (Simulating Real Load)", "log-action-info");
    } else {
        stopAutoMode();
        els.autoBtn.textContent = "Start Auto Traffic";
        els.autoBtn.classList.replace('btn-primary', 'btn-secondary');
        els.cpuSlider.disabled = false;
        els.btnIncrease.disabled = false;
        els.btnDecrease.disabled = false;
        updateLog("Auto Traffic Mode Stopped", "log-action-info");
    }
});

// Initialization
function init() {
    // Initial Render
    els.cpuSlider.value = state.cpuUsage;
    els.currentPodsDisplay.textContent = state.podCount;
    updateCpuDisplay();

    // Initial Pod injection
    els.podContainer.innerHTML = ''; // Clear
    for (let i = 1; i <= state.podCount; i++) {
        const podEl = document.createElement('div');
        podEl.className = 'pod';
        podEl.innerHTML = `
            <div class="pod-icon"></div>
            <div class="pod-label">Pod ${i}</div>
        `;
        els.podContainer.appendChild(podEl);
    }

    initCharts();

    updateLog("System initialized. Scaling using K8s HPA formula (Target CPU: 50%).");

    // Start periodic checks
    checkBackend();
    setInterval(checkBackend, 5000);
    setInterval(updateCharts, CONFIG.chartUpdateIntervalMs);
}

// Run
init();
