import { ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE, logout } from "./common";

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

const getAccessToken = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN);
  const expiresIn = localStorage.getItem(EXPIRES_IN);
  const tokenType = localStorage.getItem(TOKEN_TYPE);
  //check if token has expired, token remains for 1hr
  if (Date.now() < expiresIn) {
    return { accessToken, tokenType };
  } else {
    logout();
  }
};

//read documentation of how to should we send a GET request with specific api endpoint.
const createAPIConfig = ({ accessToken, tokenType }, method = "GET") => {
  return {
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
    },
    method
  };
};

//we will call this function and change endpoint according to our usage
export const fetchRequest = async (endpoint) => {
  const url = `${BASE_API_URL}/${endpoint}`;
  const result = await fetch(url, createAPIConfig(getAccessToken()));
  return result.json();
};
