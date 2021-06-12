import React from 'react'
import './App.css'

/**
 * function tick() {
 *   const element = (
 *     <div>
 *       <h1>Hello, world!</h1>
 *       <h2>It is {new Date().toLocaleTimeString()}.</h2>
 *     </div>
 *   );
 *   ReactDOM.render(element, document.getElementById('root'));}
 *
 *   setInterval(tick, 1000);
 * }
 */

class NodeCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: 'O',
    }
  }

  render() {
    return (
      <button
        className="square"
        onClick={() => {
          if (this.state.value === 'O') {
            this.setState({ value: 'X' })
          } else {
            this.setState({ value: 'O' })
          }
        }}
      >
        NodeCard &nbsp;
        {this.state.value}
      </button>
    )
  }
}

export default NodeCard
