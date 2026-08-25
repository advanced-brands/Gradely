#include "Date.h"

#include <ctime>
#include <iomanip>
#include <sstream>

namespace {
int daysInMonth(int year, int month) {
    const int days[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (month == 2) {
        const bool leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        return leap ? 29 : 28;
    }
    if (month < 1 || month > 12) {
        return 0;
    }
    return days[month];
}

int toSerial(const Date& date) {
    // Simple day count from a fixed origin so we can subtract dates.
    int y = date.year();
    int m = date.month();
    int d = date.day();
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    return 365 * y + y / 4 - y / 100 + y / 400 + (153 * m - 457) / 5 + d;
}
}

Date::Date() : year_(0), month_(0), day_(0) {}

Date::Date(int year, int month, int day) : year_(year), month_(month), day_(day) {}

Date Date::today() {
    const std::time_t now = std::time(nullptr);
    std::tm local {};
#ifdef _WIN32
    localtime_s(&local, &now);
#else
    localtime_r(&now, &local);
#endif
    return Date(local.tm_year + 1900, local.tm_mon + 1, local.tm_mday);
}

bool Date::parse(const std::string& text, Date& out) {
    int y = 0;
    int m = 0;
    int d = 0;
    char a = 0;
    char b = 0;
    std::istringstream in(text);
    if (!(in >> y >> a >> m >> b >> d) || a != '-' || b != '-') {
        return false;
    }
    Date candidate(y, m, d);
    if (!candidate.isValid()) {
        return false;
    }
    out = candidate;
    return true;
}

int Date::year() const { return year_; }
int Date::month() const { return month_; }
int Date::day() const { return day_; }

std::string Date::toString() const {
    std::ostringstream out;
    out << year_ << '-'
        << std::setw(2) << std::setfill('0') << month_ << '-'
        << std::setw(2) << std::setfill('0') << day_;
    return out.str();
}

bool Date::isValid() const {
    if (year_ < 2000 || year_ > 2100) {
        return false;
    }
    if (month_ < 1 || month_ > 12) {
        return false;
    }
    if (day_ < 1 || day_ > daysInMonth(year_, month_)) {
        return false;
    }
    return true;
}

bool Date::operator<(const Date& other) const {
    if (year_ != other.year_) {
        return year_ < other.year_;
    }
    if (month_ != other.month_) {
        return month_ < other.month_;
    }
    return day_ < other.day_;
}

bool Date::operator==(const Date& other) const {
    return year_ == other.year_ && month_ == other.month_ && day_ == other.day_;
}

bool Date::operator<=(const Date& other) const {
    return *this < other || *this == other;
}

int Date::daysFrom(const Date& other) const {
    return toSerial(*this) - toSerial(other);
}
