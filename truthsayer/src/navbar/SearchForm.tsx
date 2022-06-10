import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { Form } from 'react-bootstrap'

import styles from './SearchForm.module.css'

import { goto } from './../lib/route.js'

import lodash from 'lodash'

export function SearchForm({
  from,
  inFocus,
  className,
}: {
  from: string
  inFocus?: boolean
  className?: string
}) {
  const [value, setValue] = useState<string>(from)
  const searchCmdRef = useRef<HTMLInputElement>(null)
  const history = useHistory()

  useEffect(() => {
    if (inFocus) {
      searchCmdRef.current?.focus()
    }
  }, [inFocus])

  const gotoSearchResults_ = (query: string) => {
    if (value === '' || value.length > 1) {
      goto.search({ history, query })
    }
  }
  const gotoSearchResultsDebounced = useRef(
    lodash.debounce(gotoSearchResults_, 597)
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value
    setValue(v)
    gotoSearchResultsDebounced.current(v)
  }

  const handleSumbit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    goto.search({ history: history, query: value })
    gotoSearchResultsDebounced.current(value)
  }

  return (
    <Form onSubmit={handleSumbit} className={className}>
      <Form.Control
        aria-label="Search"
        onChange={handleChange}
        value={value}
        ref={searchCmdRef}
        placeholder="Search 🔎  "
        className={styles.search_input}
      />
    </Form>
  )
}
