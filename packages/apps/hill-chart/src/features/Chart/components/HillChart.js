import React from 'react';
import PropTypes from 'prop-types';
import { Runtime, Inspector } from '@observablehq/runtime';

function Chart(props) {
  const [chartRef, setChartRef] = React.useState();

  function define(runtime, observer) {
    const main = runtime.module();
    main.variable(observer()).define(['md'], (md) => md`
# Hill Charts`);
    main
      .variable(observer())
      .define(['HillChart', 'width', 'data'], (HillChart, width, data) => new HillChart(300, width, data).render());
    main.variable(observer()).define(['md'], (md) => md`
Reference

- https://basecamp.com/features/hill-charts
- https://m.signalvnoise.com/new-in-basecamp-see-where-projects-really-stand-with-the-hill-chart-ca5a6c47e987`);
    main.variable(observer('data')).define('data', () => props.data);
    main
      .variable(observer('HillChart'))
      .define('HillChart', ['d3', 'DOM', 'translateXtoY'], (
        d3,
        DOM,
        translateXtoY,
      ) => class HillChart {
        constructor(chart_height, chart_width, items) {
          this.chart_height = chart_height;
          this.chart_width = chart_width;
          this.items = items;

          this.svg = d3.select(DOM.svg(this.chart_width, this.chart_height));
        }

        render() {
          const xScale = d3
            .scaleLinear()
            .domain([0, 100])
            .range([0, this.chart_width - 10]);

          const yScale = d3
            .scaleLinear()
            .domain([0, 100])
            .range([this.chart_height - 40, 10]);

          // HILL LINE
          const hillData = d3.range(0, 100, 0.1).map((i) => ({
            x: i,
            y: translateXtoY(i),
          }));

          const hillLine = d3
            .line()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y));

          this.svg
            .append('path')
            .attr('class', 'line')
            .datum(hillData)
            .attr('fill', 'none')
            .attr('stroke', '#cccccc')
            .attr('stroke-width', 2)
            .attr('d', hillLine);

          // PLOT POINTS
          const dragFn = d3.drag().on('drag', function (d) {
            let xPoint = d.x + xScale.invert(d3.event.dx);

            if (xPoint < 0) {
              xPoint = 0;
            } else if (xPoint > 100) {
              xPoint = 100;
            }

            d.x = xPoint;

            d3.select(this).attr(
              'transform',
              `translate(${xScale(xPoint)}, ${yScale(translateXtoY(xPoint))})`,
            );
          });

          const group = this.svg
            .selectAll('.group')
            .data(this.items)
            .enter()
            .append('g')
            .attr('class', 'group')
            .attr('transform', (d) => `translate(${xScale(d.x)}, ${yScale(
              translateXtoY(d.x),
            )})`)
            .call(dragFn);

          group
            .append('circle')
            .attr('fill', (d) => d.color)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .attr('style', 'cursor: move')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', (d) => d.size);

          group
            .append('line')
            .attr('stroke', (d) => d.color)
            .attr('stroke-width', 1)
            .attr('x1', 10)
            .attr('y1', 0)
            .attr('x2', 20)
            .attr('y2', 0);

          group
            .append('text')
            .attr('style', 'font-family: Tahoma; font-size: 14px;')
            .text((d) => d.description)
            .attr('x', 22)
            .attr('y', 5);

          // BOTTOM AXIS
          this.svg
            .append('line')
            .attr('class', 'middle')
            .attr('x1', xScale(0))
            .attr('y1', yScale(-5))
            .attr('x2', xScale(100))
            .attr('y2', yScale(-5))
            .attr('stroke', '#dddddd')
            .attr('stroke-width', 1);

          // AXIS LABELS
          this.svg
            .append('text')
            .attr('class', 'text')
            .attr('style', 'font-family: Tahoma; font-size: 14px;')
            .attr('fill', '#999999')
            .text('FIGURING THINGS OUT')
            .attr('x', xScale(15))
            .attr('y', this.chart_height - 5);

          this.svg
            .append('text')
            .attr('class', 'text')
            .attr('style', 'font-family: Tahoma; font-size: 14px;')
            .attr('fill', '#999999')
            .text('MAKING IT HAPPEN')
            .attr('x', xScale(70))
            .attr('y', this.chart_height - 5);

          // MIDDLE LINE
          this.svg
            .append('line')
            .attr('class', 'middle')
            .attr('x1', xScale(50))
            .attr('y1', yScale(0))
            .attr('x2', xScale(50))
            .attr('y2', yScale(100))
            .attr('stroke', '#dddddd')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', 10);

          return this.svg.node();
        }
      });
    main
      .variable(observer('translateXtoY'))
      .define('translateXtoY', () => (x) => 50 * Math.sin((Math.PI / 50) * x - (1 / 2) * Math.PI) + 50);
    main.variable(observer('d3')).define('d3', ['require'], (require) => require('https://d3js.org/d3.v5.min.js'));
    return main;
  }

  const useChartRef = React.useCallback((ref) => {
    console.debug(ref);
    setChartRef(ref);
  }, []);
  const [runtime] = React.useState(() => new Runtime());

  React.useEffect(() => {
    if (chartRef) {
      // Clear the chart
      chartRef.innerHTML = '';

      // Render an updated chart
      runtime.module(define, Inspector.into(chartRef));
    }
  }, [chartRef, props.data]);

  return <div ref={useChartRef} />;
}

Chart.propTypes = {
  data: PropTypes.array,
};

export default Chart;
