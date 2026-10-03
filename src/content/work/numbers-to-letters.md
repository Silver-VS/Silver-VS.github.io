## Problem

Writing a number in Spanish is more than concatenating digit names. Units, tens, hundreds, and larger groups need different forms and composition rules. This project places that conversion behind an Android interface.

## Architecture

`MainActivity` handles the Android interaction; `NumbersInLetters` contains the conversion methods. The repository includes layouts, localized strings, Gradle configuration, and unit/instrumentation test directories.

## Scope

The public repository description states a range of up to nine digits. The conversion code contains methods for units, tens, hundreds, and higher-order composition. The catalog records that documented scope without claiming an exhaustive validation of Spanish grammar or every numeric boundary.

## Sources

[Conversion class](https://github.com/Silver-VS/NumbersToLetters/blob/master/app/src/main/java/com/coralcorp/numberstoletters/NumbersInLetters.java), [activity](https://github.com/Silver-VS/NumbersToLetters/blob/master/app/src/main/java/com/coralcorp/numberstoletters/MainActivity.java), and [Gradle configuration](https://github.com/Silver-VS/NumbersToLetters/blob/master/app/build.gradle). Device installation was not performed during this audit.
