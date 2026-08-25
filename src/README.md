# Building Gradely (C++ application)

The application lives in `src/`. SQLite is vendored in `vendor/sqlite/` so you do not install a database server.

## Compiler

You need a C++17 compiler. This computer did not have `g++` or Visual Studio on PATH when Build A was written.

**Option A — MinGW (g++)** via [WinLibs](https://winlibs.com/) or MSYS2, then:

```bat
g++ -std=c++17 -I vendor/sqlite src\Utils.cpp src\Date.cpp src\Profile.cpp src\Semester.cpp src\Settings.cpp src\Storage.cpp src\main.cpp vendor\sqlite\sqlite3.c -o gradely.exe
```

Run from the project root (`Gradely`), then:

```bat
gradely.exe
```

The database is created at `data\gradely.db` on first run.

**Option B — Visual Studio**

Open “x64 Native Tools Command Prompt”, then the same sources with `cl /std:c++17 /EHsc /I vendor\sqlite` plus `sqlite3.c`.

First compile of `sqlite3.c` is slow; that is normal.
