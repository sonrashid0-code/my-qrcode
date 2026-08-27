const express = require("express");

const app = express();

const PORT = process.env.PORT || 5000;


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));


/* =====================================================
   DATA
===================================================== */

const students = [];

const studentLocations = {};


/* =====================================================
   SERVER STATUS
===================================================== */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        message: "School QR System server is running.",
        students: students.length
    });

});


/* =====================================================
   REGISTER STUDENT
===================================================== */

app.post("/api/students", (req, res) => {

    try {

        const {
            name,
            id,
            className,
            parentName,
            parentPhone,
            medicalInfo,
            password,
            attendance,
            performance,
            status
        } = req.body;


        if (!name || !id || !className || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Student name, ID, class and password are required."
            });

        }


        const studentID =
            String(id).trim();

        const studentName =
            String(name).trim();


        const existingStudent =
            students.find(
                student =>
                    student.id.toLowerCase() ===
                    studentID.toLowerCase()
            );


        if (existingStudent) {

            return res.status(409).json({
                success: false,
                message:
                    "A student with this ID already exists."
            });

        }


        const student = {

            name: studentName,

            id: studentID,

            className:
                String(className).trim(),

            parentName:
                String(parentName || "").trim(),

            parentPhone:
                String(parentPhone || "").trim(),

            medicalInfo:
                String(medicalInfo || "").trim(),

            password:
                String(password),

            attendance:
                String(attendance || "").trim(),

            performance:
                String(performance || "").trim(),

            status:
                String(status || "ACTIVE").trim(),

            arrivalTime: null,

            arrivalDate: null,

            lastScan: null,

            departureTime: null,

            createdAt:
                new Date().toISOString()

        };


        students.push(student);


        console.log(
            `Student registered: ${student.id}`
        );


        res.status(201).json({

            success: true,

            message:
                "Student saved successfully.",

            student: {

                name: student.name,

                id: student.id,

                className: student.className,

                parentName: student.parentName,

                parentPhone: student.parentPhone,

                medicalInfo: student.medicalInfo,

                attendance: student.attendance,

                performance: student.performance,

                status: student.status,

                arrivalTime: student.arrivalTime,

                arrivalDate: student.arrivalDate,

                lastScan: student.lastScan,

                departureTime: student.departureTime,

                createdAt: student.createdAt

            }

        });

    }

    catch (error) {

        console.error(
            "Student registration error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to save student."

        });

    }

});


/* =====================================================
   GET ALL STUDENTS
===================================================== */

app.get("/api/students", (req, res) => {

    const safeStudents =
        students.map(student => ({

            name: student.name,

            id: student.id,

            className: student.className,

            parentName: student.parentName,

            parentPhone: student.parentPhone,

            medicalInfo: student.medicalInfo,

            attendance: student.attendance,

            performance: student.performance,

            status: student.status,

            arrivalTime: student.arrivalTime,

            arrivalDate: student.arrivalDate,

            lastScan: student.lastScan,

            departureTime: student.departureTime,

            createdAt: student.createdAt

        }));


    res.json({

        success: true,

        students: safeStudents

    });

});


/* =====================================================
   GET ONE STUDENT
===================================================== */

app.get("/api/students/:studentID", (req, res) => {

    const studentID =
        String(
            req.params.studentID || ""
        ).trim();


    const student =
        students.find(
            item =>
                item.id.toLowerCase() ===
                studentID.toLowerCase()
        );


    if (!student) {

        return res.status(404).json({

            success: false,

            message:
                "Student not found."

        });

    }


    res.json({

        success: true,

        student: {

            name: student.name,

            id: student.id,

            className: student.className,

            parentName: student.parentName,

            parentPhone: student.parentPhone,

            medicalInfo: student.medicalInfo,

            attendance: student.attendance,

            performance: student.performance,

            status: student.status,

            arrivalTime: student.arrivalTime,

            arrivalDate: student.arrivalDate,

            lastScan: student.lastScan,

            departureTime: student.departureTime,

            createdAt: student.createdAt

        }

    });

});


/* =====================================================
   QR SCAN
   AUTOMATIC ARRIVAL TIME
===================================================== */

