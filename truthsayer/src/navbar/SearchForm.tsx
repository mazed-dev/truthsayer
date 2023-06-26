import React, { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form } from 'react-bootstrap'
import { goto } from './../lib/route'
import { compass } from './../lib/route'

import lodash from 'lodash'

const SearchFormBox = styled(Form)`
  display: flex;
  justify-content: space-between;
  width: 32%;
  margin-right: 4px;
`
const SearchInput = styled(Form.Control)`
  border: none;
  border-color: rgba(0, 0, 0, 0.125);
  border-style: solid;
  border-width: 1px;
  border-radius: 56px;
`

export function SearchForm({
  inFocus,
  className,
}: {
  inFocus?: boolean
  className?: string
}) {
  const [value, setValue] = useState<string>('')
  const searchCmdRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    let { query } = compass.search.get({ location })
    if (Array.isArray(query)) {
      setValue(query.join(' '))
    }
  }, [location])

  useEffect(() => {
    if (inFocus) {
      searchCmdRef.current?.focus()
    }
  }, [inFocus])

  const gotoSearchResults_ = (query: string) => {
    if (value === '' || value.length > 1) {
      goto.search({ navigate, query })
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
    goto.search({ navigate, query: value })
    gotoSearchResultsDebounced.current(value)
  }

  return (
    <SearchFormBox onSubmit={handleSumbit} className={className}>
      <SearchInput
        aria-label="Search"
        onChange={handleChange}
        value={value}
        ref={searchCmdRef}
        placeholder="Search your memory"
      />
    </SearchFormBox>
  )
}
