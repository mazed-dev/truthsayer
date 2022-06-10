import React from 'react'

import { notice, routes } from './../lib/route.js'

// React router
import { useParams, Link } from 'react-router-dom'

import { Card, Container, Button } from 'react-bootstrap'

import { MzdLink } from './../lib/MzdLink.js'

import styles from './Notice.module.css'

function ErrorPage() {
  return (
    <Card className={styles.page_card}>
      <Card.Body>
        <Card.Title>{'Oopsy daisy...'}</Card.Title>
        <Card.Text>
          {'Something went wrong, we are sorry about this 😓 '}
        </Card.Text>
      </Card.Body>
    </Card>
  )
}

function SeeYou() {
  return (
    <Card className={styles.page_card}>
      <Card.Body>
        <Card.Title>{"Can't wait to see you again 💤"}</Card.Title>
        <Card.Text>{''}</Card.Text>
      </Card.Body>
    </Card>
  )
}

function LogInToContinue() {
  return (
    <Card className={styles.page_card}>
      <Card.Body>
        <Card.Title>Please log in 🚀 </Card.Title>
        <Card.Text>
          Please <MzdLink to={routes.login}>log in to Mazed</MzdLink> or{' '}
          <MzdLink to={routes.signup}>create a new account</MzdLink> to
          continue.
        </Card.Text>
        <Button
          variant="secondary"
          as={Link}
          to={routes.login}
          className={styles.button}
        >
          Log in
        </Button>
        <Button
          variant="success"
          as={Link}
          to={routes.signup}
          className={styles.button}
        >
          Create account
        </Button>
      </Card.Body>
    </Card>
  )
}

export function Notice() {
  const { page } = useParams()
  let card = null
  if (page === notice.error) {
    card = <ErrorPage />
  } else if (page === notice.seeYou) {
    card = <SeeYou />
  } else if (page === notice.logInToContinue) {
    card = <LogInToContinue />
  }
  // *dbg*/ console.log('Notice page', page)
  return <Container>{card}</Container>
}
