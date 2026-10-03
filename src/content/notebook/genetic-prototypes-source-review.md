## Two implementations, different boundaries

Practica2 uses binary chromosome strings and includes proportional selection, one-point crossover, and mutation. ProyectoGenetics uses real-valued candidates and a JavaFX interface, but its parent-selection and new-population methods remain TODO placeholders.

Those observations describe the checked-in source. They do not establish that the newer repository is a complete successor or that either implementation converges reliably.

## Missing evolutionary stages

ProyectoGenetics calls selection and population-generation methods in its execution loop. Their bodies contain only implementation comments. A loop that evaluates and randomly mutates candidates is not evidence of implemented selection and recombination.

This is why its Work entry says prototype and its Lab entry asks how those stages should be completed.

## Objective direction

Practica2's execution method accepts a `maximize` parameter. The inspected method body does not use it, and its best-individual method selects the maximum fitness. A UI control or parameter name alone is insufficient evidence that minimization is implemented.

## Fitness and population boundaries

The proportional selector sums raw fitness values and samples against that sum. The declared objectives include values that can be negative, so the assumptions behind a probability-like weighting need review. The offspring loop also writes paired slots, making odd population sizes a concrete test case.

## Test evidence

Both repositories contain test sources. This audit did not execute them, and no test-passing or convergence claim is made. Source inspection supports documenting specific missing branches and follow-up tests; it does not substitute for experimental evaluation.

## Sources

[ProyectoGenetics model](https://github.com/Silver-VS/ProyectoGenetics/blob/master/src/main/java/Model/AlgoritmoGenetico.java) and [Practica2 algorithm](https://github.com/Silver-VS/Practica2/blob/master/src/main/java/functions/GeneticAlgorithm.java). The site records these limitations without modifying either project.
