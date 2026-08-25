#pragma once

#include <string>

// Small helpers so we do not copy the same input code into every menu.
namespace Utils {
    std::string trim(const std::string& text);
    std::string readLine();
    std::string readRequired(const std::string& prompt);
    int readChoice(const std::string& prompt, int minValue, int maxValue);
    void pause();
    void clearScreen();
}
