#pragma once

class Settings {
public:
    Settings();

    double attendanceThreshold() const;
    int urgentDays() const;
    int upcomingDays() const;
    int workloadLimit() const;
    int examHorizonDays() const;

    void setAttendanceThreshold(double value);
    void setUrgentDays(int value);
    void setUpcomingDays(int value);
    void setWorkloadLimit(int value);
    void setExamHorizonDays(int value);

private:
    double attendanceThreshold_;
    int urgentDays_;
    int upcomingDays_;
    int workloadLimit_;
    int examHorizonDays_;
};
