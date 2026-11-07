const express = require("express");
const path = require("path");

const {
    db,
    run,
    get,
    all,
    initializeDatabase
} = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


app.get("/api/students", async (req, res) => {
    try {
        const students = await all(
            "SELECT * FROM students ORDER BY id DESC"
        );

        res.json(students);
    } catch (err) {
        console.error("GET students error:", err.message);

        res.status(500).json({
            message: "Failed to load students."
        });
    }
});


app.post("/api/students", async (req, res) => {
    try {
        const {
            student_id,
            full_name,
            course,
            year_level,
            contact_number,
            email
        } = req.body;

        if (!student_id || !full_name || !course || !year_level) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        const result = await run(
            `INSERT INTO students
            (student_id, full_name, course, year_level, contact_number, email)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                student_id,
                full_name,
                course,
                year_level,
                contact_number || "",
                email || ""
            ]
        );

        const newStudent = await get(
            "SELECT * FROM students WHERE id = ?",
            [result.lastID]
        );

        res.status(201).json({
            message: "Student added successfully!",
            student: newStudent
        });
    } catch (err) {
        console.error("POST student error:", err.message);

        if (err.message.includes("UNIQUE")) {
            return res.status(409).json({
                message: "Student ID already exists."
            });
        }

        res.status(500).json({
            message: "Unable to save student."
        });
    }
});


app.put("/api/students/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            student_id,
            full_name,
            course,
            year_level,
            contact_number,
            email
        } = req.body;

        if (!student_id || !full_name || !course || !year_level) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        const result = await run(
            `UPDATE students
            SET student_id = ?,
                full_name = ?,
                course = ?,
                year_level = ?,
                contact_number = ?,
                email = ?
            WHERE id = ?`,
            [
                student_id,
                full_name,
                course,
                year_level,
                contact_number || "",
                email || "",
                id
            ]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        const updatedStudent = await get(
            "SELECT * FROM students WHERE id = ?",
            [id]
        );

        res.json({
            message: "Student updated successfully!",
            student: updatedStudent
        });
    } catch (err) {
        console.error("PUT student error:", err.message);

        if (err.message.includes("UNIQUE")) {
            return res.status(409).json({
                message: "Student ID already exists."
            });
        }

        res.status(500).json({
            message: "Unable to update student."
        });
    }
});

app.delete("/api/students/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await run(
            "DELETE FROM students WHERE id = ?",
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        res.json({
            message: "Student deleted successfully!"
        });
    } catch (err) {
        console.error("DELETE student error:", err.message);

        res.status(500).json({
            message: "Unable to delete student."
        });
    }
});

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log("Student Management System is running!");
            console.log(`Dashboard: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error(
            "Failed to initialize database:",
            err.message
        );
    });