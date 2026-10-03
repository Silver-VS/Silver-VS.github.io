## Coordinate spaces

The plotting panel stores samples in function coordinates but draws them in pixel coordinates. The source reserves a margin for axes and tick labels. If the available plotting width is W and the interval is from x_min to x_max, scaling that interval to W requires:

```text
scaleX = W / (x_max - x_min)
pixelX = leftMargin + (x - x_min) * scaleX
```

Subtracting the lower endpoint makes the interval start at zero; multiplying by the scale maps its full width to W. The left margin then translates that result into the drawing area.

## Vertical direction

Screen y coordinates increase downward. To keep greater function values higher on the plot, the implementation subtracts the scaled displacement from the bottom of the drawing area:

```text
scaleY = H / (y_max - y_min)
pixelY = bottom - (y - y_min) * scaleY
```

## Degenerate ranges

Both scale calculations divide by an interval width. A single x position or constant y values collapse that interval to zero. Those are concrete cases to handle before generalizing the exercise into reusable graphing code.

The published source also initializes the maximum with `Double.MIN_VALUE`, which is a positive small value rather than a negative lower bound. All-negative datasets therefore deserve a focused test. This observation follows from reading the implementation; the project was not modified during cataloging.

## Source

[plot.graficarM](https://github.com/Silver-VS/Practica1/blob/master/src/main/java/plot/graficarM.java).
