import React from "react";
import { render } from "@testing-library/react";
import { _createAddingStickyEdgesRequest } from "./FullCardFootbar.js";

test("create adding sticky edges query - 1", () => {
  const sticky_edges = [
    {
      to_nid: "1",
      from_nid: "2",
      is_sticky: true,
    },
    {
      to_nid: "3",
      from_nid: "1",
      is_sticky: true,
    },
    {
      to_nid: "4",
      from_nid: "4",
      is_sticky: false,
    },
  ];
  const { edges } = _createAddingStickyEdgesRequest(sticky_edges, "1");
  expect(edges).toEqual([
    {
      from_nid: "2",
      is_sticky: true,
    },
    {
      to_nid: "3",
      is_sticky: true,
    },
  ]);
});

test("create adding sticky edges query - no sticky edges", () => {
  const sticky_edges = [
    {
      to_nid: "4",
      from_nid: "4",
      is_sticky: false,
    },
  ];
  const query = _createAddingStickyEdgesRequest(sticky_edges, "1");
  expect(query).toBeNull();
});

test("create adding sticky edges query - null sticky edges", () => {
  const query = _createAddingStickyEdgesRequest(null, "1");
  expect(query).toBeNull();
});
