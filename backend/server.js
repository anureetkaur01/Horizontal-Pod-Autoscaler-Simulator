const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

let pods = [];

// Initialize with 3 real pods by starting Docker containers
function initializeDefaultPods(count) {
    console.log(`[BOOT] Scaling up to ${count} initial real Docker containers...`);
    for (let i = 0; i < count; i++) {
        startContainer((newCount) => {
            console.log(`[BOOT] Pod ${newCount}/${count} online.`);
        });
    }
}

// Start the boot sequence
initializeDefaultPods(3);

// Graceful shutdown to stop containers when server ends (Ctrl+C)
process.on('SIGINT', async () => {
    console.log("\x1b[33m\nGraceful shutdown... Stopping all containers.\x1b[0m");
    const stopPromises = pods.map(id => {
        return new Promise(resolve => {
            exec(`docker stop ${id} && docker rm ${id}`, (err) => {
                if (!err) console.log(`Stopped container: ${id}`);
                resolve();
            });
        });
    });
    await Promise.all(stopPromises);
    console.log("Cleanup complete. Exiting.");
    process.exit(0);
});

// start container
function startContainer(callback) {

    exec("docker run -d nginx", (err, stdout) => {

        if (err) {
            console.log(err);
            return;
        }

        const containerId = stdout.trim();

        pods.push(containerId);

        callback(pods.length);
    });

}

// stop container
function stopContainer(callback) {

    if (pods.length <= 1) return; 

    const id = pods.pop();

    exec(`docker stop ${id}`, () => {

        exec(`docker rm ${id}`, () => {

            callback(pods.length);

        });

    });

}

// scale up API
app.post("/scale-up", (req, res) => {

    startContainer((count) => {

        res.json({ pods: count });

    });

});

// scale down API
app.post("/scale-down", (req, res) => {

    stopContainer((count) => {

        res.json({ pods: count });

    });

});

// check pods
app.get("/pods", (req, res) => {

    res.json({ pods: pods.length });

});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please kill the process using it or choose another port.`);
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
});