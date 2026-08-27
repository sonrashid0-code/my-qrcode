const express = require("express");

const app = express();
const PORT = 5000;

app.use(express.json());

app.use(express.static(__dirname));


const studentLocations = {};


/* RECEIVE LOCATION */

app.post("/api/location", (req, res) => {

    const {
        studentID,
        latitude,
        longitude
    } = req.body;

    if (
        !studentID ||
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid location data."
        });
    }

    studentLocations[studentID] = {
        latitude,
        longitude,
        updatedAt: new Date().toISOString()
    };

    console.log(
        `Location received for ${studentID}:`,
        latitude,
        longitude
    );

    res.json({
        success: true,
        message: "Location received."
    });

});


/* GET LOCATION */

app.get("/api/location/:studentID", (req, res) => {

    const studentID = req.params.studentID;

    const location =
        studentLocations[studentID];

    if (!location) {

        return res.status(404).json({
            success: false,
            message: "No location available."
        });

    }

    res.json({
        success: true,
        studentID: studentID,
        location: location
    });

});


/* START SERVER */

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `School Tracking Server running at http://localhost:${PORT}`
    );

});