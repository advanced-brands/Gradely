#include "Storage.h"

#include "../vendor/sqlite/sqlite3.h"

#include <filesystem>

Storage::Storage() : db_(nullptr) {}

Storage::~Storage() { close(); }

bool Storage::open(const std::string& path) {
    close();

    const std::filesystem::path file(path);
    std::error_code ec;
    std::filesystem::create_directories(file.parent_path(), ec);

    if (sqlite3_open(path.c_str(), &db_) != SQLITE_OK) {
        lastError_ = sqlite3_errmsg(db_);
        close();
        return false;
    }
    if (!exec("PRAGMA foreign_keys = ON;")) {
        return false;
    }
    return createTables();
}

void Storage::close() {
    if (db_ != nullptr) {
        sqlite3_close(db_);
        db_ = nullptr;
    }
}

bool Storage::exec(const char* sql) {
    char* error = nullptr;
    if (sqlite3_exec(db_, sql, nullptr, nullptr, &error) != SQLITE_OK) {
        lastError_ = error ? error : "SQLite error";
        sqlite3_free(error);
        return false;
    }
    return true;
}

bool Storage::createTables() {
    const char* sql =
        "CREATE TABLE IF NOT EXISTS profile ("
        "  id INTEGER PRIMARY KEY CHECK (id = 1),"
        "  name TEXT NOT NULL,"
        "  student_number TEXT NOT NULL,"
        "  institution TEXT NOT NULL,"
        "  program TEXT NOT NULL,"
        "  year_of_study TEXT NOT NULL"
        ");"
        "CREATE TABLE IF NOT EXISTS settings ("
        "  id INTEGER PRIMARY KEY CHECK (id = 1),"
        "  attendance_threshold REAL NOT NULL DEFAULT 80,"
        "  urgent_days INTEGER NOT NULL DEFAULT 2,"
        "  upcoming_days INTEGER NOT NULL DEFAULT 7,"
        "  workload_limit INTEGER NOT NULL DEFAULT 5,"
        "  exam_horizon_days INTEGER NOT NULL DEFAULT 14"
        ");"
        "CREATE TABLE IF NOT EXISTS semester ("
        "  id INTEGER PRIMARY KEY CHECK (id = 1),"
        "  label TEXT NOT NULL"
        ");"
        "CREATE TABLE IF NOT EXISTS course ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  name TEXT NOT NULL UNIQUE,"
        "  classes_held INTEGER NOT NULL DEFAULT 0,"
        "  classes_attended INTEGER NOT NULL DEFAULT 0"
        ");"
        "CREATE TABLE IF NOT EXISTS task ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  course_id INTEGER NOT NULL,"
        "  title TEXT NOT NULL,"
        "  type TEXT NOT NULL,"
        "  description TEXT,"
        "  date_assigned TEXT NOT NULL,"
        "  deadline TEXT NOT NULL,"
        "  priority TEXT NOT NULL,"
        "  status TEXT NOT NULL,"
        "  completion_date TEXT,"
        "  FOREIGN KEY (course_id) REFERENCES course(id)"
        ");"
        "CREATE TABLE IF NOT EXISTS note ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  course_id INTEGER NOT NULL,"
        "  note_date TEXT NOT NULL,"
        "  topic TEXT NOT NULL,"
        "  content TEXT NOT NULL,"
        "  FOREIGN KEY (course_id) REFERENCES course(id)"
        ");";
    return exec(sql);
}

bool Storage::hasProfile() const {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT COUNT(*) FROM profile WHERE id = 1;", -1, &stmt, nullptr)
        != SQLITE_OK) {
        return false;
    }
    int count = 0;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        count = sqlite3_column_int(stmt, 0);
    }
    sqlite3_finalize(stmt);
    return count > 0;
}

bool Storage::loadProfile(Profile& profile) const {
    sqlite3_stmt* stmt = nullptr;
    const char* sql =
        "SELECT name, student_number, institution, program, year_of_study "
        "FROM profile WHERE id = 1;";
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }
    const bool found = sqlite3_step(stmt) == SQLITE_ROW;
    if (found) {
        auto text = [](sqlite3_stmt* s, int col) {
            const unsigned char* value = sqlite3_column_text(s, col);
            return value ? reinterpret_cast<const char*>(value) : "";
        };
        profile.setName(text(stmt, 0));
        profile.setStudentNumber(text(stmt, 1));
        profile.setInstitution(text(stmt, 2));
        profile.setProgram(text(stmt, 3));
        profile.setYearOfStudy(text(stmt, 4));
    }
    sqlite3_finalize(stmt);
    return found;
}

