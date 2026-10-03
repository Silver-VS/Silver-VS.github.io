## A conversion engine apart from the activity

The Android project keeps word construction in `NumbersInLetters` and interaction in `MainActivity`. That separation makes the number rules readable without following the Android event handlers.

## Decimal decomposition

For a nonnegative two-digit integer n, the units part is n modulo 10. The tens part is n minus that remainder. The conversion class uses this decomposition to choose the tens name and then handle the remaining units.

```text
units = n % 10
tens = n - units
```

Special forms below thirty require their own branch. The class also distinguishes whether a group stands alone or is followed by a larger denomination, so word construction cannot be reduced to one lookup per digit.

## Scope of the observation

The repository describes conversion up to nine digits. This note identifies how the code is organized and why composition needs context; it does not certify every linguistic exception or numeric edge case.

## Source

[NumbersInLetters.java](https://github.com/Silver-VS/NumbersToLetters/blob/master/app/src/main/java/com/coralcorp/numberstoletters/NumbersInLetters.java).
