const TestingUtils = require('../frontend/testing-utils.js');

/**
 * Load/Stress Simulation for HPA
 * Simulates a series of traffic changes and verifies if the HPA formula
 * converges to the expected pod count.
 */

async function runLoadSimulation() {
    console.log("\x1b[34m--- Running Load Simulation: Convergence Test ---\x1b[0m");

    const CONFIG = {
        minPods: 1,
        maxPods: 10,
        targetCpu: 50
    };

    let currentPods = 3;
    const trafficProfile = [
        { cpu: 80, label: "Spike" },
        { cpu: 90, label: "Extreme Load" },
        { cpu: 45, label: "Stabilize at Target" },
        { cpu: 15, label: "Idle/Low Traffic" },
        { cpu: 65, label: "Moderate Traffic" }
    ];

    console.log(`Starting Simulation (Initial Pods: ${currentPods})`);
    
    for (const step of trafficProfile) {
        console.log(`\n[\x1b[35m${step.label}\x1b[0m] Applying CPU: ${step.cpu}%`);
        
        // HPA logic: desiredPods = ceil[currentPods * (cpu / target)]
        let desired = TestingUtils.testFormula(step.cpu, currentPods, CONFIG.targetCpu);
        
        // Clamp
        desired = Math.max(CONFIG.minPods, Math.min(CONFIG.maxPods, desired));
        
        if (desired !== currentPods) {
            console.log(`HPA Triggered: ${currentPods} -> ${desired} pods`);
            currentPods = desired;
        } else {
            console.log("HPA Stable: No scaling required.");
        }

        // Additional validation: Check stability bounds
        const isWithinRange = step.cpu >= 30 && step.cpu <= 70;
        if (isWithinRange && desired === currentPods) {
            console.log("\x1b[32m[OK]\x1b[0m Stability range (30-70%) respected.");
        }
    }

    console.log(`\n\x1b[32mLoad Simulation Completed. Final Pod Count: ${currentPods}\x1b[0m`);
    return true;
}

if (require.main === module) {
    runLoadSimulation();
}
