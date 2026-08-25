# Gradely — System analysis (Phase 2)

This document answers: *who uses the system, what they do, what goes in, what comes out, and what rules apply.* It does not yet specify every C++ class file (that is Phase 3).

---

## 1. System context

Gradely runs on the student’s computer. The only human actor is the **Student**. There is no school database, no internet requirement, and no other software that must be running.

```
                    +------------------+
                    |     Student      |
                    +--------+---------+
                             | types profile, courses,
                             | attendance, tasks, notes
                             v
                    +------------------+
                    |  Gradely (C++)   |
                    |  console + files |
                    +--------+---------+
                             | read / write
                             v
                    +------------------+
                    |  Local files     |
                    |  (data/)         |
                    +------------------+
```

The HTML/CSS landing page is **outside** this context. It is a separate presentation artefact. It does not exchange data with the console app.

---

## 2. Actor

| Actor | Description |
| --- | --- |
| Student | The single owner of the local Gradely data. Sets up a semester, records academic activity, and reads the dashboard and guidance. |

No staff, parent, or administrator actor in MVP.

---

## 3. Assumptions

1. The student is honest when entering attendance and tasks (Gradely does not verify against a school portal).
2. The computer clock is correct enough for “today” and overdue calculations.
3. One active semester is enough for the first demonstration.
4. English text is acceptable for all labels and messages.
5. The student can use a numbered console menu (no mouse GUI in MVP).

---

## 4. Constraints

| Type | Constraint |
| --- | --- |
| Language | Main system in C++ |
| Interface | Console menus |
| Storage | Files, not a database |
| Libraries | Standard C++ only (no extra frameworks) |
| Users | Single local profile |
| Time | Semester project — MVP over a complete unfinished system |
| Honesty | Activity progress must not be labelled as academic performance |

---

## 5. Use case catalogue

| ID | Use case | Priority |
| --- | --- | --- |
| UC01 | Start Gradely and load saved data | MVP |
| UC02 | Create or update student profile | MVP |
| UC03 | Set the active semester | MVP |
| UC04 | Add / list / edit / delete a course | MVP |
| UC05 | Record attendance for a course | MVP |
| UC06 | Add / list / edit / delete a task | MVP |
| UC07 | Mark a task completed (or in progress) | MVP |
| UC08 | Add / list notes (filter by course) | MVP |
| UC09 | View dashboard | MVP |
| UC10 | View guidance / alerts | MVP |
| UC11 | Save data | MVP |
| UC12 | Exit the program | MVP |
| UC13 | Manage a weekly timetable | Version 2 |
| UC14 | Enter grades / view performance | Optional |

UC10 can appear as part of UC09 (dashboard includes alerts). It is listed separately so the guidance rules stay testable.

---

## 6. Use case diagram (MVP)

```
                    (Student)
                        |
        +---------------+---------------+
        |               |               |
   UC02 Profile    UC03 Semester    UC04 Courses
        |               |               |
        +-------+-------+-------+-------+
                |               |
          UC05 Attendance  UC06/UC07 Tasks
                |               |
                +-------+-------+
                        |
                   UC08 Notes
                        |
                   UC09 Dashboard
                   UC10 Guidance
                        |
              UC01 Load / UC11 Save / UC12 Exit
```

---

## 7. Selected use cases (detail)

### UC01 — Start Gradely and load saved data

- **Actor:** Student  
- **Trigger:** Student runs the program.  
- **Main success:** Program starts, Storage loads `data/` files if they exist, dashboard (or a short welcome + dashboard option) is available.  
- **Alternate:** First run — no files. Program uses empty profile/semester and continues. It must not crash.  
- **Failure:** Files exist but are unreadable. Program shows a clear error and either starts empty or exits with a message (Phase 3 will pick one; analysis requirement is: do not crash silently).

### UC04 — Manage a course

- **Trigger:** Student chooses Courses on the menu.  
- **Main success:** Student can add a course (name, optional code), see a numbered list, edit name, or delete (with confirmation).  
- **Validation:** Name must not be empty. Duplicate names in the same semester should be rejected or confirmed (recommend: reject exact duplicate names).  
- **Delete rule:** Deleting a course should also remove or block its tasks and notes (Phase 3: cascade delete after confirm — simpler for a student project than orphan records).