bool Storage::saveProfile(const Profile& profile) {
    const char* sql =
        "INSERT INTO profile (id, name, student_number, institution, program, year_of_study) "
        "VALUES (1, ?, ?, ?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET "
        "name=excluded.name, student_number=excluded.student_number, "
        "institution=excluded.institution, program=excluded.program, "
        "year_of_study=excluded.year_of_study;";
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        lastError_ = sqlite3_errmsg(db_);
        return false;
    }
    sqlite3_bind_text(stmt, 1, profile.name().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, profile.studentNumber().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, profile.institution().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, profile.program().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, profile.yearOfStudy().c_str(), -1, SQLITE_TRANSIENT);
    const bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (!ok) {
        lastError_ = sqlite3_errmsg(db_);
    }
    sqlite3_finalize(stmt);
    return ok;
}

bool Storage::loadSemester(Semester& semester) const {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT label FROM semester WHERE id = 1;", -1, &stmt, nullptr)
        != SQLITE_OK) {
        return false;
    }
    const bool found = sqlite3_step(stmt) == SQLITE_ROW;
    if (found) {
        const unsigned char* value = sqlite3_column_text(stmt, 0);
        semester.setLabel(value ? reinterpret_cast<const char*>(value) : "");
    }
    sqlite3_finalize(stmt);
    return found;
}

bool Storage::saveSemester(const Semester& semester) {
    const char* sql =
        "INSERT INTO semester (id, label) VALUES (1, ?) "
        "ON CONFLICT(id) DO UPDATE SET label=excluded.label;";
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        lastError_ = sqlite3_errmsg(db_);
        return false;
    }
    sqlite3_bind_text(stmt, 1, semester.label().c_str(), -1, SQLITE_TRANSIENT);
    const bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (!ok) {
        lastError_ = sqlite3_errmsg(db_);
    }
    sqlite3_finalize(stmt);
    return ok;
}

bool Storage::loadSettings(Settings& settings) const {
    sqlite3_stmt* stmt = nullptr;
    const char* sql =
        "SELECT attendance_threshold, urgent_days, upcoming_days, workload_limit, exam_horizon_days "
        "FROM settings WHERE id = 1;";
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }
    const bool found = sqlite3_step(stmt) == SQLITE_ROW;
    if (found) {
        settings.setAttendanceThreshold(sqlite3_column_double(stmt, 0));
        settings.setUrgentDays(sqlite3_column_int(stmt, 1));
        settings.setUpcomingDays(sqlite3_column_int(stmt, 2));
        settings.setWorkloadLimit(sqlite3_column_int(stmt, 3));
        settings.setExamHorizonDays(sqlite3_column_int(stmt, 4));
    }
    sqlite3_finalize(stmt);
    return found;
}

bool Storage::saveSettings(const Settings& settings) {
    const char* sql =
        "INSERT INTO settings (id, attendance_threshold, urgent_days, upcoming_days, "
        "workload_limit, exam_horizon_days) VALUES (1, ?, ?, ?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET "
        "attendance_threshold=excluded.attendance_threshold, "
        "urgent_days=excluded.urgent_days, upcoming_days=excluded.upcoming_days, "
        "workload_limit=excluded.workload_limit, exam_horizon_days=excluded.exam_horizon_days;";
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        lastError_ = sqlite3_errmsg(db_);
        return false;
    }
    sqlite3_bind_double(stmt, 1, settings.attendanceThreshold());
    sqlite3_bind_int(stmt, 2, settings.urgentDays());
    sqlite3_bind_int(stmt, 3, settings.upcomingDays());
    sqlite3_bind_int(stmt, 4, settings.workloadLimit());
    sqlite3_bind_int(stmt, 5, settings.examHorizonDays());
    const bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (!ok) {
        lastError_ = sqlite3_errmsg(db_);
    }
    sqlite3_finalize(stmt);
    return ok;
}

const std::string& Storage::lastError() const { return lastError_; }
