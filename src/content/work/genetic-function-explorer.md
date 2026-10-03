## Context

ProyectoGenetics exposes population size, generation count, mutation probability, interval bounds, objective direction, and function selection through a JavaFX interface. The model evaluates candidates and keeps a history of the best fitness values.

## Architecture

The source follows Model, Controller, and View packages. The model contains Individuo, FunctionType, and AlgoritmoGenetico; the view builds the controls and plots. Maven declares Java 22, JavaFX controls/FXML, JFreeChart, and JUnit Jupiter.

## Implemented behavior

The model initializes real-valued candidates within an interval, evaluates one of three functions, applies random mutation, and records the best individual. Its objectives include a quadratic function, a trigonometric combination, and an absolute-valued expression.

## Unfinished stages

`seleccionarPadres()` and `generarNuevaPoblacion()` contain TODO comments without an implementation. The current loop therefore should not be described as a completed selection-and-recombination genetic optimizer. Mutation and fitness history are present; an implemented evolutionary replacement strategy is not.

The repository contains unit-test sources. Their presence is evidence of testing intent, not a claim that this audit executed or passed them.

## Sources

[Model](https://github.com/Silver-VS/ProyectoGenetics/blob/master/src/main/java/Model/AlgoritmoGenetico.java), [view](https://github.com/Silver-VS/ProyectoGenetics/blob/master/src/main/java/View/AlgoritmoGeneticoView.java), [build configuration](https://github.com/Silver-VS/ProyectoGenetics/blob/master/pom.xml), and [test sources](https://github.com/Silver-VS/ProyectoGenetics/blob/master/src/test/java/AlgoritmoGeneticoTest.java).