### UC05 — Record attendance

- **Trigger:** Student chooses a course, then records a class as present or absent.  
- **Main success:** Held count increases by 1. Attended increases by 1 only if present. Percentage recalculates. If percentage is below the threshold and held > 0, an alert is eligible.  
- **Validation:** Attended can never exceed held. No negative counts.  
- **Note:** MVP records **totals**, not a full history of each date. The student is still “recording attendance”; we simply store the running numbers.

### UC06 / UC07 — Tasks

- **Trigger:** Student adds or updates a task.  
- **Inputs:** Title, course, type (Assignment / Test / Exam), description (optional), date assigned, deadline, priority (Low / Medium / High), status (Pending / In Progress / Completed).  
- **Rule:** If status is not Completed and deadline < today, the task is **Overdue** on screen. Overdue is not a value the student types.  
- **Completion:** Student sets status to Completed; optional completion date can default to today.

### UC09 — View dashboard

- **Trigger:** Startup (recommended) and/or menu item.  
- **Output (concept):** Welcome name; active semester; activity progress; overall or per-course attendance snapshot; pending count; next deadline; next test/exam; alerts; one recommendation.  
- **Empty state:** If there are no courses yet, the dashboard says so and points the student to add courses — not a wall of zeros presented as “0% success.”

---

## 8. Inputs, processes, outputs (IPO)

| Process | Inputs | Process | Outputs |
| --- | --- | --- | --- |
| Profile | Name, student ID, institution, program, year | Validate non-empty name | Saved profile; name on dashboard |
| Semester | Label, e.g. `2026 - Semester 1` | Store as active container | All lists scoped to this semester |
| Course | Course name | Add to semester list | Course list |
| Attendance | Course, Present or Absent | Increment held; maybe attended; compute % | % display; possible warning |
| Task create | Title, course, type, dates, priority | Store; compute overdue when listing | Task list; upcoming; overdue |
| Task complete | Task choice | Set Completed | Higher activity progress |
| Note | Course, topic, date, content | Store | Notes list filtered by course |
| Dashboard | All stored data + today’s date | Aggregate counts; run guidance rules | Formatted summary |
| Save/Load | Objects in memory | Convert to/from text lines | Files in `data/` |

---

## 9. Functional requirements

| ID | Requirement |
| --- | --- |
| FR01 | The system shall store one student profile (name, student ID, institution, program, year of study). |
| FR02 | The system shall store one active semester label and associate courses, tasks, and notes with it. |
| FR03 | The system shall allow the student to add, view, update, and delete courses. |
| FR04 | The system shall record attendance as present or absent and keep held and attended totals per course. |
| FR05 | The system shall calculate attendance percentage as attended / held × 100 when held > 0. |
| FR06 | The system shall compare attendance percentage to a configurable threshold (default 80%) and produce a warning when below threshold. |
| FR07 | The system shall allow tasks of type Assignment, Test, or Exam with title, course, description, assigned date, deadline, priority, and status. |
| FR08 | The system shall treat a non-completed task as overdue when its deadline is before today’s date. |
| FR09 | The system shall list upcoming tasks whose deadline is within a configurable window (default 7 days) and not completed. |
| FR10 | The system shall allow notes with course, date, topic, and content, and listing (all or by course). |
| FR11 | The system shall display a dashboard summarising semester, activity progress, attendance, pending tasks, upcoming deadline, upcoming test/exam, and alerts. |
| FR12 | The system shall generate guidance messages from rules (attendance, urgent deadlines, pending workload, nearby exams). |
| FR13 | The system shall save data to files and load them on the next start. |
| FR14 | The system shall validate inputs (empty names, invalid dates, attended > held). |
| FR15 | Activity progress shall be calculated from task completion (completed tasks / total tasks) and clearly labelled as activity, not performance. |

---

## 10. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR01 | Source should compile as standard C++ (target C++17) without third-party libraries. |
| NFR02 | First-run with empty `data/` shall not crash. |
| NFR03 | Menu labels shall be plain language a student can follow without a manual. |
| NFR04 | Save format shall be inspectable in a text editor (CSV or simple text) for demonstration and defence. |
| NFR05 | Guidance shall be explainable: each message maps to a named rule. |
| NFR06 | The landing page shall be usable on a typical laptop browser width and a narrower phone-width layout (responsive CSS). |

