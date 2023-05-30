import { ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE } from "../common";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const APP_URL = import.meta.env.VITE_APP_URL;
const scopes =
  "user-top-read user-follow-read playlist-read-private user-library-read";
const authorizeUser = () => {
  // https://developer.spotify.com/documentation/web-api/tutorials/implicit-flow
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${scopes}&show_dialog=true`;
  window.open(url, "login", "width=800,height=600");
};

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-to-spotify");
  loginButton.addEventListener("click", authorizeUser);
});

window.setItemsInLocalStorage = ({ accessToken, tokenType, expiresIn }) => {
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_TYPE, tokenType);
  localStorage.setItem(EXPIRES_IN,(Date.now() + (expiresIn * 1000)));
  window.location.href = APP_URL;
};

//when the small window pops up
window.addEventListener("load", () => {
  //check if accessToken is already present, if present then redirect to dashboard
  const accessToken = localStorage.getItem(ACCESS_TOKEN);
  if (accessToken) {
    window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  }

  //check if the login page is opened in pop up window
  if (window.opener !== null && !window.opener.closed) {
    //check if login page opened in pop up has errors
    window.focus();
    //if error exist then close the window
    if (window.location.href.includes("error")) {
      window.close();
    }

    // get hash from location
    const { hash } = window.location;

    //pass this hash to URLSearchParams which allows us to access properties using key value pairs
    const searchParams = new URLSearchParams(hash);
    const accessToken = searchParams.get("#access_token");

    // #access_token = BQCpXqx_mZoHhCEIoAGbjxJqIG - QSlTm6zyM_zN6dqZhpvXxYGfF7ZKeLQd9dM3NX5QvJmQ1ovlOVGrsAw_vrURimONPMfRhn2J - mZXWlhnNVTZAcxvULe3YMNZZGhmr - PaZVpfBYDUbnsfQ9KFiFzFttfElKp - xwchWrbkoB8rf6_ggOLntd6jo0iUVMgz_FgFWAFbKffJHmspKCUzWS03NrTEdsXlKTBBiIQ & token_type=Bearer & expires_in=3600

    const tokenType = searchParams.get("token_type");
    const expiresIn = searchParams.get("expires_in");

    //if we get accessToken from above URL then we close this popup windows
    if (accessToken) {
      window.close();

      //The window from which this popup was opened
      //we are setting the items with those key value pairs
      window.opener.setItemsInLocalStorage({
        accessToken,
        tokenType,
        expiresIn,
      });
    } else {
      window.close();
    }
  }
});
