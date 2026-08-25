#pragma once

#include "Profile.h"
#include "Semester.h"
#include "Settings.h"

#include <string>

struct sqlite3;

// Storage is the only module that talks to SQLite.
class Storage {
public:
    Storage();
    ~Storage();

    Storage(const Storage&) = delete;
    Storage& operator=(const Storage&) = delete;

    bool open(const std::string& path);
    void close();

    bool hasProfile() const;

    bool loadProfile(Profile& profile) const;
    bool saveProfile(const Profile& profile);

    bool loadSemester(Semester& semester) const;
    bool saveSemester(const Semester& semester);

    bool loadSettings(Settings& settings) const;
    bool saveSettings(const Settings& settings);

    const std::string& lastError() const;

private:
    bool exec(const char* sql);
    bool createTables();

    sqlite3* db_;
    std::string lastError_;
};
