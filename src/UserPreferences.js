import React from "react";

// React router
import { Link } from "react-router-dom";

import { Button, Container, Image } from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

import user_default_pic from "./user-default-pic.png";

class UserPreferences extends React.Component {
  // pub struct AccountInfo<'a> {
  //     pub uid: &'a str,
  //     pub name: &'a str,
  //     pub email: &'a str,
  // }
  constructor(props) {
    super(props);
    this.axiosCancelToken = axios.CancelToken.source();
    this.state = {
      name: "user",
      email: "email",
    };
  }

  componentDidMount() {
    axios
      .get("/api/auth", {
        cancelToken: this.axiosCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState({
            name: res.data.name,
            email: res.data.email,
          });
        }
      });
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  render() {
    // TODO: use custom user uploaded picture for userpic here
    return (
      <Container>
        <div className="d-flex flex-column justify-content-right m-2">
          <h2>Account preferences</h2>
          <Image
            src={user_default_pic}
            roundedCircle
            fluid
            width="90"
            height="90"
            className="m-2"
          />
          <table className="m-2">
            <tbody>
              <tr>
                <td className="px-4 py-1">{"name"}</td>
                <td>{this.state.name}</td>
              </tr>
              <tr>
                <td className="px-4 py-1">{"email"}</td>
                <td>{this.state.email}</td>
              </tr>
              <tr className="py-1">
                <td className="px-4">{"password"}</td>
                <td className="">
                  <Link to="/password-recover-change">*******************</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Button variant="outline-secondary" as={Link} to="/" className="m-2">
          Go back
        </Button>
      </Container>
    );
  }
}

export default withRouter(UserPreferences);
