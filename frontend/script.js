// Configuration
const CONFIG = {
    minPods: 1,
    maxPods: 10,
    scaleUpThreshold: 70, // %
    scaleDownThreshold: 30, // %
    initialCpu: 20,
    initialPods: 2,
    chartUpdateIntervalMs: 1000,
    maxDataPoints: 30
};

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
    podCounterId: CONFIG.initialPods // for generating unique Pod IDs monotonically
};

// DOM Elements
const els = {
    cpuSlider: document.getElementById('cpu-slider'),
    cpuValueDisplay: document.getElementById('cpu-value-display'),
    currentPodsDisplay: document.getElementById('current-pods'),
    btnIncrease: document.getElementById('btn-increase'),
    btnDecrease: document.getElementById('btn-decrease'),
    systemStatusBadge: document.getElementById('system-status-badge'),
    podContainer: document.getElementById('pod-container'),
    logContainer: document.getElementById('log-container')
};

// Charts configuration
let cpuChart, podChart;
Chart.defaults.color = '#8b949e';
Chart.defaults.font.family = "'Inter', sans-serif";
function updatePods(count) {

    state.podCount = count;

    els.currentPodsDisplay.textContent = state.podCount;

    renderPods();
}
async function scaleUp() {

    const response = await fetch("http://localhost:5000/scale-up", {
        method: "POST"
    });

    const data = await response.json();

    updatePods(data.pods);
}

async function scaleDown() {

    const response = await fetch("http://localhost:5000/scale-down", {
        method: "POST"
    });

    const data = await response.json();

    updatePods(data.pods);
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
        }
    } else if (state.podCount < currentDomPods) {
        // Remove pods
        const podsToRemove = currentDomPods - state.podCount;
        for (let i = 0; i < podsToRemove; i++) {
            const lastPod = els.podContainer.lastElementChild;
            if (lastPod) {
                lastPod.classList.add('removing');
                // Wait for animation
                setTimeout(() => {
                    if (lastPod.parentNode === els.podContainer) {
                        els.podContainer.removeChild(lastPod);
                    }
                }, 400); // 400ms match css
            }
        }
    }
}
function updatePods(count) {
    state.podCount = count;
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

// Core Autoscaling Logic Function
let scaleCooldown = false;
async function checkAutoscaling() {

    if (scaleCooldown) return;

    const oldPodCount = state.podCount;
    let didScale = false;

    // SCALE UP
    if (
        state.cpuUsage > CONFIG.scaleUpThreshold &&
        state.cpuUsage > state.previousCpu &&
        state.podCount < CONFIG.maxPods
    ) {

        setSystemStatus('SCALING_UP');

        await scaleUp();   // wait for backend

        updateLog(
            `CPU reached ${state.cpuUsage}% (up from ${state.previousCpu}%)<br>
             Scaling up from ${oldPodCount} → ${oldPodCount + 1}`,
            'log-action-up'
        );

        didScale = true;
    }

    // SCALE DOWN
    else if (
        state.cpuUsage < CONFIG.scaleDownThreshold &&
        state.cpuUsage < state.previousCpu &&
        state.podCount > CONFIG.minPods
    ) {

        setSystemStatus('SCALING_DOWN');

        await scaleDown();  // wait for backend

        updateLog(
            `CPU dropped to ${state.cpuUsage}% (down from ${state.previousCpu}%)<br>
             Scaling down from ${oldPodCount} → ${oldPodCount - 1}`,
            'log-action-down'
        );

        didScale = true;
    }

    if (didScale) {

        // cooldown to simulate provisioning delay
        scaleCooldown = true;

        setTimeout(() => {
            scaleCooldown = false;
            setSystemStatus('STABLE');
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
    setCpu(state.cpuUsage + 15);
});

els.btnDecrease.addEventListener('click', () => {
    setCpu(state.cpuUsage - 15);
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

    updateLog("System initialized with 2 pods. Target thresholds: Scale UP &gt; 70%, Scale DOWN &lt; 30%.");

    // Start chart data interval
    setInterval(updateCharts, CONFIG.chartUpdateIntervalMs);
}

// Run
init();
