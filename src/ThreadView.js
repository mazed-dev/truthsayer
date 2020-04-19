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
    this.data = {};
    this.data.links = [
      { source: "chile", target: "egypt", value: 1 },
      { source: "finland", target: "france", value: 1 },
      { source: "germany", target: "iceland", value: 1 },
      { source: "india", target: "china", value: 1 },
      { source: "denmark", target: "peru", value: 1 },
      { source: "romania", target: "russia", value: 1 },
      { source: "saudi_arabia", target: "singapore", value: 1 },
      { source: "germany", target: "netherlands", value: 1 },
      { source: "germany", target: "new_zealand", value: 1 },
      { source: "germany", target: "pakistan", value: 1 },
      { source: "germany", target: "peru", value: 1 },
      { source: "germany", target: "romania", value: 1 },
      { source: "germany", target: "russia", value: 1 },
      { source: "germany", target: "saudi_arabia", value: 1 },
      { source: "germany", target: "singapore", value: 1 },
      { source: "germany", target: "south_korea", value: 1 },
      { source: "germany", target: "spain", value: 1 },
      { source: "germany", target: "sweden", value: 1 },
      { source: "germany", target: "switzerland", value: 1 },
      { source: "germany", target: "thailand", value: 1 },
      { source: "germany", target: "turkey", value: 1 },
      { source: "germany", target: "united_arab_emirates", value: 1 },
      { source: "germany", target: "united_kingdom", value: 1 },
      { source: "germany", target: "united_states", value: 1 },
      { source: "spain", target: "argentina", value: 4 },
      { source: "spain", target: "australia", value: 4 },
      { source: "spain", target: "austria", value: 4 },
      { source: "spain", target: "bahrain", value: 4 },
      { source: "spain", target: "belgium", value: 4 },
      { source: "spain", target: "brazil", value: 4 },
      { source: "spain", target: "canada", value: 4 },
      { source: "indonesia", target: "denmark", value: 6 },
      { source: "iran", target: "denmark", value: 6 },
      { source: "iraq", target: "denmark", value: 6 },
      { source: "israel", target: "denmark", value: 6 },
      { source: "italy", target: "denmark", value: 6 },
      { source: "japan", target: "denmark", value: 6 },
      { source: "luxembourg", target: "denmark", value: 6 },
      { source: "malaysia", target: "denmark", value: 6 },
      { source: "mexico", target: "denmark", value: 6 },
      { source: "peru", target: "finland", value: 4 },
      { source: "peru", target: "egypt", value: 5 },
      { source: "peru", target: "china", value: 5 },
    ];
    this.data.nodes = [
      { value: 1, id: "argentina", label: "Argentina" },
      { value: 1, id: "australia", label: "Australia" },
      { value: 1, id: "austria", label: "Austria" },
      { value: 1, id: "bahrain", label: "Bahrain" },
      { value: 1, id: "belgium", label: "Belgium" },
      { value: 1, id: "brazil", label: "Brazil" },
      { value: 1, id: "canada", label: "Canada" },
      { value: 1, id: "chile", label: "Chile" },
      { value: 1, id: "china", label: "China" },
      { value: 1, id: "denmark", label: "Denmark" },
      { value: 1, id: "egypt", label: "Egypt" },
      { value: 1, id: "finland", label: "Finland" },
      { value: 1, id: "france", label: "France" },
      { value: 1, id: "germany", label: "Germany" },
      { value: 1, id: "iceland", label: "Iceland" },
      { value: 1, id: "india", label: "India" },
      { value: 1, id: "indonesia", label: "Indonesia" },
      { value: 1, id: "iran", label: "Iran" },
      { value: 1, id: "iraq", label: "Iraq" },
      { value: 1, id: "israel", label: "Israel" },
      { value: 1, id: "italy", label: "Italy" },
      { value: 1, id: "japan", label: "Japan" },
      { value: 1, id: "luxembourg", label: "Luxembourg" },
      { value: 1, id: "malaysia", label: "Malaysia" },
      { value: 1, id: "mexico", label: "Mexico" },
      { value: 1, id: "netherlands", label: "Netherlands" },
      { value: 1, id: "new_zealand", label: "New Zealand" },
      { value: 1, id: "pakistan", label: "Pakistan" },
      { value: 1, id: "peru", label: "Peru" },
      { value: 1, id: "romania", label: "Romania" },
      { value: 1, id: "russia", label: "Russia" },
      { value: 1, id: "saudi_arabia", label: "Saudi Arabia" },
      { value: 1, id: "singapore", label: "Singapore" },
      { value: 1, id: "south_korea", label: "South Korea" },
      { value: 1, id: "spain", label: "Spain" },
      { value: 1, id: "sweden", label: "Sweden" },
      { value: 1, id: "switzerland", label: "Switzerland" },
      { value: 1, id: "thailand", label: "Thailand" },
      { value: 1, id: "turkey", label: "Turkey" },
      { value: 1, id: "united_arab_emirates", label: "United Arab Emirates" },
      { value: 1, id: "united_kingdom", label: "United Kingdom" },
      { value: 1, id: "united_states", label: "United States" },
    ];
  }

  componentDidMount() {
    this.createBarChart();
  }

  componentDidUpdate() {
    this.createBarChart();
  }

  createBarChart() {
    const ref = this.ref;
    const width = 960,
      height = 760;
    const links = this.data.links.map((d) => Object.create(d));
    const nodes = this.data.nodes.map((d) => Object.create(d));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    const drag = (simulation) => {
      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }
      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    };

    const data = [2, 4, 2, 6, 8];

    const svg = d3
      .select(ref)
      .attr("viewBox", [0, 0, width, height])
      .style("border", "1px solid black");

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Works
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .attr("stroke", "green");

    node.append("title").text((d) => d.label);

    // node.append("text")
    //   .text(d => d.label);

    // const node = svg.selectAll(".node").data(nodes).enter().append("g");
    //   node.append("circle").attr("class", "node").attr("r", 4.5).attr("fill", "orange")
    //   node.append("text").text(d => d.label);

    // const node = svg.selectAll("g")
    //   .data(nodes)
    //   .attr("stroke", "#fff")
    //   .attr("stroke-width", 0.5)
    //   .enter()
    //   .append("g");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    // .selectAll('.node')
    // .data(flatten(kDataTree))
    // .enter().append("g")
    // .attr("class", "node")
    // .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    //n.append("circle")
    //    .attr("r", function(d) { return d.r; });
  }

  render() {
    return (
      <svg ref={(node) => (this.ref = node)} width={960} height={760}></svg>
    );
  }
}

export default ThreadView;

// Returns a flattened hierarchy containing all leaf nodes under the root.
// function flatten(root) {
//   var nodes = [];
//
//   function recurse(node) {
//     if (node.children) {
//       node.children.forEach(recurse);
//     } else {
//       nodes.push({name: node.name, "value": node.size});
//     }
//   }
//
//   recurse(root);
//   return {children: nodes};
// }
