## Context

Practica2 combines function evaluation, a genetic-algorithm implementation, and graphing classes. Binary chromosome strings are decoded into integer positions within a configured interval.

## Architecture

`functions.GeneticAlgorithm` owns the population and operators. `FunctionEvaluator` provides the objective functions. The graphing layer records evaluated points for display.

The implementation contains proportional selection, one-point crossover, and mutation. A generation replaces the population with offspring produced in pairs.

## Constraints visible in source

The offspring loop writes two slots at a time, so population-size edge cases need attention. `runAlgorithm(boolean maximize, int generations)` accepts an objective-direction argument, but the method body does not use it. `getBestIndividual()` chooses the maximum fitness. Those details matter before describing minimization as supported.

No convergence measurements, benchmark results, or freshly executed test results are claimed in this case file.

## Related work

ProyectoGenetics explores similar functions with a different interface and model. The two repositories are linked as related studies; no migration or release relationship is assumed.

## Sources

[Algorithm](https://github.com/Silver-VS/Practica2/blob/master/src/main/java/functions/GeneticAlgorithm.java), [function evaluator](https://github.com/Silver-VS/Practica2/blob/master/src/main/java/functions/FunctionEvaluator.java), and [graphing implementation](https://github.com/Silver-VS/Practica2/blob/master/src/main/java/plot/Graphing.java).
