#include "Profile.h"
#include "Semester.h"
#include "Settings.h"
#include "Storage.h"
#include "Utils.h"

#include <iostream>

namespace {

void printBanner() {
    std::cout << "========================================\n";
    std::cout << "  GRADELY\n";
    std::cout << "  Stay on track. Stay ahead.\n";
    std::cout << "========================================\n\n";
}

void printDashboard(const Profile& profile, const Semester& semester) {
    std::cout << "----------------------------------------\n";
    std::cout << "  Welcome, " << profile.name() << "\n";
    std::cout << "  " << (semester.isSet() ? semester.label() : "No semester set") << "\n";
    std::cout << "----------------------------------------\n";
    std::cout << "  Activity progress:  No tasks yet\n";
    std::cout << "  Attendance:         No classes recorded\n";
    std::cout << "  Pending tasks:      0\n";
    std::cout << "  Upcoming deadline:  None\n";
    std::cout << "  Upcoming test/exam: None\n\n";
    std::cout << "  Guidance\n";
    std::cout << "  - Add your courses to start tracking this semester.\n";
    std::cout << "----------------------------------------\n";
}

void comingNext(const std::string& moduleName) {
    std::cout << moduleName << " is the next build. Your profile is already saved.\n";
}

bool createYourSpace(Storage& storage, Profile& profile, Semester& semester, Settings& settings) {
    printBanner();
    std::cout << "  Create your space\n";
    std::cout << "  (Stored on this computer only.\n";
    std::cout << "   Your student number is not used to\n";
    std::cout << "   download records from a school.)\n\n";

    profile.setName(Utils::readRequired("  Full name: "));
    profile.setStudentNumber(Utils::readRequired("  Student number: "));
    profile.setInstitution(Utils::readRequired("  Institution: "));
    profile.setProgram(Utils::readRequired("  Program: "));
    profile.setYearOfStudy(Utils::readRequired("  Year of study: "));
    semester.setLabel(Utils::readRequired("  Semester (e.g. 2026 - Semester 1): "));

    if (!storage.saveProfile(profile) || !storage.saveSemester(semester)
        || !storage.saveSettings(settings)) {
        std::cout << "Could not save: " << storage.lastError() << "\n";
        return false;
    }
    std::cout << "\n  Your space is ready.\n";
    Utils::pause();
    return true;
}

void editProfile(Storage& storage, Profile& profile) {
    std::cout << "Current name: " << profile.name() << "\n";
    profile.setName(Utils::readRequired("New full name: "));
    std::cout << "Current student number: " << profile.studentNumber() << "\n";
    profile.setStudentNumber(Utils::readRequired("New student number: "));
    std::cout << "Current institution: " << profile.institution() << "\n";
    profile.setInstitution(Utils::readRequired("New institution: "));
    std::cout << "Current program: " << profile.program() << "\n";
    profile.setProgram(Utils::readRequired("New program: "));
    std::cout << "Current year: " << profile.yearOfStudy() << "\n";
    profile.setYearOfStudy(Utils::readRequired("New year of study: "));
    if (storage.saveProfile(profile)) {
        std::cout << "Profile saved.\n";
    } else {
        std::cout << "Could not save: " << storage.lastError() << "\n";
    }
}

void showProfile(const Profile& profile) {
    std::cout << "Name:            " << profile.name() << "\n";
    std::cout << "Student number:  " << profile.studentNumber() << "\n";
    std::cout << "Institution:     " << profile.institution() << "\n";
    std::cout << "Program:         " << profile.program() << "\n";
    std::cout << "Year of study:   " << profile.yearOfStudy() << "\n";
}

void editSemester(Storage& storage, Semester& semester) {
    std::cout << "Current semester: " << semester.label() << "\n";
    semester.setLabel(Utils::readRequired("New semester label: "));
    if (storage.saveSemester(semester)) {
        std::cout << "Semester saved.\n";
    } else {
        std::cout << "Could not save: " << storage.lastError() << "\n";
    }
}

}

int main() {
    Storage storage;
    if (!storage.open("data/gradely.db")) {
        std::cout << "Gradely could not open its database.\n";
        std::cout << storage.lastError() << "\n";
        return 1;
    }

    Profile profile;
    Semester semester;
    Settings settings;

    if (storage.hasProfile()) {
        storage.loadProfile(profile);
        storage.loadSemester(semester);
        if (!storage.loadSettings(settings)) {
            storage.saveSettings(settings);
        }
    } else {
        if (!createYourSpace(storage, profile, semester, settings)) {
            return 1;
        }
    }

    bool running = true;
    while (running) {
        Utils::clearScreen();
        printBanner();
        printDashboard(profile, semester);
        std::cout << "\n  1. Dashboard\n";
        std::cout << "  2. My profile\n";
        std::cout << "  3. Semester\n";
        std::cout << "  4. Courses\n";
        std::cout << "  5. Attendance\n";
        std::cout << "  6. Tasks\n";
        std::cout << "  7. Notes\n";
        std::cout << "  8. Save\n";
        std::cout << "  9. Exit\n";

        const int choice = Utils::readChoice("\nChoose 1-9: ", 1, 9);
        switch (choice) {
        case 1:
            break;
        case 2:
            Utils::clearScreen();
            showProfile(profile);
            std::cout << "\n  1. Edit profile\n  2. Back\n";
            if (Utils::readChoice("Choose: ", 1, 2) == 1) {
                editProfile(storage, profile);
            }
            break;
        case 3:
            Utils::clearScreen();
            std::cout << "Semester: " << semester.label() << "\n\n";
            std::cout << "  1. Edit semester\n  2. Back\n";
            if (Utils::readChoice("Choose: ", 1, 2) == 1) {
                editSemester(storage, semester);
            }
            break;
        case 4:
            comingNext("Courses");
            Utils::pause();
            break;
        case 5:
            comingNext("Attendance");
            Utils::pause();
            break;
        case 6:
            comingNext("Tasks");
            Utils::pause();
            break;
        case 7:
            comingNext("Notes");
            Utils::pause();
            break;
        case 8:
            if (storage.saveProfile(profile) && storage.saveSemester(semester)
                && storage.saveSettings(settings)) {
                std::cout << "Saved.\n";
            } else {
                std::cout << "Could not save: " << storage.lastError() << "\n";
            }
            Utils::pause();
            break;
        case 9:
            running = false;
            break;
        }
    }

    std::cout << "See you next time.\n";
    return 0;
}
