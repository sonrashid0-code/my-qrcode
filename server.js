// server.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + extension);
    }
});

const upload = multer({ storage });
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;


/* =====================================================
   DATABASE
===================================================== */

const DATA_FILE = path.join(__dirname, "students.json");

function loadStudents() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify([], null, 2)
            );

        }

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "Could not load students:",
            error
        );

        return [];
    }
}


function saveStudents() {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            students,
            null,
            2
        )
    );

}


const students = loadStudents();

const studentLocations = {};


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));


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

app.post("/api/students", upload.single("photo"), (req, res) => {
    try {

 const {
    name,
    id,
    className,
    subjects,
    parentName,
    parentPhone,
    medicalInfo,
    password,
    attendance,
    performance,
    status,
    photo,
    feesBalance
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
                subjects: Array.isArray(subjects) ? subjects : [],

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

           status: String(status || "ACTIVE").trim(),

photo: req.file
    ? "/uploads/" + req.file.filename
    : "",

feesBalance: String(feesBalance || "0"),
arrivalTime: null,
arrivalDate: null,
lastScan: null,
departureTime: null,

// Daily attendance
attendanceRecords: {},

createdAt: new Date().toISOString()        };


        students.push(student);

        // SAVE STUDENT
        saveStudents();


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

                className: student.className,subjects: student.subjects || [],

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
            attendanceRecords: student.attendanceRecords || {},

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


        /* SERVER TIME */

      const now = new Date();

const arrivalTime = now.toLocaleTimeString("en-UG", {
  timeZone: "Africa/Kampala",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true
});

const arrivalDate = now.toLocaleDateString("en-UG", {
  timeZone: "Africa/Kampala"
});

        const scanTimestamp =
            now.toISOString();


        /* SAVE ARRIVAL */

        student.arrivalTime =
            arrivalTime;

        student.arrivalDate =
            arrivalDate;

        student.lastScan =
            scanTimestamp;

// Mark the student present for today
const today = now.toLocaleDateString("en-CA", {
    timeZone: "Africa/Kampala"
});

if (!student.attendanceRecords) {
    student.attendanceRecords = {};
}

student.attendanceRecords[today] = "Present";
        // SAVE UPDATED ARRIVAL
        saveStudents();


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

/* DAILY ATTENDANCE */
app.post("/api/attendance", (req, res) => {
    try {
        const { studentID, status, date } = req.body;

        if (!studentID || !status) {
            return res.status(400).json({
                success: false,
                message: "Student ID and attendance status are required."
            });
        }

        const student = students.find(
            item =>
                item.id.toLowerCase() ===
                String(studentID).trim().toLowerCase()
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const attendanceDate = date || new Date().toLocaleDateString("en-CA", {
            timeZone: "Africa/Kampala"
        });

        if (!student.attendanceRecords) {
            student.attendanceRecords = {};
        }

        student.attendanceRecords[attendanceDate] = status;

        saveStudents();

        res.json({
            success: true,
            message: "Daily attendance saved successfully.",
            studentID: student.id,
            date: attendanceDate,
            status: status
        });

    } catch (error) {
        console.error("Attendance error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save attendance."
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


photo: student.photo || "",
feesBalance: student.feesBalance || "0",


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
app.post("/api/change-password", (req, res) => {
    const { studentId, currentPassword, newPassword } = req.body;

    if (!studentId || !currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "All password fields are required."
        });
    }

    if (newPassword.length < 4) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 4 characters."
        });
    }

    const student = students.find(
        s => s.id.toLowerCase() === studentId.toLowerCase()
    );

    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found."
        });
    }

    if (student.password !== currentPassword) {
        return res.status(401).json({
            success: false,
            message: "Current password is incorrect."
        });
    }

    student.password = newPassword;

    saveStudents();

    res.json({
        success: true,
        message: "Password changed successfully."
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


    // SAVE AFTER DELETE
    saveStudents();


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