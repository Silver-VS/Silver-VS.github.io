## Context

Laboratorio-SO contains C exercises and a CMake project. Its `competencia.c` file identifies a collaborative operating-systems class exercise; it should not be presented as exclusively authored work.

## Threading exercise

Two input strings are passed to separate `CreateThread` workers. Each worker prints characters with randomized delays. The main thread waits for both handles and closes them afterward.

That structure makes interleaved execution visible in terminal output. The source uses `windows.h`, `Sleep`, `WaitForSingleObject`, and `CloseHandle`, so the exercise is specifically tied to the Windows API.

## Limits

These are course exercises, not a general-purpose concurrency library. Checked-in executable/build artifacts are not redistributed by the Workbench. The source was read without running its binaries.

## Sources

[Collaborative threading exercise](https://github.com/Silver-VS/Laboratorio-SO/blob/master/competencia.c), [additional exercise](https://github.com/Silver-VS/Laboratorio-SO/blob/master/Solve.c), and [CMake configuration](https://github.com/Silver-VS/Laboratorio-SO/blob/master/CMakeLists.txt). Original contributor credits remain in the upstream source.
