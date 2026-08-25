# Gradely

**Stay on track. Stay ahead.**

Gradely is a **C++ application**: a personal academic companion for one student on their computer — not a school portal and not this website.

On first run the student **creates their space** (name, student number, institution, program, semester). They type their own courses, attendance, tasks, and notes. Data is stored in a **local SQLite database**. The HTML/CSS landing page is the product storefront only.

**Academic title:** Gradely: A Student-Centered Academic Progress Tracking and Guidance System

## Repository layout

| Folder | Purpose |
| --- | --- |
| `docs/` | Specification, analysis, and later design/testing notes |
| `src/` | C++ application source |
| `data/` | SQLite database at runtime (`gradely.db`) |
| `web/` | Landing page (HTML/CSS) |

## Current status

- Phase 1 — Project specification: complete
- Phase 2 — System analysis: complete
- Phase 3 — System design: complete (`docs/03-system-design.md`)
- Phase 4 — C++ Build A started: first-run, profile, semester, SQLite, dashboard stub

Build the application from the project root with `compile.bat` (needs `g++`) or see `src/README.md`.

## Scope (MVP)

First-run setup, profile, one active semester, courses, attendance, tasks, notes, dashboard, rule-based guidance, SQLite.

Out of MVP: school-portal sync, cloud signup, weekly timetable, grades/GPA, GUI toolkit.
