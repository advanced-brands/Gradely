#include "Settings.h"

Settings::Settings()
    : attendanceThreshold_(80.0),
      urgentDays_(2),
      upcomingDays_(7),
      workloadLimit_(5),
      examHorizonDays_(14) {}

double Settings::attendanceThreshold() const { return attendanceThreshold_; }
int Settings::urgentDays() const { return urgentDays_; }
int Settings::upcomingDays() const { return upcomingDays_; }
int Settings::workloadLimit() const { return workloadLimit_; }
int Settings::examHorizonDays() const { return examHorizonDays_; }

void Settings::setAttendanceThreshold(double value) { attendanceThreshold_ = value; }
void Settings::setUrgentDays(int value) { urgentDays_ = value; }
void Settings::setUpcomingDays(int value) { upcomingDays_ = value; }
void Settings::setWorkloadLimit(int value) { workloadLimit_ = value; }
void Settings::setExamHorizonDays(int value) { examHorizonDays_ = value; }
