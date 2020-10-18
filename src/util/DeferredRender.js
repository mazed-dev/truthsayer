import React from "react";

class CrossBut extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_ready: false,
      cancel_id: null,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidUpdate(prevProps, prevState) {}

  startTimer = () => {
    const cancel_id = setTimeout(() => {
      this.setState({ is_ready: true });
    }, this.props.timeout);
    this.setState({
      cancel_id: cancel_id,
    });
    clearTimeout(this.state.cancel_id);
  };

  render() {
    if (!this.state.is_ready) {
      return <></>;
    }
    return <>{this.props.children}</>;
  }
}
