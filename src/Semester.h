#pragma once

#include <string>

class Semester {
public:
    Semester();
    explicit Semester(const std::string& label);

    const std::string& label() const;
    void setLabel(const std::string& value);
    bool isSet() const;

private:
    std::string label_;
};
