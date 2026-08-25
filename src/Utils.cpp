#include "Utils.h"

#include <iostream>
#include <limits>
#include <string>

#ifdef _WIN32
#include <cstdlib>
#endif

namespace Utils {

std::string trim(const std::string& text) {
    const std::string space = " \t\r\n";
    const size_t start = text.find_first_not_of(space);
    if (start == std::string::npos) {
        return "";
    }
    const size_t end = text.find_last_not_of(space);
    return text.substr(start, end - start + 1);
}

std::string readLine() {
    std::string line;
    std::getline(std::cin, line);
    return line;
}

std::string readRequired(const std::string& prompt) {
    while (true) {
        std::cout << prompt;
        const std::string value = trim(readLine());
        if (!value.empty()) {
            return value;
        }
        std::cout << "  Please enter a value.\n";
    }
}

int readChoice(const std::string& prompt, int minValue, int maxValue) {
    while (true) {
        std::cout << prompt;
        int choice = 0;
        if (std::cin >> choice && choice >= minValue && choice <= maxValue) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            return choice;
        }
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "  Enter a number from " << minValue << " to " << maxValue << ".\n";
    }
}

void pause() {
    std::cout << "\nPress Enter to continue...";
    readLine();
}

void clearScreen() {
#ifdef _WIN32
    std::system("cls");
#else
    std::cout << "\n\n";
#endif
}

}
