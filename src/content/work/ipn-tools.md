## Problem

Academic planning involves more than picking a timetable. Prerequisites, curricular progress, the current course offering, and elective documentation all affect what can be planned. IPN-tools brings those tasks into browser-based tools for IPN students.

## Architecture

Python build scripts combine page templates with curriculum data, course offerings, and document templates. The result is static HTML and JavaScript. The project README states that SAES information is read locally and remains in the student's browser.

| Component | Documented responsibility |
| --- | --- |
| Horarios | Curriculum and trajectory, course selection, timetable generation, image/PDF/Excel export |
| Electivas | Activity records and generation of elective paperwork |
| SAES readers | Read-only capture and import of academic information |
| Build scripts | Generate standalone pages and the institutional distribution |

## Scope

Schedule planning can use offerings from other IPN units. UPIITA-specific trajectory rules, the academic-record reader, and electives are narrower features. The self-hosting guide explains that distinction rather than claiming every feature works at every unit.

## Deployment boundary

IPN-tools is independently maintained and published from its own repository. Its deployed application shares the Pages domain under `/upiita/`; the Workbench redesign does not change its files, authentication settings, or publication process.

This case file documents the project. The application remains an independent destination: [open IPN-tools](https://silver-vs.github.io/upiita/).

## Current state

The upstream README identifies the deployment as a trial version. This catalog therefore records it as a prototype rather than certifying all academic rules or presenting it as an official replacement for SAES.

## Sources

This description is based on the [README](https://github.com/Silver-VS/IPN-tools/blob/main/README.md), [self-hosting guide](https://github.com/Silver-VS/IPN-tools/blob/main/docs/AUTOHOSPEDAJE.md), and [publication script](https://github.com/Silver-VS/IPN-tools/blob/main/tools/publicar.sh). Repository evidence reviewed on 2 October 2026; upstream behavior can change independently.
