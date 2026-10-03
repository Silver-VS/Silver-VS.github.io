## Question

How should parent selection and replacement be implemented in the real-valued model, and what tests would distinguish those operators from random mutation alone?

## Observation

`seleccionarPadres()` and `generarNuevaPoblacion()` are called in the model's generation loop but have no implementation. Mutation, function evaluation, and fitness-history tracking are present.

## Proposed evaluation

First make the operator contracts explicit: input population, objective direction, parent choice, offspring generation, and survivor selection. Then use deterministic small populations to check that each operator honors those contracts before measuring convergence.

## Current result

This is a source-derived open question. No changes have been applied to ProyectoGenetics and no optimization experiment has been run by this cataloging work.

## Source

[AlgoritmoGenetico.java](https://github.com/Silver-VS/ProyectoGenetics/blob/master/src/main/java/Model/AlgoritmoGenetico.java).
