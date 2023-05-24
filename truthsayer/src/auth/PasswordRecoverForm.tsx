import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { authentication } from 'smuggler-api'

interface PasswordRecoverFormProps {
  token: string
}

export const PasswordRecoverForm = ({ token }: PasswordRecoverFormProps) => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [isReady, setIsReady] = useState(false)
  const abortControllerRef = useRef(new AbortController())

  useEffect(() => {
    const ref = abortControllerRef
    return () => {
      ref.current.abort()
    }
  }, [])

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isReady = event.target.value.length > 6
    setPassword(event.target.value)
    setIsReady(isReady)
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await authentication.user.password.reset({
        token,
        new_password: password,
        signal: abortControllerRef.current.signal,
      })
      navigate('/login')
    } catch (err) {
      alert(`Error ${err}`)
    }
  }

  return (
    <Container>
      <Card className="border-0">
        <Card.Body className="p-3">
          <Card.Title>Set up new password</Card.Title>
          <Form className="m-4" onSubmit={onSubmit}>
            <Form.Group as={Row} controlId="formNewPassword">
              <Form.Label column sm="2">
                New password
              </Form.Label>
              <Col>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </Col>
            </Form.Group>
            <Button variant="secondary" type="submit" disabled={!isReady}>
              Change password
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}
