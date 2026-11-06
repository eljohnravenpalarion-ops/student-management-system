const API = "/api";

let allStudents = [];

const studentForm = document.getElementById("studentForm");
const tableBody = document.getElementById("studentTableBody");
const formContainer = document.getElementById("studentFormContainer");

const totalStudentsElement = document.getElementById("totalStudents");
const totalCoursesElement = document.getElementById("totalCourses");
const totalYearsElement = document.getElementById("totalYears");
const studentCountElement = document.getElementById("studentCount");

const searchInput = document.getElementById("searchInput");
const filterCourse = document.getElementById("filterCourse");
const filterYear = document.getElementById("filterYear");

const recordIdInput = document.getElementById("recordId");
const studentIdInput = document.getElementById("studentId");
const fullNameInput = document.getElementById("fullName");
const courseInput = document.getElementById("course");
const yearLevelInput = document.getElementById("yearLevel");
const contactNumberInput = document.getElementById("contactNumber");
const emailInput = document.getElementById("email");

const formTitle = document.getElementById("formTitle");
const studentMessage = document.getElementById("studentMessage");
const saveStudentBtn = document.getElementById("saveStudentBtn");

// ========================================
// LOAD STUDENTS
// ========================================

async function loadStudents() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="table-message">Loading students...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${API}/students`);

        if (!response.ok) {
            throw new Error("Unable to load students.");
        }

        const data = await response.json();

        // Supports APIs returning either an array or { students: [] }
        allStudents = Array.isArray(data)
            ? data
            : Array.isArray(data.students)
                ? data.students
                : [];

        updateDashboardStats();
        displayStudents();
    } catch (error) {
        console.error("Load students error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-message">
                    Unable to load students. Please check your server.
                </td>
            </tr>
        `;
    }
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

function updateDashboardStats() {
    const courses = new Set(
        allStudents
            .map(student => student.course)
            .filter(Boolean)
    );

    const years = new Set(
        allStudents
            .map(student => student.year_level)
            .filter(Boolean)
    );

    totalStudentsElement.textContent = allStudents.length;
    totalCoursesElement.textContent = courses.size;
    totalYearsElement.textContent = years.size;
}

// ========================================
// DISPLAY STUDENTS
// ========================================

function displayStudents() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCourse = filterCourse.value;
    const selectedYear = filterYear.value;

    const filteredStudents = allStudents.filter(student => {
        const studentId = String(student.student_id || "").toLowerCase();
        const fullName = String(student.full_name || "").toLowerCase();
        const course = String(student.course || "");
        const yearLevel = String(student.year_level || "");

        const matchesSearch =
            studentId.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            String(student.email || "").toLowerCase().includes(searchTerm);

        const matchesCourse =
            !selectedCourse || course === selectedCourse;

        const matchesYear =
            !selectedYear || yearLevel === selectedYear;

        return matchesSearch && matchesCourse && matchesYear;
    });

    studentCountElement.textContent =
        `Showing ${filteredStudents.length} of ${allStudents.length} students`;

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-message">
                    No student records found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>${escapeHTML(student.student_id || "—")}</td>
            <td><strong>${escapeHTML(student.full_name || "—")}</strong></td>
            <td>
                <span class="course-badge">
                    ${escapeHTML(student.course || "—")}
                </span>
            </td>
            <td>${escapeHTML(student.year_level || "—")}</td>
            <td>${escapeHTML(student.contact_number || "—")}</td>
            <td>${escapeHTML(student.email || "—")}</td>
            <td>
                <div class="action-buttons">
                    <button
                        class="action-btn edit"
                        type="button"
                        title="Edit student"
                        onclick="editStudent(${Number(student.id)})">
                        <i data-lucide="pencil"></i>
                    </button>

                    <button
                        class="action-btn delete"
                        type="button"
                        title="Delete student"
                        onclick="deleteStudent(${Number(student.id)})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ========================================
// OPEN / CLOSE FORM
// ========================================

function openStudentForm() {
    formContainer.hidden = false;
    formContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function closeStudentForm() {
    studentForm.reset();
    recordIdInput.value = "";
    formContainer.hidden = true;
    formTitle.textContent = "Add New Student";
    saveStudentBtn.textContent = "Save Student";
    studentMessage.textContent = "";
}

// ========================================
// ADD / UPDATE STUDENT
// ========================================

studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = recordIdInput.value;

    const student = {
        student_id: studentIdInput.value.trim(),
        full_name: fullNameInput.value.trim(),
        course: courseInput.value,
        year_level: yearLevelInput.value,
        contact_number: contactNumberInput.value.trim(),
        email: emailInput.value.trim()
    };

    if (
        !student.student_id ||
        !student.full_name ||
        !student.course ||
        !student.year_level
    ) {
        studentMessage.textContent =
            "Please fill in Student ID, Full Name, Course, and Year Level.";
        return;
    }

    const url = id
        ? `${API}/students/${encodeURIComponent(id)}`
        : `${API}/students`;

    const method = id ? "PUT" : "POST";

    saveStudentBtn.disabled = true;
    saveStudentBtn.textContent = "Saving...";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(student)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || result.error || "Unable to save student."
            );
        }

        alert(id
            ? "Student updated successfully!"
            : "Student added successfully!"
        );

        closeStudentForm();
        await loadStudents();
    } catch (error) {
        console.error("Save student error:", error);

        studentMessage.textContent =
            error.message || "Unable to save student.";
    } finally {
        saveStudentBtn.disabled = false;
        saveStudentBtn.textContent = recordIdInput.value
            ? "Update Student"
            : "Save Student";
    }
});

// ========================================
// EDIT STUDENT
// ========================================

function editStudent(id) {
    const student = allStudents.find(
        item => String(item.id) === String(id)
    );

    if (!student) {
        alert("Student record not found.");
        return;
    }

    recordIdInput.value = student.id;
    studentIdInput.value = student.student_id || "";
    fullNameInput.value = student.full_name || "";
    courseInput.value = student.course || "";
    yearLevelInput.value = student.year_level || "";
    contactNumberInput.value = student.contact_number || "";
    emailInput.value = student.email || "";

    formTitle.textContent = "Edit Student";
    saveStudentBtn.textContent = "Update Student";
    studentMessage.textContent = "";

    openStudentForm();
}

// ========================================
// DELETE STUDENT
// ========================================

async function deleteStudent(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API}/students/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || result.error || "Unable to delete student."
            );
        }

        alert("Student deleted successfully!");
        await loadStudents();
    } catch (error) {
        console.error("Delete student error:", error);
        alert(error.message || "Unable to delete student.");
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

document.getElementById("showFormBtn").addEventListener("click", function () {
    studentForm.reset();
    recordIdInput.value = "";
    formTitle.textContent = "Add New Student";
    saveStudentBtn.textContent = "Save Student";
    studentMessage.textContent = "";

    openStudentForm();
});

document.getElementById("cancelFormBtn").addEventListener("click", closeStudentForm);

document.getElementById("cancelFormBtnBottom").addEventListener("click", closeStudentForm);

searchInput.addEventListener("input", displayStudents);
filterCourse.addEventListener("change", displayStudents);
filterYear.addEventListener("change", displayStudents);

// ========================================
// INITIALIZE
// ========================================

if (window.lucide) {
    lucide.createIcons();
}

loadStudents();