---

## 11. Business / guidance rules (MVP)

Keep the set small so the dashboard stays readable.

| Rule | Condition | Message intent |
| --- | --- | --- |
| R1 Attendance | Course held ≥ 1 and % < threshold | Prioritise that course’s classes |
| R2 Urgent task | Not completed and deadline is today or within 2 days | Urgent reminder |
| R3 Overdue | Not completed and deadline < today | Overdue reminder |
| R4 Workload | Pending + in progress count > 5 (threshold later configurable) | Suggest a study schedule / order by priority |
| R5 Exams approaching | A task of type Exam within 14 days, not completed | Prioritise revision |
| R6 Empty setup | No courses | Prompt to add courses (helpful, not alarming) |

If several rules fire, show a short list (for example up to 5 lines), not a paragraph essay.

---

## 12. Activity progress (formula)

**Academic activity progress (semester):**

`progress = completed_tasks / total_tasks × 100`  
If `total_tasks == 0`, show “No tasks yet” instead of 0% or 100%.

**Attendance** is a **separate** figure per course and optionally an average of course percentages (only courses with held > 0). Do not blend attendance and tasks into one mystery percentage in MVP.

**Not measured:** marks, GPA, “how well you understand the topic.”

---

## 13. Data needed (logical, not file columns yet)

| Entity | Fields |
| --- | --- |
| Profile | name, studentId, institution, program, year |
| Settings | attendanceThreshold (default 80), urgentDays (default 2), upcomingDays (default 7), workloadLimit (default 5), examHorizonDays (default 14) |
| Semester | label (e.g. 2026 - Semester 1) |
| Course | id, name, classesHeld, classesAttended |
| Task | id, courseId, title, type, description, dateAssigned, deadline, priority, status, completionDate (optional) |
| Note | id, courseId, date, topic, content |

Missed classes = held − attended (derived, not stored twice).

---

## 14. Console menu map (UI structure)

This is the navigation the student will actually use. Exact wording can be polished in implementation.

```
GRADELY MAIN MENU
  1. Dashboard
  2. My profile
  3. Semester
  4. Courses
  5. Attendance
  6. Tasks
  7. Notes
  8. Save
  9. Exit
```

**Courses submenu:** List / Add / Edit / Delete / Back  
**Attendance submenu:** Choose course → Record present / Record absent / View summary / Back  
**Tasks submenu:** List / Add / Edit / Update status / Delete / Upcoming / Back  
**Notes submenu:** List all / List by course / Add / Delete / Back  

On start: load files, then show **Dashboard**, then the main menu (so the demo opens on the “product” screen).

---

## 15. Processes (high-level flowchart)

```
Start
  -> Load files (or empty state)
  -> Show dashboard
  -> Loop: show main menu
       -> Profile / Semester / Courses / Attendance / Tasks / Notes
       -> After a change: consider auto-save (recommended) or remind to Save
       -> Dashboard can be reopened anytime
  -> Exit: save if unsaved, then quit
```

**Recommended for MVP:** save automatically after successful add/edit/delete so a forgotten “Save” does not ruin the demo. Keep menu item Save as “Save now” for the viva. Phase 3 will confirm this.

---

## 16. Outputs the student sees

| Output | Where |
| --- | --- |
| Profile confirmation | Profile screen |
| Course list | Courses |
| Attendance % and missed count | Attendance and dashboard |
| Task list with derived overdue | Tasks |
| Upcoming deadlines | Tasks and dashboard |
| Notes | Notes |
| Alerts and one-line recommendations | Dashboard |
| Save confirmation | After save |

---

## 17. What analysis deliberately leaves to Phase 3

- Exact CSV column order and file names  
- C++ class diagram and `.h` / `.cpp` split  
- How IDs are generated (integer sequence is enough)  
- Screen-by-screen text mock of the dashboard  
- Test cases (Phase 6, with a first list started after design)

---

## 18. Phase 2 complete when

You can explain to a lecturer, without code:

1. Who the user is  
2. The MVP use cases  
3. How attendance % and overdue are calculated  
4. Why progress is “activity” not “performance”  
5. How the console is organised  
6. That the landing page is a separate HTML/CSS product site  

Next: **Phase 3 — System design** (architecture, class diagram, file formats, dashboard text mock).
