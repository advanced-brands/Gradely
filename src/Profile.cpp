#include "Profile.h"

#include "Utils.h"

Profile::Profile() = default;

const std::string& Profile::name() const { return name_; }
const std::string& Profile::studentNumber() const { return studentNumber_; }
const std::string& Profile::institution() const { return institution_; }
const std::string& Profile::program() const { return program_; }
const std::string& Profile::yearOfStudy() const { return yearOfStudy_; }

void Profile::setName(const std::string& value) { name_ = Utils::trim(value); }
void Profile::setStudentNumber(const std::string& value) { studentNumber_ = Utils::trim(value); }
void Profile::setInstitution(const std::string& value) { institution_ = Utils::trim(value); }
void Profile::setProgram(const std::string& value) { program_ = Utils::trim(value); }
void Profile::setYearOfStudy(const std::string& value) { yearOfStudy_ = Utils::trim(value); }

bool Profile::isComplete() const {
    return !name_.empty() && !studentNumber_.empty() && !institution_.empty()
        && !program_.empty() && !yearOfStudy_.empty();
}
