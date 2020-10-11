import React from "react";

import styles from "./LinkGraph.module.css";

import * as d3 from "d3";

class LinkGraphImpl extends React.Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
  }

  componentDidUpdate() {
    this.createSvg();
  }

  cleanSvg = () => {
    const node = this.svgRef.current;
    while (node.firstChild) {
      node.removeChild(node.lastChild);
    }
  };

  createSvg = () => {
    this.cleanSvg();
    // console.log("LinkGraphImpl", this.props.edges);
    // this.props.edges.map((item, ind) => {
    //   console.log("createSvg::edge", item);
    // });
    const width = this.props.width;
    const height = this.props.height;

    const svg = d3
      .select(this.svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    let nodes = [];
    nodes.push([width / 2, height / 1.5]);
    nodes.push([width / 4, height / 3]);
    nodes.push([width / 1.7, height / 3]);

    for (let i = 0; i < nodes.length; i++) {
      svg
        .append("circle")
        .attr("cx", nodes[i][0])
        .attr("cy", nodes[i][1])
        .attr("r", 4)
        .style("fill", "blue");
    }

    let links = [];
    // Link from the first node to the second
    links.push(
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
        .attr("stroke", "green")
        .attr("stroke-width", "3")
        .attr("fill", "none");
    }
  };

  render() {
    return (
      <svg
        ref={this.svgRef}
        width={this.props.width}
        height={this.props.height}
      ></svg>
    );
  }
}

class LinkGraph extends React.Component {
  render() {
    return (
      <div className={styles.graph_div}>
        <LinkGraphImpl
          width={this.props.width}
          height={this.props.height}
          edges={this.props.edges}
        />
      </div>
    );
  }
}

export default LinkGraph;
