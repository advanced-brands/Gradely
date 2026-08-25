# Gradely — Project specification (Phase 1)

**Product name:** Gradely  
**Tagline:** Stay on track. Stay ahead.  
**Academic title:** Gradely: A Student-Centered Academic Progress Tracking and Guidance System

This document locks *what* we are building and *why*. System analysis is in `02-system-analysis.md`.

---

## 1. One-paragraph description

Gradely is a student-owned academic companion implemented as a C++ console application with file storage. A learner sets up a semester, adds their own courses, records attendance, tracks assignments, tests and exams, keeps course notes, and uses a dashboard that turns that data into activity progress, deadline alerts, and simple rule-based guidance. Gradely does not connect to any institution’s portal, does not manage fees or registration, and does not claim to measure academic performance (marks or GPA) in the first version.

A separate HTML/CSS landing page presents Gradely as a product. The website is not the application; it does not run the C++ system.

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

Design and implement a student-centered academic tracking and guidance system in C++ that stores semester activity in files, presents a clear dashboard, and uses rule-based logic (not AI) to warn about attendance risk, upcoming or overdue work, and workload; and present the product with an HTML/CSS landing page suitable for academic assessment.

---

## 5. Specific objectives

1. Allow a student to create and update a personal academic profile and one active semester.
2. Allow the student to add, view, update, and remove courses for that semester.
3. Record attendance per course, calculate percentage automatically, and warn when it falls below a threshold.
4. Record academic tasks (assignments, tests, exams) with dates, priority, and status; derive overdue from the deadline and today’s date.
5. Store and retrieve course notes (topic, date, content).
6. Generate a dashboard plus rule-based guidance from stored data.
7. Persist data with file handling; accompany the system with a marketing landing page and assessment documentation.

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
| Storage | Load and save files |
| Menu (UI) | Console navigation — not a domain module |

---

## 7. MVP, Version 2, optional

**MVP:** profile; one active semester; course CRUD; attendance totals and %; threshold warning; tasks with computed overdue; upcoming deadlines; notes; dashboard; 4–6 guidance rules; save/load; input validation; HTML/CSS landing page.

**Version 2:** archived semesters; weekly timetable; note keyword search; task sort; text weekly summary.

**Optional / avoid unless time allows:** grades/GPA; C++ graphs; JSON parser or SQLite; Qt/WinForms GUI; cloud accounts; AI advice; auto-generated recurring tasks.

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
| Persistence | Text/CSV files in `data/` |
| Dates | `YYYY-MM-DD` plus a small Date helper |
| Overdue | Computed, not stored as a user-picked status |

---

## 9. C++ architecture (preview)

Layers: `main` → Menu / Dashboard → Guidance → model classes → Storage → files. Only Storage reads and writes disk. Guidance is a set of `if` rules over current data.

---

## 10. Roadmap

1. Research and requirements (this document)
2. System analysis (`02-system-analysis.md`)
3. System design (class diagram, file columns, menu mock)
4. C++ development, module by module
5. HTML/CSS landing page
6. Testing
7. Documentation
8. Presentation
