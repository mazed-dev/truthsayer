import React from "react";

import crc from "crc";

import { Toast, Button } from "react-bootstrap";

import { joinClasses } from "./../util/elClass.js";

import styles from "./toaster.module.css";

const kMzdToastDefaultDelay = 4943; // Just a random number close to 5 seconds

// export function makeAToast({ delay }) {
//   delay = delay || 3000;
// }

class MzdToast extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
    };
  }

  hide = () => {
    this.setState({
      show: false,
    });
  };

  render() {
    const delay = this.props.delay || kMzdToastDefaultDelay;
    return (
      <Toast onClose={this.hide} show={this.state.show} delay={delay} autohide>
        <Toast.Header>
          <strong className="mr-auto">{this.props.title}</strong>
        </Toast.Header>
        <Toast.Body>{this.props.message}</Toast.Body>
      </Toast>
    );
  }
}

MzdToast.defaultProps = {
  delay: kMzdToastDefaultDelay,
};

export const MzdToasterContext = React.createContext({
  toasts: [],
  push: ({ header, message }) => {
    console.log("Default push() function called: ", header, message);
  },
});

export class MzdToaster extends React.Component {
  constructor(props) {
    super(props);
    this.pushToast = ({ message, title }) => {
      const uKey = crc.crc32(message) + "-" + Math.random();
      this.setState((state) => {
        return {
          toasts: state.toasts.concat([
            <MzdToast message={message} title={title} key={uKey} />,
          ]),
        };
      });
    };
    this.state = {
      toasts: [],
      push: this.pushToast,
    };
  }

  render() {
    return (
      <MzdToasterContext.Provider value={this.state}>
        <div
          aria-live="polite"
          aria-atomic="true"
          className={joinClasses(styles.toaster_container)}
        >
          <div className={joinClasses(styles.toaster_root)}>
            {this.state.toasts}
          </div>
        </div>
        {this.props.children}
      </MzdToasterContext.Provider>
    );
  }
}

// Example
export class ExampleWithStaticConsumer extends React.Component {
  constructor(props) {
    super(props);
  }

  onClick = () => {
    let toaster = this.context;
    toaster.push({
      title: "Example",
      message: "Toast message created from example class",
    });
  };

  render() {
    return (
      <Button variant="primary" onClick={this.onClick}>
        Make a toast
      </Button>
    );
  }
}

ExampleWithStaticConsumer.contextType = MzdToasterContext;

export function ExampleWithElementConsumer() {
  return (
    <MzdToasterContext.Consumer>
      {(toaster) => (
        <Button
          onClick={() => {
            toaster.push({
              title: "Example",
              message: "Toast message created from example class",
            });
          }}
        >
          Make a toast
        </Button>
      )}
    </MzdToasterContext.Consumer>
  );
}
