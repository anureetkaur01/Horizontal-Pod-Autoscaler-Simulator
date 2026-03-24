const TestingUtils = require('../frontend/testing-utils.js');

/**
 * Unit Tests for HPA Autoscaling Formula
 * Tests the core logic in isolation without backend or UI.
 */

function runUnitTests() {
    console.log("\x1b[34m--- Running Unit Tests: HPA Formula ---\x1b[0m");
    
    const target = 50;
    const testCases = [
        { cpu: 85, pods: 2, expected: 4, label: "Scale Up: 85% CPU, 2 Pods -> 4 Pods" },
        { cpu: 20, pods: 4, expected: 2, label: "Scale Down: 20% CPU, 4 Pods -> 2 Pods" },
        { cpu: 50, pods: 3, expected: 3, label: "Stable: 50% CPU, 3 Pods -> 3 Pods" },
        { cpu: 100, pods: 1, expected: 2, label: "Max Load: 100% CPU, 1 Pod -> 2 Pods" },
        { cpu: 0, pods: 10, expected: 1, label: "Zero Load: 0% CPU, 10 Pods -> 1 Pod (Min Limit)" }
    ];

    let passedCount = 0;
    testCases.forEach(tc => {
        const result = TestingUtils.testFormula(tc.cpu, tc.pods, target);
        if (result === tc.expected) {
            console.log(`\x1b[32m[PASS]\x1b[0m ${tc.label}`);
            passedCount++;
        } else {
            console.log(`\x1b[31m[FAIL]\x1b[0m ${tc.label} (Expected ${tc.expected}, got ${result})`);
        }
    });

    console.log(`\nUnit Tests Summary: ${passedCount}/${testCases.length} passed.`);
    return passedCount === testCases.length;
}

if (require.main === module) {
    const success = runUnitTests();
    process.exit(success ? 0 : 1);
}
