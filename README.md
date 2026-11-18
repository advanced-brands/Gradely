# Gradely

**Stay on track. Stay ahead.**

Gradely is a personal academic companion for one student. The original C++ console application remains in `src/`. A separate beginner-friendly browser prototype is in `web/`.

The C++ application stores data in a local SQLite database. The browser app uses plain HTML, CSS, and JavaScript with Supabase Auth and Postgres. The two apps do not share data. Neither app connects to a school portal or retrieves records using a student number.

**Academic title:** Gradely: A Student-Centered Academic Progress Tracking and Guidance System

## Repository layout

| Folder | Purpose |
| --- | --- |
| `docs/` | Specification, analysis, and later design/testing notes |
| `src/` | C++ application source |
| `data/` | SQLite database at runtime (`gradely.db`) |
| `web/` | Browser app prototype (HTML/CSS/JavaScript) |
| `supabase/` | Supabase database schema and row-level security |

## Current status

- Phase 1 — Project specification: complete
- Phase 2 — System analysis: complete
- Phase 3 — System design: complete (`docs/03-system-design.md`)
- Phase 4 — C++ Build A started: first-run, profile, semester, SQLite, dashboard stub
- Browser app — Supabase sign-in, dashboard, courses, attendance, tasks, and notes

Build the application from the project root with `compile.bat` (needs `g++`) or see `src/README.md`.

## Scope (MVP)

First-run setup, profile, one active semester, courses, attendance, tasks, notes, dashboard, rule-based guidance, SQLite.

Out of the C++ MVP: school-portal sync, cloud signup, weekly timetable, grades/GPA, GUI toolkit. The separate browser app uses Supabase accounts and is documented in `web/README.md`.
