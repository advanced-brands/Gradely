#include "Semester.h"

#include "Utils.h"

Semester::Semester() = default;

Semester::Semester(const std::string& label) { setLabel(label); }

const std::string& Semester::label() const { return label_; }

void Semester::setLabel(const std::string& value) { label_ = Utils::trim(value); }

bool Semester::isSet() const { return !label_.empty(); }
