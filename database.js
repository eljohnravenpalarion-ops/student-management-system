const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

// Use the database file inside the project folder
const dbPath = path.join(__dirname, "students.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database!");
    }
});

// Promise-based database functions
function run(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, values, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

function get(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, values, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function all(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, values, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Create database tables
async function initializeDatabase() {
    try {
        await run(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                course TEXT NOT NULL,
                year_level TEXT NOT NULL,
                contact_number TEXT,
                email TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        // Create default admin if it does not exist
        const admin = await get(
            "SELECT * FROM admins WHERE username = ?",
            ["admin"]
        );

        if (!admin) {
            const hashedPassword = await bcrypt.hash("Admin@123", 10);

            await run(
                "INSERT INTO admins (username, password) VALUES (?, ?)",
                ["admin", hashedPassword]
            );

            console.log("Default admin account created!");
        }

        console.log("Students and admins tables are ready!");
    } catch (err) {
        console.error("Database initialization failed:", err.message);
        throw err;
    }
}

module.exports = {
    db,
    run,
    get,
    all,
    initializeDatabase
};