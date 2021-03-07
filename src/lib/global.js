import React from "react";

import crc from "crc";

import { Toast, Button } from "react-bootstrap";

import { joinClasses } from "./../util/elClass.js";

import styles from "./global.module.css";

const kMzdToastDefaultDelay = 4943; // Just a random number close to 5 seconds

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

export const MzdGlobalContext = React.createContext({
  toaster: {
    toasts: [],
    push: ({ header, message }) => {
      console.log("Default push() function called: ", header, message);
    },
  },
});

export class MzdGlobal extends React.Component {
  constructor(props) {
    super(props);
    this.pushToast = ({ message, title }) => {
      const uKey = crc.crc32(message) + "-" + Math.random();
      this.setState((state) => {
        return {
          toaster: {
            toasts: state.toaster.toasts.concat([
              <MzdToast message={message} title={title} key={uKey} />,
            ]),
            push: state.toaster.push,
          },
        };
      });
    };
    this.resetAuxToobar = (group) => {
      this.setState((state) => {
        return {
          topbar: {
            aux: group,
            reset: state.topbar.reset,
          },
        };
      });
    };
    this.logout = () => {
      this.setState((state) => {
        return {
          account: {
            account: null,
            logout: state.account.logout,
          },
        };
      });
    };
    this.state = {
      toaster: {
        toasts: [],
        push: this.pushToast,
      },
      topbar: {
        aux: null,
        reset: this.resetAuxToobar,
      },
    };
  }

  render() {
    return (
      <MzdGlobalContext.Provider value={this.state}>
        <div
          aria-live="polite"
          aria-atomic="true"
          className={joinClasses(styles.toaster_container)}
        >
          <div className={joinClasses(styles.toaster_root)}>
            {this.state.toaster.toasts}
          </div>
        </div>
        {this.props.children}
      </MzdGlobalContext.Provider>
    );
  }
}

// Example
export class ExampleWithStaticConsumer extends React.Component {
  constructor(props) {
    super(props);
  }

  onClick = () => {
    let toaster = this.context.toaster;
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

ExampleWithStaticConsumer.contextType = MzdGlobalContext;

export function ExampleWithElementConsumer() {
  return (
    <MzdGlobalContext.Consumer>
      {(context) => (
        <Button
          onClick={() => {
            context.toaster.push({
              title: "Example",
              message: "Toast message created from example class",
            });
          }}
        >
          Make a toast
        </Button>
      )}
    </MzdGlobalContext.Consumer>
  );
}
