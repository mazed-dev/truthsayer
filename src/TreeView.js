import React from "react";
import "./App.css";

import * as d3 from "d3";

class ThreadView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "O",
    };
  }

  render() {
    return (
      <div>
        <h2>Thread</h2>
        <BarChart />
      </div>
    );
  }
}

class BarChart extends React.Component {
  constructor(props) {
    super(props);
    this.createBarChart = this.createBarChart.bind(this);
    this.data = {
      name: "Flare",
      children: [
        {
          name: "Analytics",
          children: [],
        },
        {
          name: "Animate",
          children: [],
        },
        {
          name: "Data",
          children: [],
        },
        {
          name: "Display",
          children: [],
        },
        {
          name: "Flex",
          children: [],
        },
        {
          name: "Physics",
          children: [],
        },
        {
          name: "Query",
          children: [],
        },
        {
          name: "Scale",
          children: [],
        },
        {
          name: "Util",
          children: [],
        },
        {
          name: "Vis",
          children: [
            { name: "Axis", children: [] },
            { name: "Controls", children: [] },
            {
              name: "Data",
              children: [
                // Everythin deeper than 3 -> use smaler cards
                // {
                //   name: "util", children: [
                //   ],
                // },
              ],
            },
          ],
        },
      ],
    };
  }

  componentDidMount() {
    this.createBarChart();
  }

  componentDidUpdate() {
    this.createBarChart();
  }

  createBarChart() {
    const ref = this.ref;
    const width = 1260,
      height = 760;

    const tree = function (data, width, height) {
      const root = d3.hierarchy(data);
      root.dx = 80;
      root.dy = width / (root.height + 1);
      return d3.tree().nodeSize([root.dx, root.dy])(root);
    };

    const root = tree(this.data, width, height);
    let x0 = Infinity;
    let x1 = -x0;
    root.each((d) => {
      x1 = Math.max(x1, d.x);
      x0 = Math.min(x0, d.x);
    });

    const svg = d3
      .select(ref)
      .attr("viewBox", [0, 0, width, x1 - x0 + root.dx * 2]);

    const g = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 14)
      .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x)
      );

    const node = g
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("fill", (d) => (d.children ? "#555" : "#999"))
      .attr("r", 2.5);

    d3.scaleOrdinal(d3.schemeCategory10);
    node
      .append("rect")
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", "1")
      .attr("width", (d) => 256)
      .attr("height", (d) => 64)
      .attr("transform", (d) => `translate(0,-32)`);

    node
      .append("text")
      .attr("dy", (d) => 16)
      .attr("x", (d) => 6)
      .attr("text-anchor", (d) => "start")
      .text((d) => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");
  }

  render() {
    return (
      <svg ref={(node) => (this.ref = node)} width={960} height={760}></svg>
    );
  }
}

export default ThreadView;
