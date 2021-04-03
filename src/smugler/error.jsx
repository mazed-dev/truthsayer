import HttpStatus from "http-status-codes";

// Custom HTTP status codes
const LOGIN_TIME_OUT: int = 440;

export function dealWithError(error) {
  console.log("Smugler API error:", error);
  // console.log(error.config);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log("Error data", error.response.data);
    console.log("Error status", error.response.status);
    console.log("Error headers ", error.response.headers);

    if (LOGIN_TIME_OUT === error.response.status) {
      window.location.href = "/logout";
    } else {
      throw error;
    }
    // if (HttpStatus.NOT_FOUND === error.response.status) {
  }
  if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and
    // an instance of http.ClientRequest in node.js
    console.log("Error request:", error.request);
  }
  if (error.message) {
    // Something happened in setting up the request that triggered an Error
    console.log("Error message:", error.message);
  }
}

export default dealWithError;
