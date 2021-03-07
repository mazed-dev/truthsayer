import React from "react";

import styles from "./LinkGraph.module.css";

import * as d3 from "d3";

class LinkGraphImpl extends React.Component {
  constructor(props) {
    super(props);
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

  createBarChart = () => {
    const ref = this.ref;
    const width = this.props.width;
    const height = this.props.height;

    // const tree = function (data, width, height) {
    //   const root = d3.hierarchy(data);
    //   root.dx = 80;
    //   root.dy = width / (root.height + 1);
    //   return d3.tree().nodeSize([root.dx, root.dy])(root);
    // };

    // const root = tree(this.data, width, height);
    // let x0 = Infinity;
    // let x1 = -x0;
    // root.each((d) => {
    //   x1 = Math.max(x1, d.x);
    //   x0 = Math.min(x0, d.x);
    // });

    const svg = d3.select(ref).attr("viewBox", [0, 0, width, height]);

    let nodes = [];
    nodes.push([width / 2, height / 1.5]);
    nodes.push([width / 4, height / 3]);
    nodes.push([width / 1.5, height / 3]);

    for (let i = 0; i < nodes.length; i++) {
      svg
        .append("circle")
        .attr("cx", nodes[i][0])
        .attr("cy", nodes[i][1])
        .attr("r", 20)
        .style("fill", "green");
    }

    let links = [];
    // Link from the first node to the second
    links.push(
      //d3.linkHorizontal()({
      d3.linkVertical()({
        source: nodes[0],
        target: nodes[1],
      })
    );

    // Link from the first node to the third
    links.push(
      d3.linkVertical()({
        source: nodes[0],
        target: nodes[2],
      })
    );

    // Append the links to the svg element
    for (let i = 0; i < links.length; i++) {
      svg
        .append("path")
        .attr("d", links[i])
        .attr("stroke", "black")
        .attr("fill", "none");
    }

    // return svg.node();

    // node
    //   .append("circle")
    //   .attr("fill", (d) => (d.children ? "#555" : "#999"))
    //   .attr("r", 2.5);

    // d3.scaleOrdinal(d3.schemeCategory10);
    // node
    //   .append("rect")
    //   .attr("fill", "white")
    //   .attr("stroke", "black")
    //   .attr("stroke-width", "1")
    //   .attr("width", (d) => 256)
    //   .attr("height", (d) => 64)
    //   .attr("transform", (d) => `translate(0,-32)`);

    // node
    //   .append("text")
    //   .attr("dy", (d) => 16)
    //   .attr("x", (d) => 6)
    //   .attr("text-anchor", (d) => "start")
    //   .text((d) => d.data.name)
    //   .clone(true)
    //   .lower()
    //   .attr("stroke", "white");
  };

  render() {
    return (
      <svg
        ref={(node) => (this.ref = node)}
        width={this.props.width}
        height={this.props.height}
      ></svg>
    );
  }
}

class LinkGraph extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log("LinkGraph::render()", this.props.width, this.props.height);
    return (
      <div className={styles.graph_div}>
        <LinkGraphImpl width={this.props.width} height={this.props.height} />
      </div>
    );
  }
}

export default LinkGraph;
