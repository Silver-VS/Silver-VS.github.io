## Context

Practica1 separates function classes from a custom plotting panel. `plot.graficarM` extends `JPanel` and renders axes, tick labels, and connecting line segments through Java2D.

## Rendering approach

The panel receives arrays of sampled coordinate pairs. It determines the vertical range, computes scale factors from the panel dimensions, and transforms each point into screen coordinates before drawing successive segments.

## Limits

The source is a plotting exercise rather than a complete charting library. Constant-valued data, small sample sets, and viewport constraints deserve separate tests before broad reuse. This catalog does not claim that those edge cases were validated.

## Sources

[Plot panel](https://github.com/Silver-VS/Practica1/blob/master/src/main/java/plot/graficarM.java) and [Maven configuration](https://github.com/Silver-VS/Practica1/blob/master/pom.xml).
