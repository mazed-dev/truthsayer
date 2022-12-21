import React from 'react'

export const reactNodeToString = (children: React.ReactNode) => {
  let label = ''
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string') {
      label += child
    } else if (typeof child === 'number') {
      label += child.toString()
    } else if (React.isValidElement(child)) {
      label += reactNodeToString(child.props.children)
    }
  })
  return label
}
