@echo off
cd /d "%~dp0"
g++ -std=c++17 -I vendor/sqlite src\Utils.cpp src\Date.cpp src\Profile.cpp src\Semester.cpp src\Settings.cpp src\Storage.cpp src\main.cpp vendor\sqlite\sqlite3.c -o gradely.exe
if errorlevel 1 (
  echo.
  echo Compile failed. Install a C++ compiler and make sure g++ is on PATH.
  exit /b 1
)
echo Built gradely.exe
echo Run: gradely.exe
