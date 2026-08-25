#pragma once

#include <string>

// Date is stored and typed as YYYY-MM-DD. Comparisons use year, then month, then day.
class Date {
public:
    Date();
    Date(int year, int month, int day);

    static Date today();
    static bool parse(const std::string& text, Date& out);

    int year() const;
    int month() const;
    int day() const;

    std::string toString() const;
    bool isValid() const;

    bool operator<(const Date& other) const;
    bool operator==(const Date& other) const;
    bool operator<=(const Date& other) const;

    // Positive if this date is after other.
    int daysFrom(const Date& other) const;

private:
    int year_;
    int month_;
    int day_;
};
