const http = require('http');

/**
 * Integration Tests for HPA Backend
 * Tests the /pods, /scale-up, and /scale-down endpoints.
 * Assumes backend is running on localhost:5000.
 */

const BASE_URL = 'http://localhost:5000';

function request(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
}

async function runIntegrationTests() {
    console.log("\x1b[34m--- Running Integration Tests: Backend API ---\x1b[0m");

    try {
        // 1. Check initial pod count
        const initial = await request('/pods');
        console.log(`\x1b[32m[PASS]\x1b[0m GET /pods (Initial count: ${initial.pods})`);

        // 2. Scale up
        const up = await request('/scale-up', 'POST');
        if (up.pods === initial.pods + 1) {
            console.log(`\x1b[32m[PASS]\x1b[0m POST /scale-up (New count: ${up.pods})`);
        } else {
            console.log(`\x1b[31m[FAIL]\x1b[0m POST /scale-up (Expected ${initial.pods + 1}, got ${up.pods})`);
        }

        // 3. Scale down
        const down = await request('/scale-down', 'POST');
        if (down.pods === up.pods - 1) {
            console.log(`\x1b[32m[PASS]\x1b[0m POST /scale-down (New count: ${down.pods})`);
        } else {
            console.log(`\x1b[31m[FAIL]\x1b[0m POST /scale-down (Expected ${up.pods - 1}, got ${down.pods})`);
        }

        console.log("\n\x1b[32mIntegration Tests Passed!\x1b[0m");
        return true;
    } catch (err) {
        console.error(`\x1b[31mIntegration Tests Failed: ${err.message}\x1b[0m`);
        console.log("Make sure the backend is running on port 5000.");
        return false;
    }
}

if (require.main === module) {
    runIntegrationTests().then(success => process.exit(success ? 0 : 1));
}
