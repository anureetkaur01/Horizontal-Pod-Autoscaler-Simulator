const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

let pods = [];

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

    if (pods.length === 0) return;

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

app.listen(5000, () => {

    console.log("Backend running on port 5000");

});