import HttpStatus from "http-status-codes";
import axios from "axios";

function remoteErrorHandler(history) {
  return (error) => {
    console.log(error);
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      if (HttpStatus.UNAUTHORIZED === error.response.status) {
        history.push({
          pathname: "/login",
        });
      }
    }
  };
}

export default remoteErrorHandler;
