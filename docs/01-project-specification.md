# Gradely — Project specification (Phase 1)

**Product name:** Gradely  
**Tagline:** Stay on track. Stay ahead.  
**Academic title:** Gradely: A Student-Centered Academic Progress Tracking and Guidance System

This document locks *what* we are building and *why*. System analysis is in `02-system-analysis.md`.

---

## 1. One-paragraph description

Gradely is a student-owned academic **application** implemented in C++ (console). On first run the student creates their space (name, student number, institution, program, semester). They then add their own courses, record attendance, track assignments, tests and exams, keep course notes, and use a dashboard that turns that data into activity progress, deadline alerts, and simple rule-based guidance. Data is stored in a **local SQLite database**. Gradely does not connect to any institution’s portal, does not pull records from a registration number, and does not claim to measure academic performance (marks or GPA) in the first version.

A separate HTML/CSS landing page presents Gradely as a product. The website is not the application and does not register users.

---

## 2. Problem

Students already have academic information; it is scattered across school portals, messaging groups, notebooks, timetables, assignment sheets, and memory. That leads to missed classes, forgotten deadlines, unknown attendance risk, and no single picture of what needs attention this week.

**Problem statement:** Students lack a personal, institution-independent system that consolidates semester courses, attendance, tasks, notes, and deadlines, and that interprets that information into timely, understandable guidance.

Gradely does **not** solve institutional result processing, campus-wide timetable generation, or replacement of a lecturer’s LMS.

---

## 3. Target users

**MVP user:** one student on their own computer.

Institution, program, and year are typed by the student. Lecturers, registrars, parents, and class lists are out of scope. There is no multi-user login.

---

## 4. Main objective

Design and implement Gradely as a C++ application: first-run profile setup, student-entered academic data, SQLite persistence, a dashboard with rule-based guidance, and an HTML/CSS landing page that explains how to get started in the app.

---

## 5. Specific objectives

1. On first run, allow a student to create their space (profile and active semester) and later update it.
2. Allow the student to add, view, update, and remove courses for that semester.
3. Record attendance per course, calculate percentage automatically, and warn when it falls below a threshold.
4. Record academic tasks (assignments, tests, exams) with dates, priority, and status; derive overdue from the deadline and today’s date.
5. Store and retrieve course notes (topic, date, content).
6. Generate a dashboard plus rule-based guidance from stored data.
7. Persist all application data in SQLite; accompany the system with a marketing landing page that explains how to start the application.

---

## 6. Core modules

| Module | Role |
| --- | --- |
| Profile | Name, student ID, institution, program, year |
| Semester | Active period; container for academic data |
| Course | Subjects in that semester |
| Attendance | Held / attended / missed; percentage; threshold |
| Task | Assignments, tests, exams (one type field) |
| Note | Course, date, topic, content |
| Dashboard + Guidance | Overview and if/then recommendations |
| Storage | SQLite database (load and save) |
| Menu (UI) | Console navigation — not a domain module |

---

## 7. MVP, Version 2, optional

**MVP:** first-run setup (local registration); profile; one active semester; course CRUD; attendance totals and %; threshold warning; tasks with computed overdue; upcoming deadlines; notes; dashboard; 4–6 guidance rules; SQLite save/load; input validation; HTML/CSS landing page.

**Version 2:** archived semesters; weekly timetable; note keyword search; task sort; text weekly summary; optional CSV import.

**Optional / avoid unless time allows:** grades/GPA; C++ graphs; school-portal sync; Qt/WinForms GUI; cloud accounts; AI advice; auto-generated recurring tasks.

**Progress wording:** dashboard figures are **academic activity progress**, not predicted grades.

---

## 8. Technical decisions (locked unless we reopen them)

| Decision | Choice |
| --- | --- |
| Product name | Gradely |
| Application UI | C++ console |
| Product site | HTML/CSS in `web/` |
| Users | One local student |
| Attendance (MVP) | Running totals per course |
| Tasks | One class, three types |
| Timetable | Not in MVP |
| Grades | Not in MVP |
| Persistence | SQLite database in `data/` (e.g. `gradely.db`) |
| Data entry | Student types it; student number is stored, not used to fetch a portal |
| Dates | `YYYY-MM-DD` plus a small Date helper |
| Overdue | Computed, not stored as a user-picked status |
| Website | Storefront only — no Sign up that creates an account |

---

## 9. C++ architecture (preview)

Layers: `main` → Menu / Dashboard → Guidance → model classes → Storage → SQLite. Only Storage talks to the database. Guidance is a set of `if` rules over current data. First launch with an empty database runs **Create your space**, then the dashboard.

---

## 10. Roadmap

1. Research and requirements (this document)
2. System analysis (`02-system-analysis.md`)
3. System design (class diagram, SQLite tables, menu mock)
4. C++ application, module by module
5. HTML/CSS landing page (storefront + get started)
6. Testing
7. Documentation
8. Presentation
