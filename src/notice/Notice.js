import React from "react";

import { notice } from "./../lib/route.jsx";

// React router
import { useParams } from "react-router-dom";

import { Card, Container } from "react-bootstrap";

import styles from "./Notice.module.css";

function ErrorPage() {
  return (
    <Card className={styles.page_card}>
      <Card.Body>
        <Card.Title>{"Oopsy daisy..."}</Card.Title>
        <Card.Text>
          {"Something went wrong, we are sorry about this 😓 "}
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

function SeeYou() {
  return (
    <Card className={styles.page_card}>
      <Card.Body>
        <Card.Title>{"Can't wait to see you again 💤"}</Card.Title>
        <Card.Text>{""}</Card.Text>
      </Card.Body>
    </Card>
  );
}

export function Notice() {
  const { page } = useParams();
  let card = null;
  if (page === notice.error) {
    card = <ErrorPage />;
  } else if (page === notice.seeYou) {
    card = <SeeYou />;
  }
  return <Container>{card}</Container>;
}
