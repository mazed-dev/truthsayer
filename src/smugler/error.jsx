import HttpStatus from "http-status-codes";

// Custom HTTP status codes
const LOGIN_TIME_OUT: int = 440;

export function dealWithError(error) {
  console.log(error.config);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // console.log("Data", error.response.data);
    // console.log("Status", error.response.status);
    // console.log("Headers ", error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and
    // an instance of http.ClientRequest in node.js
    // console.log("Request:", error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    // console.log("Error message:", error.message);
  }
  console.log("Error -> ", error);
  if (error.response) {
    // if (HttpStatus.NOT_FOUND === error.response.status) {
    if (LOGIN_TIME_OUT === error.response.status) {
      window.location.href = "/logout";
    } else {
      throw error;
    }
  }
}

export default dealWithError;