app.post("/api/scan/:studentID", (req, res) => {

    try {

        const studentID =
            String(
                req.params.studentID || ""
            ).trim();


        const student =
            students.find(
                item =>
                    item.id.toLowerCase() ===
                    studentID.toLowerCase()
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        /*
         * SERVER TIME
         *
         * The server creates the arrival
         * timestamp.
         */

        const now =
            new Date();


        const arrivalTime =
            now.toLocaleTimeString(
                "en-UG",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        const arrivalDate =
            now.toLocaleDateString(
                "en-UG"
            );


        const scanTimestamp =
            now.toISOString();


        /*
         * SAVE ARRIVAL
         */

        student.arrivalTime =
            arrivalTime;

        student.arrivalDate =
            arrivalDate;

        student.lastScan =
            scanTimestamp;


        console.log(
            `QR SCAN: ${student.id} - ${arrivalDate} ${arrivalTime}`
        );


        res.json({

            success: true,

            message:
                "QR scan recorded successfully.",

            scan: {

                studentID:
                    student.id,

                arrivalTime:
                    student.arrivalTime,

                arrivalDate:
                    student.arrivalDate,

                timestamp:
                    student.lastScan

            },

            student: {

                name:
                    student.name,

                id:
                    student.id,

                className:
                    student.className,

                attendance:
                    student.attendance,

                performance:
                    student.performance,

                status:
                    student.status,

                arrivalTime:
                    student.arrivalTime,

                arrivalDate:
                    student.arrivalDate

            }

        });

    }

    catch (error) {

        console.error(
            "QR scan error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to record QR scan."

        });

    }

});


/* =====================================================
   STUDENT PASSWORD LOGIN
===================================================== */

app.post("/api/student-login", (req, res) => {

    const {
        studentID,
        password
    } = req.body;


    if (!studentID || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Student ID and password are required."

        });

    }


    const student =
        students.find(
            item =>
                item.id.toLowerCase() ===
                String(studentID)
                    .trim()
                    .toLowerCase()
        );


    if (!student) {

        return res.status(404).json({

            success: false,

            message:
                "Student not found."

        });

    }


    if (
        String(password) !==
        String(student.password)
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Incorrect password."

        });

    }


    res.json({

        success: true,

        message:
            "Password accepted.",

        student: {

            name:
                student.name,

            id:
                student.id,

            className:
                student.className,

            parentName:
                student.parentName,

            parentPhone:
                student.parentPhone,

            medicalInfo:
                student.medicalInfo,

            attendance:
                student.attendance,

            performance:
                student.performance,

            status:
                student.status,

            arrivalTime:
                student.arrivalTime,

            arrivalDate:
                student.arrivalDate,

            lastScan:
                student.lastScan,

            departureTime:
                student.departureTime

        }

    });

});


/* =====================================================
   RECEIVE STUDENT LOCATION
===================================================== */

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

            message:
                "Invalid location data."

        });

    }


    const student =
        students.find(
            item =>
                item.id.toLowerCase() ===
                String(studentID)
                    .trim()
                    .toLowerCase()
        );


    if (!student) {

        return res.status(404).json({

            success: false,

            message:
                "Student not found."

        });

    }


    studentLocations[student.id] = {

        latitude,

        longitude,

        updatedAt:
            new Date().toISOString()

    };


    console.log(
        `Location received for ${student.id}:`,
        latitude,
        longitude
    );


    res.json({

        success: true,

        message:
            "Location received."

    });

});


/* =====================================================
   GET STUDENT LOCATION
===================================================== */

app.get("/api/location/:studentID", (req, res) => {

    const studentID =
        String(
            req.params.studentID || ""
        ).trim();


    const location =
        studentLocations[studentID];


    if (!location) {

        return res.status(404).json({

            success: false,

            message:
                "No location available."

        });

    }


    res.json({

        success: true,

        studentID,

        location

    });

});


/* =====================================================
   DELETE STUDENT
===================================================== */

app.delete("/api/students/:studentID", (req, res) => {

    const studentID =
        String(
            req.params.studentID || ""
        )
        .trim()
        .toLowerCase();


    const index =
        students.findIndex(
            student =>
                student.id.toLowerCase() ===
                studentID
        );


    if (index === -1) {

        return res.status(404).json({

            success: false,

            message:
                "Student not found."

        });

    }


    const removedStudent =
        students.splice(
            index,
            1
        )[0];


    delete studentLocations[
        removedStudent.id
    ];


    res.json({

        success: true,

        message:
            "Student deleted successfully."

    });

});


/* =====================================================
   UNKNOWN API ROUTE
===================================================== */

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                "API endpoint not found."

        });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `School Tracking Server running on port ${PORT}`
        );

    }
);