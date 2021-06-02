import React from "react";

export class ClickOutsideDetector extends React.Component {
  constructor(props) {
    super(props);
    this.selfRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener("mousedown", this._onClick, {
      capture: false,
      passive: true,
    });
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this._onClick, {
      capture: false,
    });
  }

  _onClick = (event) => {
    const { isActive } = this.props;
    if (
      isActive &&
      !this.selfRef.current.contains(event.target) &&
      !event.target.classList.contains("ignoreextclick")
    ) {
      const { onClick } = this.props;
      onClick(event);
    }
  };
  render() {
    const { children } = this.props;
    return <div ref={this.selfRef}>{children}</div>;
  }
}
