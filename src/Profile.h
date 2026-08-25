#pragma once

#include <string>

class Profile {
public:
    Profile();

    const std::string& name() const;
    const std::string& studentNumber() const;
    const std::string& institution() const;
    const std::string& program() const;
    const std::string& yearOfStudy() const;

    void setName(const std::string& value);
    void setStudentNumber(const std::string& value);
    void setInstitution(const std::string& value);
    void setProgram(const std::string& value);
    void setYearOfStudy(const std::string& value);

    bool isComplete() const;

private:
    std::string name_;
    std::string studentNumber_;
    std::string institution_;
    std::string program_;
    std::string yearOfStudy_;
};
