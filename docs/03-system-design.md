# Gradely — System design (Phase 3)

This document is the blueprint for the C++ application. It does not replace the specification; it says *how* we will build what we already locked.

---

## 1. What we are building today vs later

**Today (Build A):** the application starts, the student creates their space, a dashboard stub appears, the main menu loops, and the profile is saved so a second run skips setup.

**Not today:** courses, attendance, tasks, notes, guidance rules. Those modules plug into this skeleton.

---

## 2. Architecture

```
main.cpp
   starts Storage
   if no profile -> Create your space
   show Dashboard
   menu loop until Exit

Menu / Dashboard / CreateYourSpace     <- UI only (cin / cout)
        |
        v
Profile, Semester, (later Course, Task, Note, Date, Guidance)
        |
        v
Storage                                <- only place that uses SQLite
        |
        v
data/gradely.db
```

**Rule:** UI never writes SQL. Models never open files. Storage never prints menus.

---

## 3. Classes (MVP)

| Class | Responsibility |
| --- | --- |
| `Date` | Year, month, day. Parse `YYYY-MM-DD`. Compare. “Today” from the system clock. |
| `Profile` | name, studentNumber, institution, program, yearOfStudy |
| `Semester` | label (e.g. `2026 - Semester 1`) |
| `Course` | id, name, classesHeld, classesAttended |
| `Task` | id, courseId, title, type, description, dates, priority, status, completionDate |
| `Note` | id, courseId, date, topic, content |
| `Settings` | attendanceThreshold, urgentDays, upcomingDays, workloadLimit, examHorizonDays |
| `Guidance` | Takes current data, returns a list of message strings (rules R1–R6) |
| `Storage` | Open DB, create tables, load/save all of the above |
| `App` (in `main` for now) | Orchestrates start, menu, first-run |

Enums (inside Task or a small header):

- Type: Assignment, Test, Exam  
- Priority: Low, Medium, High  
- Status: Pending, InProgress, Completed  
- Overdue is **not** an enum value; `Task::isOverdue(Date today)` computes it.

---

## 4. Class relationships

```
Storage  ---- loads/saves ---->  Profile (1)
                           ---->  Settings (1)
                           ---->  Semester (1 active)
                           ---->  Course (many)
                           ---->  Task (many, each has courseId)
                           ---->  Note (many, each has courseId)

Semester does not “own” courses in C++ pointers for MVP.
We keep vectors in memory after load: vector<Course>, vector<Task>, vector<Note>.
That is easier to understand than a tree of new/delete.
```

---

## 5. SQLite schema

File: `data/gradely.db`

```sql
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  institution TEXT NOT NULL,
  program TEXT NOT NULL,
  year_of_study TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  attendance_threshold REAL NOT NULL DEFAULT 80,
  urgent_days INTEGER NOT NULL DEFAULT 2,
  upcoming_days INTEGER NOT NULL DEFAULT 7,
  workload_limit INTEGER NOT NULL DEFAULT 5,
  exam_horizon_days INTEGER NOT NULL DEFAULT 14
);

CREATE TABLE IF NOT EXISTS semester (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  classes_held INTEGER NOT NULL DEFAULT 0,
  classes_attended INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date_assigned TEXT NOT NULL,
  deadline TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  completion_date TEXT,
  FOREIGN KEY (course_id) REFERENCES course(id)
);

CREATE TABLE IF NOT EXISTS note (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  note_date TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES course(id)
);
```

Dates are stored as text `YYYY-MM-DD`. Type/priority/status are stored as text matching the enums.

---

## 6. First-run screen (Create your space)

```
========================================
  GRADELY
  Stay on track. Stay ahead.
========================================

  Create your space
  (This is stored on this computer only.
   Your student number is not used to
   download records from a school.)

  Full name: _
  Student number: _
  Institution: _
  Program: _
  Year of study: _
  Semester label (e.g. 2026 - Semester 1): _
```

All fields required (non-empty after trim). Then save to SQLite and continue.

---

## 7. Dashboard text mock (Build A)

Until other modules exist, missing numbers are honest empty states.

```
----------------------------------------
  Welcome, Elizabeth
  2026 - Semester 1
----------------------------------------
  Activity progress:  No tasks yet
  Attendance:         No classes recorded
  Pending tasks:      0
  Upcoming deadline:  None
  Upcoming test/exam: None

  Guidance
  - Add your courses to start tracking this semester.
----------------------------------------
```

---

## 8. Main menu (Build A)

```
  1. Dashboard
  2. My profile
  3. Semester
  4. Courses          (message: coming next)
  5. Attendance       (message: coming next)
  6. Tasks            (message: coming next)
  7. Notes            (message: coming next)
  8. Save
  9. Exit
```

Profile and Semester can be viewed/edited in Build A. Courses+ wait for Build B.

Save writes current profile/semester/settings. After a successful edit we also save immediately.

---

## 9. Source files (planned)

| File | Build |
| --- | --- |
| `src/Utils.h` `.cpp` | A — read line, require non-empty, pause |
| `src/Date.h` `.cpp` | A — today + parse (used fully from tasks onward) |
| `src/Profile.h` `.cpp` | A |
| `src/Semester.h` `.cpp` | A |
| `src/Settings.h` `.cpp` | A |
| `src/Storage.h` `.cpp` | A — profile, semester, settings |
| `vendor/sqlite/sqlite3.c` `.h` | A — SQLite amalgamation |
| `src/main.cpp` | A — first-run, dashboard stub, menu |
| `src/Course.h` `.cpp` | B |
| `src/Task.h` `.cpp` | C |
| `src/Note.h` `.cpp` | D |
| `src/Guidance.h` `.cpp` | E |

---

## 10. Concepts used in Build A (plain language)

**Class:** a blueprint. `Profile` describes what a student’s identity contains. An **object** is one actual profile in memory.

**Encapsulation:** name and student number are private; we change them through functions (`setName`) so we can reject empty strings in one place.

**SQLite:** a small database in one file. We send it SQL (`INSERT`, `SELECT`). We vendor SQLite’s amalgamation (two files we compile with our program) so we do not depend on a server.

**First-run:** if `SELECT` on `profile` returns no row, we have never registered on this computer.

---

## 11. Build A done when

1. The program compiles.  
2. First run asks Create your space and does not continue with blanks.  
3. Second run greets the student by name and skips setup.  
4. Profile and semester can be edited from the menu.  
5. `data/gradely.db` exists after first save.
