const express = require("express");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(express.static(__dirname));

/*
=====================================================
IN-MEMORY DATA
=====================================================
For now, students are stored while the server is running.
Later we can move this to a permanent database.
*/

const students = {};

const studentLocations = {};


/*
=====================================================
HOME
=====================================================
*/

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        message: "School QR System server is running.",
        students: Object.keys(students).length
    });

});


/*
=====================================================
ADD STUDENT
=====================================================
*/

app.post("/api/students", (req, res) => {

    const {
        name,
        id,
        studentClass,
        parentName,
        parentPhone,
        arrivalTime,
        departureTime,
        medicalInfo,
        password,
        tracking
    } = req.body;


    if (!name || !id || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Student name, student ID and password are required."

        });

    }


    const studentID =
        String(id).trim().toUpperCase();


    if (students[studentID]) {

        return res.status(409).json({

            success: false,

            message:
                "A student with this ID already exists."

        });

    }


    students[studentID] = {

        name: String(name).trim(),

        id: studentID,

        studentClass:
            studentClass || "",

        parentName:
            parentName || "",

        parentPhone:
            parentPhone || "",

        arrivalTime:
            arrivalTime || "",

        departureTime:
            departureTime || "",

        medicalInfo:
            medicalInfo || "",

        password:
            String(password),

        tracking:
            tracking || "enabled",

        createdAt:
            new Date().toISOString()

    };


    res.json({

        success: true,

        message:
            "Student created successfully.",

        student: {

            name:
                students[studentID].name,

            id:
                students[studentID].id,

            studentClass:
                students[studentID].studentClass

        }

    });

});


/*
=====================================================
GET STUDENT
=====================================================
*/

app.get(
    "/api/students/:studentID",
    (req, res) => {

        const studentID =
            req.params.studentID
                .trim()
                .toUpperCase();


        const student =
            students[studentID];


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        /*
        NEVER send the password
        when simply requesting student data.
        */

        res.json({

            success: true,

            student: {

                name:
                    student.name,

                id:
                    student.id,

                studentClass:
                    student.studentClass,

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

                tracking:
                    student.tracking,

                createdAt:
                    student.createdAt

            }

        });

    }
);


/*
=====================================================
PASSWORD VERIFICATION
=====================================================
*/

app.post(
    "/api/students/:studentID/login",
    (req, res) => {

        const studentID =
            req.params.studentID
                .trim()
                .toUpperCase();


        const password =
            req.body.password;


        const student =
            students[studentID];


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        if (
            typeof password !== "string" ||
            password !== student.password
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Incorrect password."

            });

        }


        /*
        Password is correct.
        Now return the student's information.
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

                studentClass:
                    student.studentClass,

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

                tracking:
                    student.tracking

            }

        });

    }
);


/*
=====================================================
UPDATE STUDENT
=====================================================
*/

app.put(
    "/api/students/:studentID",
    (req, res) => {

        const oldID =
            req.params.studentID
                .trim()
                .toUpperCase();


        const student =
            students[oldID];


        if (!student) {

            return res.status(404).