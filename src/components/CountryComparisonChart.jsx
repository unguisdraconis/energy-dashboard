import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { ResponsiveChartWrapper } from './ResponsiveChartWrapper';
import { COUNTRY_PALETTE } from '../colorPalette';
import { data, getCountries } from '../data';

const DEFAULT_COUNTRIES = ['United States', 'China', 'India', 'Germany', 'Brazil'];

function ComparisonSVG({ width, height, selectedCountries }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 75, bottom: 30, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    if (w <= 0 || h <= 0) return;

    const countryData = selectedCountries.map((country) => ({
      country,
      values: data.filter((d) => d.country === country).sort((a, b) => a.year - b.year),
    }));

    const allYears = countryData.flatMap((c) => c.values.map((d) => d.year));
    const allValues = countryData.flatMap((c) => c.values.map((d) => d.primary_energy));

    if (!allYears.length) return;

    const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(allValues)]).nice().range([h, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', '#2d3748').attr('stroke-dasharray', '2,2'));

    const line = d3.line()
      .x((d) => x(d.year))
      .y((d) => y(d.primary_energy))
      .curve(d3.curveMonotoneX);

    countryData.forEach((c, i) => {
      const color = COUNTRY_PALETTE[i % COUNTRY_PALETTE.length];

      g.append('path')
        .datum(c.values)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.9);

      // End label
      const last = c.values[c.values.length - 1];
      if (last) {
        g.append('text')
          .attr('x', x(last.year) + 5)
          .attr('y', y(last.primary_energy))
          .attr('fill', color)
          .attr('font-size', '9px')
          .attr('alignment-baseline', 'middle')
          .text(c.country.length > 10 ? c.country.slice(0, 10) + '…' : c.country);
      }
    });

    // X axis
    const tickCount = w < 300 ? 4 : w < 500 ? 6 : 8;
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(tickCount).tickFormat(d3.format('d')))
      .call((g) => g.select('.domain').attr('stroke', '#4a5568'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#4a5568'))
      .call((g) => g.selectAll('.tick text').attr('fill', '#8892a4').attr('font-size', '11px'));

    // Y axis
    g.append('g')
      .call(
        d3.axisLeft(y).ticks(5).tickFormat((d) => {
          if (d >= 1000) return `${d / 1000}k`;
          return d;
        })
      )
      .call((g) => g.select('.domain').attr('stroke', '#4a5568'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#4a5568'))
      .call((g) => g.selectAll('.tick text').attr('fill', '#8892a4').attr('font-size', '11px'));

    // Y label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -h / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8892a4')
      .attr('font-size', '10px')
      .text('TWh');
  }, [width, height, selectedCountries]);

  return <svg ref={svgRef} width={width} height={height} />;
}

export function CountryComparisonChart() {
  const allCountries = getCountries().filter((c) => c !== 'World');
  const [selected, setSelected] = useState(DEFAULT_COUNTRIES);

  const toggle = (country) => {
    setSelected((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : prev.length < 9
          ? [...prev, country]
          : prev
    );
  };

  return (
    <ResponsiveChartWrapper
      title="Country Comparison — Total Energy"
      controls={
        <div className="country-toggles">
          {allCountries.map((c) => (
            <button
              key={c}
              className={`toggle-btn ${selected.includes(c) ? 'active' : ''}`}
              style={
                selected.includes(c)
                  ? { borderColor: COUNTRY_PALETTE[selected.indexOf(c) % COUNTRY_PALETTE.length] }
                  : {}
              }
              onClick={() => toggle(c)}
            >
              {c}
            </button>
          ))}
        </div>
      }
    >
      {({ width, height }) => (
        <ComparisonSVG width={width} height={height} selectedCountries={selected} />
      )}
    </ResponsiveChartWrapper>
  );
}
