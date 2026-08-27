const express = require("express");

const app = express();

/*
=====================================================
RENDER PORT
=====================================================
*/

const PORT = process.env.PORT || 5000;


/*
=====================================================
MIDDLEWARE
=====================================================
*/

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));


/*
=====================================================
IN-MEMORY DATA
=====================================================
*/

/*
Student information is stored while the server is running.

IMPORTANT:
For a real production school system, we should later
move this into a database so the data remains after
a server restart.
*/

const students = [];

const studentLocations = {};


/*
=====================================================
HOME / SERVER TEST
=====================================================
*/

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        message: "School QR System server is running.",
        students: students.length
    });

});


/*
=====================================================
STUDENT REGISTRATION
=====================================================
*/

app.post("/api/students", (req, res) => {

    try {

        const {
            name,
            id,
            className,
            parentName,
            parentPhone,
            arrivalTime,
            departureTime,
            medicalInfo,
            password
        } = req.body;


        /*
        CHECK REQUIRED INFORMATION
        */

        if (!name || !id || !className || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Student name, ID, class and password are required."
            });

        }


        /*
        CLEAN DATA
        */

        const studentID =
            String(id).trim();


        const studentName =
            String(name).trim();


        /*
        CHECK DUPLICATE ID
        */

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


        /*
        CREATE STUDENT
        */

        const student = {

            name: studentName,

            id: studentID,

            className:
                String(className).trim(),

            parentName:
                String(parentName || "").trim(),

            parentPhone:
                String(parentPhone || "").trim(),

            arrivalTime:
                String(arrivalTime || "").trim(),

            departureTime:
                String(departureTime || "").trim(),

            medicalInfo:
                String(medicalInfo || "").trim(),

            password:
                String(password),

            createdAt:
                new Date().toISOString()

        };


        /*
        SAVE STUDENT
        */

        students.push(student);


        console.log(
            `Student registered: ${student.id}`
        );


        /*
        DO NOT SEND PASSWORD BACK
        */

        res.status(201).json({

            success: true,

            message:
                "Student saved successfully.",

            student: {

                name: student.name,

                id: student.id,

                className:
                    student.className,

                parentName:
                    student.parentName,

                parentPhone:
                    student.parentPhone,

                arrivalTime:
                    student.arrivalTime,

                departureTime:
                    student.departureTime,

                medicalInfo:
                    student.medicalInfo,

                createdAt:
                    student.createdAt

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


/*
=====================================================
GET ALL STUDENTS
=====================================================
*/

app.get("/api/students", (req, res) => {

    /*
    NEVER SEND PASSWORDS TO THE BROWSER
    */

    const safeStudents =
        students.map(student => ({

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

            arrivalTime:
                student.arrivalTime,

            departureTime:
                student.departureTime,

            medicalInfo:
                student.medicalInfo,

            createdAt:
                student.createdAt

        }));


    res.json({

        success: true,

        students:
            safeStudents

    });

});


/*
=====================================================
GET ONE STUDENT
=====================================================
*/

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


    /*
    PASSWORD IS NOT SENT
    */

    res.json({

        success: true,

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

            arrivalTime:
                student.arrivalTime,

            departureTime:
                student.departureTime,

            medicalInfo:
                student.medicalInfo,

            createdAt:
                student.createdAt

        }

    });

});


/*
=====================================================
STUDENT PASSWORD LOGIN
=====================================================
*/

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


    /*
    CHECK PASSWORD
    */

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


    /*
    LOGIN SUCCESSFUL

    Password is deliberately NOT returned.
    */

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

            arrivalTime:
                student.arrivalTime,

            departureTime:
                student.departureTime,

            medicalInfo:
                student.medicalInfo

        }

    });

});


/*
=====================================================
RECEIVE STUDENT LOCATION
=====================================================
*/

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


    /*
    CHECK THAT STUDENT EXISTS
    */

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


    /*
    SAVE LOCATION
    */

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


/*
=====================================================
GET STUDENT LOCATION
=====================================================
*/

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

        studentID:

            studentID,

        location:

            location

    });

});


/*
=====================================================
DELETE STUDENT
=====================================================
*/

app.delete("/api/students/:studentID", (req, res) => {

    const studentID =
        String(
            req.params.studentID || ""
        ).trim()
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


    /*
    REMOVE LOCATION TOO
    */

    delete studentLocations[
        removedStudent.id
    ];


    res.json({

        success: true,

        message:
            "Student deleted successfully."

    });

});


/*
=====================================================
UNKNOWN API ROUTE
=====================================================
*/

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


/*
=====================================================
START SERVER
=====================================================
*/

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `School Tracking Server running on port ${PORT}`
        );

    }
);