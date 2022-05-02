import { ButtonGroup, Dropdown } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import React, { useState } from 'react'

import { jcss } from 'elementary'

// type CounterToggleProps = React.HTMLProps<HTMLSpanElement> & {
//     onClick: React.MouseEventHandler
//     counter: number
//   }

//   // Custom dropdown components must be able to accept refs. See
//   // https://react-bootstrap.github.io/components/dropdowns/#custom-dropdown-components
//   // for more details.
//   const CounterToggle = React.forwardRef<HTMLSpanElement, CounterToggleProps>(
//     ({ children, onClick }, ref) => (
//       <span
//         // href=""
//         ref={ref}
//         onClick={(e) => {
//           e.preventDefault()
//           onClick(e)
//         }}
//       >
//         {children}
//       </span>
//     )
//   )

//   type OverallCounter = {
//     [key: string]: number
//   }

//   function countTotal(counter: OverallCounter) {
//     let ret = 0
//     for (const key in counter) {
//       ret += counter[key]
//     }
//     return ret
//   }

//   type CloudIntegration = {
//     fetchAll: () => void
//   }

//   function CloudSync({
//     // TODO[snikitin@outlook.com] construct the integration somewhere around here,
//     // it'll allow to pass `setOneDriveCounter` to it as a callback -
//     // avoids researching the best practices around signaling in JS
//     integration,
//   }: {
//     integration: CloudIntegration
//   }) {
//     const [counter, setCounter] = useState<OverallCounter>({})
//     const setOneDriveCounter = (oneDriveCounter: number) => {
//       setCounter({ ...counter, onedrive: oneDriveCounter })
//     }

//     const total = countTotal(counter)
//     const counterStr = total > 0 ? `(${total} pending)` : ''

//     const onClick: React.MouseEventHandler = () => {
//       integration.fetchAll()
//     }
//     return (
//       <Dropdown>
//         <Dropdown.Toggle variant="success" id="dropdown-basic">
//           Cloud sync {counterStr}
//         </Dropdown.Toggle>

//         <Dropdown.Menu>
//           <Dropdown.Item as="button" onClick={onClick}>
//             Microsoft OneDrive
//            />
//           </Dropdown.Item>
//         </Dropdown.Menu>
//       </Dropdown>
//     )
//   }
